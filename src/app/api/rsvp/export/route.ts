import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function toCsvValue(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId");
  if (!invitationId) {
    return NextResponse.json({ error: "invitationId is required" }, { status: 400 });
  }

  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rsvps = await db.rsvp.findMany({
    where: { invitationId },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Guest Name",
    "Email",
    "Phone",
    "Status",
    "Guest Count",
    "Food Preference",
    "Comment",
    "Submitted At",
  ];

  const rows = rsvps.map((r) =>
    [
      r.guestName,
      r.email,
      r.phone,
      r.status,
      r.guestCount,
      r.foodPreference,
      r.comment,
      r.createdAt.toISOString(),
    ]
      .map(toCsvValue)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="rsvps-${invitation.slug}.csv"`,
    },
  });
}
