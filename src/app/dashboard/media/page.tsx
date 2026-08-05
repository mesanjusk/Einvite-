import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/media/cloudinary";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { MediaUploader } from "@/components/dashboard/media-uploader";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage({
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
          Create an invitation first, then upload photos for its gallery.{" "}
          <Link href="/dashboard/invitations/new" className="text-primary underline">
            Create one now
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const selectedId = invitationId ?? invitations[0].id;
  const media = await db.media.findMany({
    where: { invitationId: selectedId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Media Library</h1>
          <p className="text-muted-foreground text-sm">
            Photos here appear in your invitation&apos;s gallery. Uploads are
            auto-optimized to WebP/AVIF and resized by Cloudinary.
          </p>
        </div>
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </div>

      {!isCloudinaryConfigured() && (
        <Card className="border-accent/50">
          <CardContent className="text-muted-foreground text-sm">
            Uploads are wired to Cloudinary but not active — add{" "}
            <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{" "}
            <code className="font-mono">CLOUDINARY_API_KEY</code>, and{" "}
            <code className="font-mono">CLOUDINARY_API_SECRET</code> to your environment.
          </CardContent>
        </Card>
      )}

      <MediaUploader
        invitationId={selectedId}
        initialMedia={media.map((m) => ({ id: m.id, url: m.url, width: m.width, height: m.height }))}
      />
    </div>
  );
}
