"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import { generateInvitationCopy } from "@/lib/ai/generate-copy";
import {
  invitationWizardSchema,
  publishGuestInvitationSchema,
  type InvitationWizardFormValues,
} from "@/lib/validations/invitation";
import { DEFAULT_SECTION_ORDER, uniqueSlug } from "@/lib/invitation-helpers";
import type { ActionResult } from "@/lib/actions/auth";
import type { EventCategoryContent } from "@/lib/event-categories";
import { normalizePhone } from "@/lib/phone";
import { generateToken, hashToken } from "@/lib/otp";
import { sendWhatsAppText, editLinkMessage } from "@/lib/whatsapp";
import { issueDraftSecret, issueOwnerCookie } from "@/lib/guest-session";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { pickStockPhotos } from "@/lib/media/stock-photos";
import { DEFAULT_PHOTO_COUNT } from "@/lib/media/constants";

/**
 * Shared by both the anonymous "Get started" flow and the signed-in
 * dashboard flow — the same wizard, actions, and section layout serve
 * both, so an invitation created here is authorized either by a
 * session (dashboard) or a draft/owner cookie (guest). See
 * authorizeInvitationAccess for the actual check.
 */
async function loadInvitation(invitationId: string) {
  return authorizeInvitationAccess(invitationId);
}

export async function createDraftInvitationAction(): Promise<
  ActionResult<{ invitationId: string; isOwnerSession: boolean }>
> {
  const session = await auth();
  const slug = await uniqueSlug(`draft-${Date.now()}`);

  const invitation = await db.invitation.create({
    data: {
      userId: session?.user?.id,
      slug,
      brideName: "",
      groomName: "",
      weddingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      sectionConfig: DEFAULT_SECTION_ORDER.map((type, order) => ({
        id: type,
        type,
        visible: true,
        locked: false,
        order,
      })),
    },
  });

  if (!session?.user) {
    const draftSecretHash = await issueDraftSecret(invitation.id);
    await db.invitation.update({ where: { id: invitation.id }, data: { draftSecretHash } });
  }

  return {
    success: true,
    data: { invitationId: invitation.id, isOwnerSession: Boolean(session?.user) },
  };
}

