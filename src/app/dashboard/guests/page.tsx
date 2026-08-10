import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { AddGuestDialog } from "@/components/dashboard/add-guest-dialog";
import { GuestRow } from "@/components/dashboard/guest-row";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Guest Management" };

export default async function GuestsPage({
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
    select: { id: true, brideName: true, groomName: true },
  });

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Create an invitation first, then come back to manage your guest list.{" "}
          <Link href="/dashboard/invitations/new" className="text-primary underline">
            Create one now
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const selectedId = invitationId ?? invitations[0].id;
  const [guests, selectedInvitation] = await Promise.all([
    db.guest.findMany({
      where: { invitationId: selectedId },
      include: { rsvp: true },
      orderBy: { createdAt: "desc" },
    }),
    db.invitation.findUnique({ where: { id: selectedId }, select: { slug: true } }),
  ]);
  const inviteBaseUrl = `${getAppUrl()}/invite/${selectedInvitation?.slug ?? ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Guest Management</h1>
          <p className="text-muted-foreground text-sm">
            {guests.length} guest{guests.length === 1 ? "" : "s"} on this list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InvitationPicker invitations={invitations} selectedId={selectedId} />
          <AddGuestDialog invitationId={selectedId} />
        </div>
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">RSVP</th>
                <th className="px-4 py-3 font-medium">Opened</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <GuestRow
                  key={guest.id}
                  guest={{
                    id: guest.id,
                    name: guest.name,
                    email: guest.email,
                    phone: guest.phone,
                    group: guest.group,
                    rsvpStatus: guest.rsvp?.status ?? null,
                    viewedAt: guest.viewedAt,
                  }}
                  inviteLink={`${inviteBaseUrl}?to=${guest.inviteToken}`}
                />
              ))}
            </tbody>
          </table>
          {guests.length === 0 && (
            <p className="text-muted-foreground p-8 text-center text-sm">
              No guests added yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
