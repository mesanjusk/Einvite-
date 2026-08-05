"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";
import { rsvpNotificationEmailHtml } from "@/lib/email/templates";
import {
  rsvpSubmissionSchema,
  guestSchema,
  type RsvpSubmissionInput,
  type GuestInput,
} from "@/lib/validations/invitation";
import type { ActionResult } from "@/lib/actions/auth";

export async function submitRsvpAction(
  input: RsvpSubmissionInput,
): Promise<ActionResult> {
  const parsed = rsvpSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  const invitation = await db.invitation.findUnique({
    where: { id: data.invitationId },
    select: { id: true, slug: true, brideName: true, groomName: true, userId: true },
  });
  if (!invitation) return { success: false, error: "Invitation not found." };

  const rsvpFields = {
    guestName: data.guestName,
    email: data.email || null,
    phone: data.phone,
    status: data.status,
    guestCount: data.guestCount,
    foodPreference: data.foodPreference,
    comment: data.comment,
  };

  if (data.guestId) {
    // Pre-added guest (invited via a tokenized link) — update their one RSVP.
    await db.rsvp.upsert({
      where: { guestId: data.guestId },
      update: rsvpFields,
      create: { invitationId: data.invitationId, guestId: data.guestId, ...rsvpFields },
    });
  } else {
    // Public/open RSVP form — no linked guest record, always a new response.
    await db.rsvp.create({ data: { invitationId: data.invitationId, ...rsvpFields } });
  }

  await db.analyticsEvent.create({
    data: { invitationId: data.invitationId, type: "RSVP_SUBMIT" },
  });

  // Best-effort notification email — never block the RSVP on email delivery.
  try {
    const owner = await db.user.findUnique({ where: { id: invitation.userId } });
    if (owner?.email) {
      const resend = getResendClient();
      await resend.emails.send({
        from: EMAIL_FROM,
        to: owner.email,
        subject: `New RSVP from ${data.guestName}`,
        html: rsvpNotificationEmailHtml({
          coupleNames: `${invitation.brideName} & ${invitation.groomName}`,
          guestName: data.guestName,
          status: data.status,
          guestCount: data.guestCount,
          foodPreference: data.foodPreference,
          comment: data.comment,
        }),
      });
    }
  } catch (error) {
    console.error("RSVP notification email failed", error);
  }

  revalidatePath(`/invite/${invitation.slug}`);
  revalidatePath("/dashboard/rsvp");

  return { success: true, data: undefined };
}

export async function addGuestAction(input: GuestInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const invitation = await db.invitation.findUnique({
    where: { id: parsed.data.invitationId },
  });
  if (!invitation || invitation.userId !== session.user.id) {
    return { success: false, error: "Invitation not found." };
  }

  await db.guest.create({
    data: {
      invitationId: parsed.data.invitationId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      group: parsed.data.group,
    },
  });

  revalidatePath("/dashboard/guests");
  return { success: true, data: undefined };
}

export async function deleteGuestAction(guestId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const guest = await db.guest.findUnique({
    where: { id: guestId },
    include: { invitation: true },
  });
  if (!guest || guest.invitation.userId !== session.user.id) {
    return { success: false, error: "Guest not found." };
  }

  await db.guest.delete({ where: { id: guestId } });
  revalidatePath("/dashboard/guests");
  return { success: true, data: undefined };
}
