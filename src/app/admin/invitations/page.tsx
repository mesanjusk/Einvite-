import type { Metadata } from "next";

import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "All Invitations" };

export default async function AdminInvitationsPage() {
  const invitations = await db.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      theme: { select: { name: true } },
      user: { select: { name: true, email: true } },
      _count: { select: { rsvps: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">All Invitations</h1>
        <p className="text-muted-foreground text-sm">{invitations.length} created.</p>
      </div>

      <Card className="py-0">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Couple</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Theme</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">RSVPs</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {invitation.brideName} &amp; {invitation.groomName}
                    {invitation.isDemo && (
                      <Badge variant="outline" className="ml-2">
                        Demo
                      </Badge>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {invitation.user?.name ?? invitation.user?.email ?? "Guest (no account)"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {invitation.theme?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={invitation.status === "PUBLISHED" ? "gold" : "secondary"}>
                      {invitation.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{invitation._count.rsvps}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {invitation.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {invitation.status === "PUBLISHED" && (
                      <a
                        href={`/invite/${invitation.slug}`}
                        target="_blank"
                        className="text-primary text-sm underline underline-offset-4"
                      >
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {invitations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                    No invitations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
