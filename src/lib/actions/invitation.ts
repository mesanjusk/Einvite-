"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvitationCopy } from "@/lib/ai/generate-copy";
import {
  invitationWizardSchema,
  type InvitationWizardInput,
} from "@/lib/validations/invitation";
import type { ActionResult } from "@/lib/actions/auth";
import { DEFAULT_SECTION_ORDER, uniqueSlug } from "@/lib/invitation-helpers";

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
  if (!theme) return { success: false, error: "Unknown theme selected." };

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
      language: data.language,
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
      language: data.language,
      themeId: theme.id,
      templateId: template?.id,
      musicTrackId: data.musicTrackId || null,
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invitations");

  return { success: true, data: { invitationId: invitation.id, slug: invitation.slug } };
}

export async function publishInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.userId !== session.user.id) {
    return { success: false, error: "Invitation not found." };
  }

  await db.invitation.update({
    where: { id: invitationId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  revalidatePath("/dashboard/invitations");
  revalidatePath(`/invite/${invitation.slug}`);

  return { success: true, data: undefined };
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
