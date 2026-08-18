import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { InvitationListCard } from "@/components/dashboard/invitation-list-card";

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
      <PageHeader title="Invitations" meta={`${invitations.length} total`}>
        <IconButton label="New invitation" variant="default" asChild>
          <Link href="/dashboard/invitations/new">
            <PlusCircle className="size-4" />
          </Link>
        </IconButton>
      </PageHeader>

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
            <InvitationListCard
              key={invitation.id}
              id={invitation.id}
              slug={invitation.slug}
              brideName={invitation.brideName}
              groomName={invitation.groomName}
              status={invitation.status}
              themeName={invitation.theme?.name ?? "No theme"}
              rsvpCount={invitation._count.rsvps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
