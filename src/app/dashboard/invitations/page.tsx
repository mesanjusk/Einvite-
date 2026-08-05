import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My Invitations" };

export default async function InvitationsListPage() {
  const session = await auth();
  const invitations = await db.invitation.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
    include: { theme: true, _count: { select: { rsvps: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">My Invitations</h1>
        <Button asChild>
          <Link href="/dashboard/invitations/new">
            <PlusCircle />
            New invitation
          </Link>
        </Button>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No invitations yet.{" "}
            <Link href="/dashboard/invitations/new" className="text-primary underline">
              Create your first one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-base">
                    {invitation.brideName} &amp; {invitation.groomName}
                  </CardTitle>
                  <Badge variant={invitation.status === "PUBLISHED" ? "gold" : "secondary"}>
                    {invitation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {invitation.theme?.name ?? "No theme"} · {invitation._count.rsvps} RSVPs
                </span>
                <div className="flex gap-3">
                  {invitation.status === "PUBLISHED" && (
                    <a
                      href={`/invite/${invitation.slug}`}
                      target="_blank"
                      className="text-primary text-sm underline underline-offset-4"
                    >
                      View
                    </a>
                  )}
                  <Link
                    href={`/dashboard/deploy?invitationId=${invitation.id}`}
                    className="text-primary text-sm underline underline-offset-4"
                  >
                    Manage
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
