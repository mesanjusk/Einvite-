import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getInvitationById, toInviteRenderData } from "@/lib/get-invite-data";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { BuilderClient } from "@/components/dashboard/builder/builder-client";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Publish — Sections" };

export default async function BuilderPage({
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
          Create an invitation first, then customize its section layout here.{" "}
          <Link href="/dashboard/invitations/new" className="text-primary underline">
            Create one now
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const selectedId = invitationId ?? invitations[0].id;
  const invitation = await getInvitationById(selectedId);
  if (!invitation || invitation.userId !== userId) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Invitation not found.
        </CardContent>
      </Card>
    );
  }

  const { inviteData, themeStyle, sectionConfig } = toInviteRenderData(invitation);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Drag to reorder, hide, lock, duplicate, or remove sections — the preview
          updates live.
        </p>
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </div>

      <BuilderClient
        key={selectedId}
        invitationId={selectedId}
        initialSections={sectionConfig}
        invite={inviteData}
        themeStyle={themeStyle}
      />
    </div>
  );
}