export async function updateGuestInvitationAction(
  invitationId: string,
  input: InvitationWizardFormValues,
): Promise<ActionResult<{ invitationId: string; slug: string }>> {
  const invitation = await loadInvitation(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const parsed = invitationWizardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const theme = await db.theme.findUnique({ where: { slug: data.themeSlug } });
  if (!theme || theme.type !== "WEBSITE") return { success: false, error: "Unknown theme selected." };
  const template = await db.template.findFirst({ where: { themeId: theme.id } });

  // A colourway is one of the theme's palettes. Its palette is copied onto
  // the invitation so every render path keeps reading colorPalette and never
  // needs to resolve colourways itself.
  const colorway = data.colorwaySlug
    ? await db.themeColorway.findUnique({
        where: { themeId_slug: { themeId: theme.id, slug: data.colorwaySlug } },
      })
    : null;

  // No music picked or uploaded — fall back to the admin-flagged default
  // track (if one exists) so the invitation never plays silent.
  let musicTrackId = data.musicTrackId || null;
  if (!musicTrackId && !data.customMusicUrl) {
    const defaultTrack = await db.musicTrack.findFirst({ where: { isDefault: true } });
    musicTrackId = defaultTrack?.id ?? null;
  }

  const slug = invitation.slug.startsWith("draft-")
    ? await uniqueSlug([data.brideName, data.groomName].filter(Boolean).join("-"))
    : invitation.slug;

  const weddingDate = new Date(data.weddingDate);
  const weddingDateDisplay = weddingDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let aiGeneratedCopy = null;
  let aiGenerated = false;
  if (data.useAiCopy) {
    const copy = await generateInvitationCopy({
      brideName: data.brideName,
      groomName: data.groomName,
      weddingDateDisplay,
      venueName: data.venueName,
      customMessage: data.customMessage,
      eventCategory: data.eventCategory,
      themeContent: theme.content as Partial<EventCategoryContent> | null,
    });
    aiGeneratedCopy = copy;
    aiGenerated = copy.source !== "template";
  }

  await db.invitation.update({
    where: { id: invitationId },
    data: {
      slug,
      eventCategory: data.eventCategory,
      brideName: data.brideName,
      bridePhoto: data.bridePhoto,
      groomName: data.groomName,
      groomPhoto: data.groomPhoto,
      weddingDate,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      googleMapsUrl: data.googleMapsUrl || null,
      customMessage: data.customMessage,
      religion: data.religion || null,
      caste: data.caste || null,
      themeId: theme.id,
      templateId: template?.id,
      colorwayId: colorway?.id ?? null,
      colorPalette: colorway?.colorPalette ?? undefined,
      musicTrackId,
      customMusicUrl: data.customMusicUrl || null,
      aiGenerated,
      aiGeneratedCopy: aiGeneratedCopy ?? undefined,
      seoTitle: aiGeneratedCopy?.seoTitle,
      seoDescription: aiGeneratedCopy?.seoDescription,
      events: {
        deleteMany: {},
        create: data.events.map((event, order) => ({
          name: event.name,
          date: new Date(event.date),
          time: event.time,
          venueName: event.venueName,
          address: event.address,
          googleMapsUrl: event.googleMapsUrl || null,
          dressCode: event.dressCode,
          accentColor: event.accentColor,
          tagline: event.tagline,
          order,
        })),
      },
      familyMembers: {
        deleteMany: {},
        create: data.familyMembers
          .filter((member) => member.name.trim() && member.relation.trim())
          .map((member, order) => ({
            side: member.side,
            relation: member.relation.trim(),
            name: member.name.trim(),
            order,
          })),
      },
    },
  });

  revalidatePath(`/invite/${slug}`);
  revalidatePath(`/manage/${invitationId}`);

  return { success: true, data: { invitationId, slug } };
}

export async function autoFillPhotosAction(
  invitationId: string,
): Promise<ActionResult<{ added: number; media: { id: string; url: string; isAuto: boolean }[] }>> {
  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const existing = await db.media.findMany({
    where: { invitationId },
    orderBy: { order: "asc" },
  });

  const needed = Math.max(0, DEFAULT_PHOTO_COUNT - existing.length);
  if (needed > 0) {
    const urls = pickStockPhotos(
      needed,
      existing.map((m) => m.url),
    );
    await db.media.createMany({
      data: urls.map((url, i) => ({
        invitationId,
        url,
        type: "IMAGE" as const,
        isAuto: true,
        order: existing.length + i,
      })),
    });
  }

  const media = await db.media.findMany({ where: { invitationId }, orderBy: { order: "asc" } });
  return {
    success: true,
    data: { added: needed, media: media.map((m) => ({ id: m.id, url: m.url, isAuto: m.isAuto })) },
  };
}

/**
 * Publishes a guest-flow invitation immediately — no WhatsApp OTP code to
 * wait on or get stuck at. Still collects a phone number (one number per
 * invitation, same as before) so the invitation gets a durable `PhoneLink`
 * and a private edit link usable from any device, and still attempts to
 * send that edit link over WhatsApp as a courtesy — but delivery is
 * best-effort and never blocks publishing, since it's shown on-screen too.
 */
export async function publishGuestInvitationAction(
  input: { invitationId: string; phone?: string },
): Promise<ActionResult<{ slug: string; liveUrl: string; editUrl: string | null }>> {
  const parsed = publishGuestInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const invitation = await loadInvitation(parsed.data.invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };
  if (invitation.userId) {
    return {
      success: false,
      error: "This invitation is managed from the dashboard — publish it from Deploy.",
    };
  }

  if (!invitation.brideName || !invitation.groomName) {
    return { success: false, error: "Finish the couple details step first." };
  }
  // The number is optional: publishing without one still works, it just
  // means no durable cross-device edit link yet — this browser's cookie
  // carries access, and the manage page asks for a number afterwards.
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : invitation.phoneLink?.phone;

  if (!phone) {
    const publishedWithoutPhone = await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "PUBLISHED", publishedAt: invitation.publishedAt ?? new Date() },
    });

    const baseUrl = getAppUrl();
    revalidatePath(`/invite/${publishedWithoutPhone.slug}`);
    revalidatePath(`/manage/${invitation.id}`);

    return {
      success: true,
      data: {
        slug: publishedWithoutPhone.slug,
        liveUrl: `${baseUrl}/invite/${publishedWithoutPhone.slug}`,
        editUrl: null,
      },
    };
  }

  const conflictingLink = await db.phoneLink.findUnique({ where: { phone } });
  if (conflictingLink && conflictingLink.invitationId !== invitation.id) {
    return {
      success: false,
      error:
        "This mobile number is already linked to another invitation. One number can own only one invitation — use the edit link sent to that number, or use a different number.",
    };
  }
  if (invitation.phoneLink && invitation.phoneLink.phone !== phone) {
    return {
      success: false,
      error: "This invitation is already linked to a different mobile number.",
    };
  }

  const rawEditToken = generateToken();
  const editTokenHash = hashToken(rawEditToken);

  let phoneLink = invitation.phoneLink;
  if (!phoneLink) {
    try {
      phoneLink = await db.phoneLink.create({
        data: { phone, invitationId: invitation.id, editTokenHash },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await db.phoneLink.findUnique({ where: { phone } });
        if (!existing || existing.invitationId !== invitation.id) {
          return {
            success: false,
            error: "This mobile number was just linked to another invitation. Use a different number.",
          };
        }
        phoneLink = existing;
      } else {
        throw error;
      }
    }
  } else {
    // Already linked (e.g. re-publishing after an edit) — rotate the edit
    // token so the freshly issued owner cookie/link stays in sync.
    phoneLink = await db.phoneLink.update({
      where: { id: phoneLink.id },
      data: { editTokenHash },
    });
  }

  const updated = await db.invitation.update({
    where: { id: invitation.id },
    data: { status: "PUBLISHED", publishedAt: invitation.publishedAt ?? new Date() },
  });

  await issueOwnerCookie(invitation.id, rawEditToken);

  const appUrl = getAppUrl();
  const liveUrl = `${appUrl}/invite/${updated.slug}`;
  const editUrl = `${appUrl}/e/${rawEditToken}`;

  sendWhatsAppText(
    phone,
    editLinkMessage(invitation.brideName, invitation.groomName, liveUrl, editUrl),
  ).catch((error) => console.error("Failed to send edit-link WhatsApp message", error));

  revalidatePath(`/invite/${updated.slug}`);
  revalidatePath(`/manage/${invitation.id}`);

  return {
    success: true,
    data: { slug: updated.slug, liveUrl, editUrl },
  };
}

