import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined): string {
  let text = String(value ?? "");
  // Prevent spreadsheet formula injection in exported user-supplied fields.
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invitationId = new URL(request.url).searchParams.get("invitationId");
  if (!invitationId) {
    return NextResponse.json({ error: "Invitation required" }, { status: 400 });
  }
  const invitation = await db.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
    select: { id: true, slug: true },
  });
  if (!invitation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const guests = await db.guest.findMany({
    where: { invitationId },
    include: { rsvp: true },
    orderBy: { createdAt: "asc" },
  });
  const columns = [
    "Name", "Phone", "Email", "Group", "Party Size", "Events",
    "Travel Mode", "Travel Details", "Hotel", "RSVP", "Attending",
    "WhatsApp Opt In", "Invitation Submitted At", "Reminder Submitted At", "Notes",
  ];
  const rows = guests.map((guest) => [
    guest.name,
    guest.phone,
    guest.email,
    guest.group,
    guest.expectedPartySize ?? 1,
    guest.eventNames,
    guest.travelMode,
    guest.travelDetails,
    guest.hotelDetails,
    guest.rsvp?.status,
    guest.rsvp?.guestCount,
    guest.whatsappOptIn === true ? "Yes" : "No",
    guest.invitationSentAt?.toISOString(),
    guest.reminderSentAt?.toISOString(),
    guest.operationsNotes,
  ].map(csvCell).join(","));
  return new NextResponse("\uFEFF" + [columns.join(","), ...rows].join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="wedding-guests-' + invitation.slug + '.csv"',
      "cache-control": "private, no-store",
    },
  });
}
