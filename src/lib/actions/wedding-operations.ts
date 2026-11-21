"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { getAppUrl } from "@/lib/app-url";
import { parseGuestCsv } from "@/lib/wedding-ops/csv";
import type { ActionResult } from "@/lib/actions/auth";

const MAX_BATCH = 500;

async function ownedInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const owner = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });
  if (!owner || owner.isActive === false) return null;
  return db.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
    select: {
      id: true,
      slug: true,
      status: true,
      brideName: true,
      groomName: true,
      weddingDate: true,
    },
  });
}

export async function importWeddingGuestsAction(input: {
  invitationId: string;
  csv: string;
  verifiedConsent: boolean;
}): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const invitation = await ownedInvitation(input.invitationId);
  if (!invitation) return { success: false, error: "Invitation not found or access denied." };

  let rows;
  try {
    rows = parseGuestCsv(input.csv);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid CSV." };
  }
  if (rows.length > MAX_BATCH) return { success: false, error: "Too many guests." };

  const existing = await db.guest.findMany({
    where: { invitationId: invitation.id },
    select: { name: true, phone: true, group: true },
  });
  const keys = new Set(
    existing.map((guest) =>
      (guest.phone && normalizePhone(guest.phone)) ||
      (guest.name.trim().toLowerCase() + ":" + (guest.group ?? "").trim().toLowerCase()),
    ),
  );

  const fresh = rows.filter((guest) => {
    const key = guest.phone ||
      (guest.name.trim().toLowerCase() + ":" + (guest.group ?? "").trim().toLowerCase());
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });

  if (fresh.length) {
    await db.guest.createMany({
      data: fresh.map((guest) => ({
        invitationId: invitation.id,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        group: guest.group,
        expectedPartySize: guest.expectedPartySize,
        eventNames: guest.eventNames,
        travelMode: guest.travelMode,
        travelDetails: guest.travelDetails,
        hotelDetails: guest.hotelDetails,
        whatsappOptIn: Boolean(input.verifiedConsent && guest.phone),
      })),
    });
  }

  revalidatePath("/dashboard/manage/wedding");
  revalidatePath("/dashboard/manage/guests");
  return {
    success: true,
    data: { imported: fresh.length, skipped: rows.length - fresh.length },
  };
}

const guestUpdateSchema = z.object({
  id: z.string().min(1),
  group: z.string().max(100),
  phone: z.string().max(30),
  expectedPartySize: z.coerce.number().int().min(1).max(50),
  eventNames: z.string().max(300),
  travelMode: z.string().max(60),
  travelDetails: z.string().max(500),
  hotelDetails: z.string().max(300),
  operationsNotes: z.string().max(500),
  whatsappOptIn: z.boolean(),
});

export async function updateWeddingGuestAction(
  input: z.input<typeof guestUpdateSchema>,
): Promise<ActionResult> {
  const parsed = guestUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the guest details." };
  const guest = await db.guest.findUnique({
    where: { id: parsed.data.id },
    select: { invitationId: true },
  });
  if (!guest || !(await ownedInvitation(guest.invitationId))) {
    return { success: false, error: "Guest not found or access denied." };
  }
  const phone = parsed.data.phone.trim() ? normalizePhone(parsed.data.phone) : null;
  if (parsed.data.phone.trim() && !phone) {
    return { success: false, error: "Enter a valid phone number with country code." };
  }
  if (parsed.data.whatsappOptIn && !phone) {
    return { success: false, error: "A WhatsApp number is required for consent." };
  }
  const nullable = (value: string) => value.trim() || null;
  await db.guest.update({
    where: { id: parsed.data.id },
    data: {
      group: nullable(parsed.data.group),
      phone,
      expectedPartySize: parsed.data.expectedPartySize,
      eventNames: nullable(parsed.data.eventNames),
      travelMode: nullable(parsed.data.travelMode),
      travelDetails: nullable(parsed.data.travelDetails),
      hotelDetails: nullable(parsed.data.hotelDetails),
      operationsNotes: nullable(parsed.data.operationsNotes),
      whatsappOptIn: parsed.data.whatsappOptIn,
    },
  });
  revalidatePath("/dashboard/manage/wedding");
  revalidatePath("/dashboard/manage/guests");
  return { success: true, data: undefined };
}