/**
 * Attaches a mobile number to an already-published invitation that went out
 * without one, minting the durable cross-device edit link that publishing
 * without a number deliberately skips.
 */
export async function attachPhoneToInvitationAction(input: {
  invitationId: string;
  phone: string;
}): Promise<ActionResult<{ editUrl: string }>> {
  const invitation = await authorizeInvitationAccess(input.invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const phone = normalizePhone(input.phone);
  if (!phone || phone.length < 6) {
    return { success: false, error: "Enter a valid mobile number." };
  }

  const existingForPhone = await db.phoneLink.findUnique({ where: { phone } });
  if (existingForPhone && existingForPhone.invitationId !== invitation.id) {
    return {
      success: false,
      error: "That number already belongs to another invitation. Use a different one.",
    };
  }

  const rawEditToken = generateToken();
  const editTokenHash = hashToken(rawEditToken);

  if (invitation.phoneLink) {
    await db.phoneLink.update({
      where: { id: invitation.phoneLink.id },
      data: { phone, editTokenHash },
    });
  } else {
    await db.phoneLink.create({
      data: { phone, invitationId: invitation.id, editTokenHash },
    });
  }

  await issueOwnerCookie(invitation.id, rawEditToken);

  const editUrl = `${getAppUrl()}/e/${rawEditToken}`;
  const liveUrl = `${getAppUrl()}/invite/${invitation.slug}`;

  sendWhatsAppText(
    phone,
    editLinkMessage(invitation.brideName, invitation.groomName, liveUrl, editUrl),
  ).catch((error) => console.error("Failed to send edit-link WhatsApp message", error));

  revalidatePath(`/manage/${invitation.id}`);
  return { success: true, data: { editUrl } };
}
