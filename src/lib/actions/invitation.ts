"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvitationCopy } from "@/lib/ai/generate-copy";
import {
  invitationWizardSchema,
  type InvitationWizardInput,
} from "@/lib/validations/invitation";
import type { ActionResult } from "@/lib/actions/auth";
import { DEFAULT_SECTION_ORDER, uniqueSlug } from "@/lib/invitation-helpers";
import { DEFAULT_PHOTO_COUNT } from "@/lib/media/constants";
import { pickStockPhotos } from "@/lib/media/stock-photos";
import { generateToken, hashToken } from "@/lib/otp";
import { getAppUrl } from "@/lib/app-url";
import { normalizePhone } from "@/lib/phone";

export async function createInvitationAction(
  input: InvitationWizardInput,
): Promise<ActionResult<{ invitationId: string; slug: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = invitationWizardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  const theme = await db.theme.findUnique({ where: { slug: data.themeSlug } });
  if (!theme || theme.type !== "WEBSITE") return { success: false, error: "Unknown theme selected." };

  const template = await db.template.findFirst({ where: { themeId: theme.id } });

  const slug = await uniqueSlug(`${data.brideName}-${data.groomName}`);
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
    });
    aiGeneratedCopy = copy;
    aiGenerated = copy.source !== "template";
  }

  const invitation = await db.invitation.create({
    data: {
      userId: session.user.id,
      slug,
      status: "DRAFT",
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
      musicTrackId: data.musicTrackId || null,
      customMusicUrl: data.customMusicUrl || null,
      sectionConfig: (template?.sectionOrder as string[] | undefined ?? DEFAULT_SECTION_ORDER).map(
        (type, order) => ({ id: type, type, visible: true, locked: false, order }),
      ),
      aiGenerated,
      aiGeneratedCopy: aiGeneratedCopy ?? undefined,
      seoTitle: aiGeneratedCopy?.seoTitle,
      seoDescription: aiGeneratedCopy?.seoDescription,
      events: {
        create: data.events.map((event, order) => ({
          name: event.name,
          date: new Date(event.date),
          time: event.time,
          venueName: event.venueName,
          address: event.address,
          googleMapsUrl: event.googleMapsUrl || null,
          dressCode: event.dressCode,
          accentColor: event.accentColor,
          order,
        })),
      },
      familyMembers: {
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invitations");

  return { success: true, data: { invitationId: invitation.id, slug: invitation.slug } };
}

export async function publishInvitationAction(
  invitationId: string,
): Promise<ActionResult<{ autoFilledPhotos: number }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.userId !== session.user.id) {
    return { success: false, error: "Invitation not found." };
  }

  // Never block publishing on missing photos — top up to the required
  // count with wedding-mockup stock photos instead. The couple can swap
  // any of these out for their own later from the Media Library; nothing
  // here is a dead end.
  const existingMedia = await db.media.findMany({
    where: { invitationId },
    orderBy: { order: "asc" },
  });
  const autoFilledPhotos = Math.max(0, DEFAULT_PHOTO_COUNT - existingMedia.length);
  if (autoFilledPhotos > 0) {
    const urls = pickStockPhotos(
      autoFilledPhotos,
      existingMedia.map((m) => m.url),
    );
    await db.media.createMany({
      data: urls.map((url, i) => ({
        invitationId,
        url,
        type: "IMAGE" as const,
        isAuto: true,
        order: existingMedia.length + i,
      })),
    });
  }

  await db.invitation.update({
    where: { id: invitationId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  revalidatePath("/dashboard/invitations");
  revalidatePath("/dashboard/media");
  revalidatePath(`/invite/${invitation.slug}`);

  return { success: true, data: { autoFilledPhotos } };
}

export async function deleteInvitationAction(invitationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.userId !== session.user.id) {
    return { success: false, error: "Invitation not found." };
  }

  await db.invitation.delete({ where: { id: invitationId } });
  revalidatePath("/dashboard/invitations");

  return { success: true, data: undefined };
}

/**
 * Lets the dashboard owner (already authenticated with their own account —
 * no OTP needed, that's only for the anonymous guest-publish flow) mint a
 * private edit link for the couple, so they can view/manage the invitation
 * without a full dashboard account. Creates the PhoneLink on first use,
 * regenerates the token (invalidating any previous link) on repeat use.
 */
export async function ownerCreateEditLinkAction(
  invitationId: string,
  phone?: string,
): Promise<ActionResult<{ editUrl: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { phoneLink: true },
  });
  if (!invitation || invitation.userId !== session.user.id) {
    return { success: false, error: "Invitation not found." };
  }

  const rawEditToken = generateToken();
  const editTokenHash = hashToken(rawEditToken);

  if (invitation.phoneLink) {
    await db.phoneLink.update({
      where: { id: invitation.phoneLink.id },
      data: { editTokenHash },
    });
  } else {
    const normalized = normalizePhone(phone ?? "");
    if (!normalized) {
      return { success: false, error: "Enter the couple's WhatsApp number first." };
    }
    try {
      await db.phoneLink.create({
        data: { phone: normalized, invitationId, editTokenHash },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return {
          success: false,
          error: "That mobile number is already linked to another invitation.",
        };
      }
      throw error;
    }
  }

  return { success: true, data: { editUrl: `${getAppUrl()}/e/${rawEditToken}` } };
}