export type WeddingMessageKind = "INVITATION" | "REMINDER";

export async function sendWeddingTemplateAction(
  guestId: string,
  kind: WeddingMessageKind,
): Promise<ActionResult<{ accepted: boolean }>> {
  if (kind !== "INVITATION" && kind !== "REMINDER") {
    return { success: false, error: "Invalid message type." };
  }
  const guest = await db.guest.findUnique({
    where: { id: guestId },
    select: {
      id: true,
      invitationId: true,
      name: true,
      phone: true,
      whatsappOptIn: true,
      inviteToken: true,
      invitationSentAt: true,
      reminderSentAt: true,
    },
  });
  if (!guest) return { success: false, error: "Guest not found." };
  const invitation = await ownedInvitation(guest.invitationId);
  if (!invitation) return { success: false, error: "Access denied." };
  if (invitation.status !== "PUBLISHED") {
    return { success: false, error: "Publish this invitation before messaging." };
  }
  if (guest.whatsappOptIn !== true) {
    return { success: false, error: "This guest has not opted in to WhatsApp messaging." };
  }
  const phone = guest.phone ? normalizePhone(guest.phone) : null;
  if (!phone) return { success: false, error: "Guest has no valid WhatsApp number." };

  const previous = kind === "INVITATION" ? guest.invitationSentAt : guest.reminderSentAt;
  if (previous && Date.now() - previous.getTime() < 12 * 60 * 60 * 1000) {
    return { success: false, error: "This message was already submitted in the past 12 hours." };
  }
  if (kind === "REMINDER" && !guest.invitationSentAt) {
    return { success: false, error: "Send the invitation before a reminder." };
  }
  const templateName = kind === "INVITATION"
    ? process.env.WHATSAPP_WEDDING_INVITE_TEMPLATE_NAME
    : process.env.WHATSAPP_WEDDING_REMINDER_TEMPLATE_NAME;
  if (!templateName || !process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return { success: false, error: "Approved WhatsApp wedding template or Cloud API credentials not configured." };
  }
  const url = getAppUrl() + "/invite/" + invitation.slug + "?to=" + guest.inviteToken;
  const date = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(invitation.weddingDate);
  const params = [
    guest.name,
    [invitation.brideName, invitation.groomName].filter(Boolean).join(" & "),
    date,
    url,
  ];

  let response: Response;
  try {
    response = await fetch(
      "https://graph.facebook.com/" +
      (process.env.WHATSAPP_API_VERSION || "v21.0") + "/" +
      process.env.WHATSAPP_PHONE_NUMBER_ID + "/messages",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.WHATSAPP_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.slice(1),
          type: "template",
          template: {
            name: templateName,
            language: { code: process.env.WHATSAPP_WEDDING_TEMPLATE_LANGUAGE || "en" },
            components: [{
              type: "body",
              parameters: params.map((value) => ({ type: "text", text: value })),
            }],
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    return { success: false, error: "WhatsApp API is not reachable; please retry later." };
  }

  if (!response.ok) {
    // Do not print phone numbers, message contents or provider auth data in logs.
    console.error("[wedding-ops] WhatsApp template rejected: HTTP " + response.status);
    return { success: false, error: "Meta rejected the template message (HTTP " + response.status + "). Check template approval, language and account balance." };
  }

  await db.guest.update({
    where: { id: guest.id },
    data: kind === "INVITATION"
      ? { invitationSentAt: new Date() }
      : { reminderSentAt: new Date() },
  });
  revalidatePath("/dashboard/manage/wedding");
  return { success: true, data: { accepted: true } };
}
