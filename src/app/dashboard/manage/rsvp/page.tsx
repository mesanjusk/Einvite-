import Link from "next/link";
import type { Metadata } from "next";
import { Download } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Manage — RSVP" };

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ACCEPTED: "default",
  MAYBE: "secondary",
  DECLINED: "destructive",
};

export default async function RsvpPage({
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
          Create an invitation first to start collecting RSVPs.{" "}
          <Link href="/dashboard/invitations/new" className="text-primary underline">
            Create one now
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const selectedId = invitations.some((inv) => inv.id === invitationId)
    ? invitationId!
    : invitations[0].id;
  const rsvps = await db.rsvp.findMany({
    where: { invitationId: selectedId },
    orderBy: { createdAt: "desc" },
  });

  const totals = rsvps.reduce(
    (acc, r) => {
      acc[r.status] += 1;
      acc.guests += r.status === "ACCEPTED" ? r.guestCount : 0;
      return acc;
    },
    { ACCEPTED: 0, DECLINED: 0, MAYBE: 0, guests: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            {rsvps.length} response{rsvps.length === 1 ? "" : "s"} · {totals.guests} guests
            attending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InvitationPicker invitations={invitations} selectedId={selectedId} />
          <Button variant="outline" asChild>
            <a href={`/api/rsvp/export?invitationId=${selectedId}`} download>
              <Download />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Accepted</p>
            <p className="font-display text-2xl">{totals.ACCEPTED}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Maybe</p>
            <p className="font-display text-2xl">{totals.MAYBE}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Declined</p>
            <p className="font-display text-2xl">{totals.DECLINED}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="py-0">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Count</th>
                <th className="px-4 py-3 font-medium">Food</th>
                <th className="px-4 py-3 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.guestName}</p>
                    <p className="text-muted-foreground text-xs">{r.email ?? r.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{r.guestCount}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {r.foodPreference ?? "—"}
                  </td>
                  <td className="text-muted-foreground max-w-xs truncate px-4 py-3">
                    {r.comment ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rsvps.length === 0 && (
            <p className="text-muted-foreground p-8 text-center text-sm">
              No responses yet. Share your invitation link to start collecting RSVPs.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
