import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Music, Video } from "lucide-react";

import { db } from "@/lib/db";
import { adminDeleteMediaAction } from "@/lib/actions/admin";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { RegenerateEditLinkButton } from "@/components/admin/regenerate-edit-link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function maskPhone(phone: string) {
  return phone.length > 4 ? `${"•".repeat(phone.length - 4)}${phone.slice(-4)}` : phone;
}

export const metadata: Metadata = { title: "Manage Invitation" };

export default async function AdminInvitationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invitation = await db.invitation.findUnique({
    where: { id },
    include: {
      theme: { select: { name: true } },
      user: { select: { name: true, email: true } },
      media: { orderBy: { order: "asc" } },
      phoneLink: { select: { phone: true, verifiedAt: true } },
    },
  });
  if (!invitation) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/invitations"
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          All invitations
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl">
            {invitation.brideName} &amp; {invitation.groomName}
          </h1>
          <Badge variant={invitation.status === "PUBLISHED" ? "gold" : "secondary"}>
            {invitation.status}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {invitation.user?.name ?? invitation.user?.email ?? "Guest (no account)"} ·{" "}
          {invitation.theme?.name ?? "No theme"}
          {invitation.customMusicUrl && " · custom music uploaded"}
        </p>
      </div>

      {!invitation.user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Owner access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {invitation.phoneLink ? (
              <p className="text-muted-foreground text-sm">
                WhatsApp-verified: {maskPhone(invitation.phoneLink.phone)} on{" "}
                {invitation.phoneLink.verifiedAt.toLocaleDateString()}. The couple&apos;s own
                edit link isn&apos;t recoverable (it&apos;s only ever stored hashed) — generate
                a new one below if they&apos;ve lost theirs.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Not yet WhatsApp-verified — this guest draft has no saved owner access.
              </p>
            )}
            {invitation.phoneLink && <RegenerateEditLinkButton invitationId={invitation.id} />}
          </CardContent>
        </Card>
      )}

      {invitation.customMusicUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="size-4" />
              Custom uploaded track
            </CardTitle>
          </CardHeader>
          <CardContent>
            <audio controls src={invitation.customMusicUrl} className="w-full" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media ({invitation.media.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invitation.media.length === 0 ? (
            <p className="text-muted-foreground text-sm">No media uploaded.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {invitation.media.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-lg border">
                  <div className="relative aspect-square bg-muted">
                    {item.type === "VIDEO" ? (
                      <div className="flex size-full items-center justify-center">
                        <Video className="text-muted-foreground size-8" />
                      </div>
                    ) : (
                      <Image src={item.url} alt="" fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="bg-background/90 absolute top-1 right-1 rounded-full">
                    <DeleteEntityButton
                      id={item.id}
                      confirmLabel="Permanently delete this media file?"
                      action={adminDeleteMediaAction}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
