"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import { generateInvitationCopy } from "@/lib/ai/generate-copy";
import {
  invitationWizardSchema,
  otpRequestSchema,
  otpVerifySchema,
  type InvitationWizardInput,
} from "@/lib/validations/invitation";
import { DEFAULT_SECTION_ORDER, uniqueSlug } from "@/lib/invitation-helpers";
import type { ActionResult } from "@/lib/actions/auth";
import { normalizePhone } from "@/lib/phone";
import { generateOtp, hashOtp, verifyOtp, generateToken, hashToken } from "@/lib/otp";
import { sendWhatsAppText, otpMessage, editLinkMessage } from "@/lib/whatsapp";
import { issueDraftSecret, issueOwnerCookie } from "@/lib/guest-session";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { pickStockPhotos } from "@/lib/media/stock-photos";
import { REQUIRED_PHOTO_COUNT } from "@/lib/media/constants";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
const OTP_MAX_ATTEMPTS = 5;

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
  input: InvitationWizardInput,
): Promise<ActionResult<{ invitationId: string; slug: string }>> {
  const invitation = await loadInvitation(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const parsed = invitationWizardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const theme = await db.theme.findUnique({ where: { slug: data.themeSlug } });
  if (!theme) return { success: false, error: "Unknown theme selected." };
  const template = await db.template.findFirst({ where: { themeId: theme.id } });

  // No music picked or uploaded — fall back to the admin-flagged default
  // track (if one exists) so the invitation never plays silent.
  let musicTrackId = data.musicTrackId || null;
  if (!musicTrackId && !data.customMusicUrl) {
    const defaultTrack = await db.musicTrack.findFirst({ where: { isDefault: true } });
    musicTrackId = defaultTrack?.id ?? null;
  }

  const slug = invitation.slug.startsWith("draft-")
    ? await uniqueSlug(`${data.brideName}-${data.groomName}`)
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
      language: data.language,
      customMessage: data.customMessage,
    });
    aiGeneratedCopy = copy;
    aiGenerated = copy.source !== "template";
  }

  await db.invitation.update({
    where: { id: invitationId },
    data: {
      slug,
      brideName: data.brideName,
      bridePhoto: data.bridePhoto,
      groomName: data.groomName,
      groomPhoto: data.groomPhoto,
      weddingDate,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      googleMapsUrl: data.googleMapsUrl || null,
      customMessage: data.customMessage,
      language: data.language,
      themeId: theme.id,
      templateId: template?.id,
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
        create: data.familyMembers.map((member, order) => ({
          side: member.side,
          relation: member.relation,
          name: member.name,
          photo: member.photo,
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

  const needed = Math.max(0, REQUIRED_PHOTO_COUNT - existing.length);
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

export async function requestPublishOtpAction(
  input: { invitationId: string; phone: string },
): Promise<ActionResult<{ devMode: boolean; devCode?: string }>> {
  const parsed = otpRequestSchema.safeParse(input);
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
  const mediaCount = await db.media.count({ where: { invitationId: invitation.id } });
  if (mediaCount < REQUIRED_PHOTO_COUNT) {
    return { success: false, error: `Add ${REQUIRED_PHOTO_COUNT} photos before publishing.` };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { success: false, error: "Enter a valid mobile number." };

  const conflictingLink = await db.phoneLink.findUnique({ where: { phone } });
  if (conflictingLink && conflictingLink.invitationId !== invitation.id) {
    return {
      success: false,
      error:
        "This mobile number is already linked to another invitation. One WhatsApp number can publish only one invitation — use the edit link sent to that number, or use a different number.",
    };
  }
  if (invitation.phoneLink && invitation.phoneLink.phone !== phone) {
    return {
      success: false,
      error: "This invitation is already linked to a different mobile number.",
    };
  }

  const recent = await db.otpChallenge.findFirst({
    where: { invitationId: invitation.id, phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return { success: false, error: "Please wait a few seconds before requesting another code." };
  }

  const code = generateOtp();
  const salt = `${invitation.id}:${phone}`;
  await db.otpChallenge.create({
    data: {
      invitationId: invitation.id,
      phone,
      codeHash: hashOtp(code, salt),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const { delivered } = await sendWhatsAppText(
    phone,
    otpMessage(code, invitation.brideName, invitation.groomName),
  );

  // Show the code on-screen whenever we can't confirm it actually reached
  // WhatsApp — not configured, or configured but the send itself failed
  // (bad token, unverified number, Meta API error, etc.) — so a guest is
  // never stuck with no way to get their code.
  return {
    success: true,
    data: { devMode: !delivered, devCode: !delivered ? code : undefined },
  };
}

export async function verifyPublishOtpAction(
  input: { invitationId: string; phone: string; code: string },
): Promise<ActionResult<{ slug: string; liveUrl: string; editUrl: string; devMode: boolean }>> {
  const parsed = otpVerifySchema.safeParse(input);
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

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { success: false, error: "Enter a valid mobile number." };

  const challenge = await db.otpChallenge.findFirst({
    where: { invitationId: invitation.id, phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) {
    return { success: false, error: "That code expired. Request a new one." };
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, error: "Too many incorrect attempts. Request a new code." };
  }

  const salt = `${invitation.id}:${phone}`;
  if (!verifyOtp(parsed.data.code, salt, challenge.codeHash)) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Incorrect code. Please try again." };
  }

  await db.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });

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
  }

  const updated = await db.invitation.update({
    where: { id: invitation.id },
    data: { status: "PUBLISHED", publishedAt: invitation.publishedAt ?? new Date() },
  });

  await issueOwnerCookie(invitation.id, rawEditToken);

  const appUrl = getAppUrl();
  const liveUrl = `${appUrl}/invite/${updated.slug}`;
  const editUrl = `${appUrl}/e/${rawEditToken}`;

  const { delivered } = await sendWhatsAppText(
    phone,
    editLinkMessage(invitation.brideName, invitation.groomName, liveUrl, editUrl),
  );

  revalidatePath(`/invite/${updated.slug}`);
  revalidatePath(`/manage/${invitation.id}`);

  return {
    success: true,
    data: { slug: updated.slug, liveUrl, editUrl, devMode: !delivered },
  };
}
