import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { WeddingOperations, type WeddingOpsGuest } from "@/components/dashboard/wedding-operations";

export const metadata: Metadata = { title: "Manage — Wedding Operations" };
export const dynamic = "force-dynamic";

export default async function WeddingOperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { invitationId } = await searchParams;
  const invitations = await db.invitation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, brideName: true, groomName: true, status: true },
  });

  if (!invitations.length) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm">
        Create an invitation before managing wedding guests.{" "}
        <Link className="underline" href="/dashboard/invitations/new">Create an invitation</Link>
      </div>
    );
  }

  const selected = invitations.find((item) => item.id === invitationId) ?? invitations[0];
  const guests = await db.guest.findMany({
    where: { invitationId: selected.id },
    include: { rsvp: true },
    orderBy: { createdAt: "desc" },
  });

  const guestRows: WeddingOpsGuest[] = guests.map((guest) => ({
    id: guest.id,
    name: guest.name,
    phone: guest.phone,
    group: guest.group,
    rsvpStatus: guest.rsvp?.status ?? null,
    guestCount: guest.rsvp?.guestCount ?? null,
    expectedPartySize: guest.expectedPartySize ?? 1,
    eventNames: guest.eventNames ?? "",
    travelMode: guest.travelMode ?? "",
    travelDetails: guest.travelDetails ?? "",
    hotelDetails: guest.hotelDetails ?? "",
    operationsNotes: guest.operationsNotes ?? "",
    whatsappOptIn: guest.whatsappOptIn === true,
    invitationSentAt: guest.invitationSentAt?.toISOString() ?? null,
    reminderSentAt: guest.reminderSentAt?.toISOString() ?? null,
    viewedAt: guest.viewedAt?.toISOString() ?? null,
  }));

  const messagingReady = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_WEDDING_INVITE_TEMPLATE_NAME &&
    process.env.WHATSAPP_WEDDING_REMINDER_TEMPLATE_NAME,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Wedding guest operations</h2>
          <p className="text-xs text-slate-600">Guest segments, RSVP follow-up, WhatsApp and travel coordination</p>
        </div>
        <InvitationPicker
          selectedId={selected.id}
          invitations={invitations.map((item) => ({
            id: item.id,
            brideName: item.brideName,
            groomName: item.groomName,
          }))}
        />
      </div>
      <WeddingOperations
        invitationId={selected.id}
        guests={guestRows}
        published={selected.status === "PUBLISHED"}
        messagingReady={messagingReady}
      />
    </div>
  );
}
