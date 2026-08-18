import Link from "next/link";
import type { Metadata } from "next";
import { Music } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/media/cloudinary";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { MediaUploader } from "@/components/dashboard/media-uploader";
import { VideoUploader } from "@/components/dashboard/video-uploader";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string; tab?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { invitationId, tab } = await searchParams;

  const invitations = await db.invitation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, brideName: true, groomName: true },
  });

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Create an invitation first, then upload photos, video, and music for it.{" "}
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
  const [media, invitation, musicTracks] = await Promise.all([
    db.media.findMany({ where: { invitationId: selectedId }, orderBy: { createdAt: "desc" } }),
    db.invitation.findUnique({ where: { id: selectedId }, select: { customMusicUrl: true } }),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }),
  ]);

  const photos = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Media">
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </PageHeader>

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

      <Tabs defaultValue={tab === "video" || tab === "audio" ? tab : "photos"}>
        <TabsList>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-4">
          <MediaUploader
            invitationId={selectedId}
            initialMedia={photos.map((m) => ({ id: m.id, url: m.url, width: m.width, height: m.height }))}
          />
        </TabsContent>

        <TabsContent value="video" className="mt-4">
          <VideoUploader
            invitationId={selectedId}
            initialVideos={videos.map((m) => ({ id: m.id, url: m.url }))}
          />
        </TabsContent>

        <TabsContent value="audio" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm font-medium">Background music</p>
              <p className="text-muted-foreground text-sm">
                {invitation?.customMusicUrl
                  ? "A custom track is set for this invitation."
                  : "No custom track uploaded yet."}{" "}
                Upload your own or pick from the catalog below in{" "}
                <Link
                  href={`/dashboard/publish/theme?invitationId=${selectedId}`}
                  className="text-primary underline"
                >
                  Publish → Theme
                </Link>
                .
              </p>
              {invitation?.customMusicUrl && (
                <audio controls src={invitation.customMusicUrl} className="mt-1 w-full max-w-sm" />
              )}
            </CardContent>
          </Card>

          <div>
            <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
              Preset catalog
            </p>
            <div className="grid grid-cols-1 gap-3">
              {musicTracks.map((track) => (
                <Card key={track.id}>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary flex size-10 items-center justify-center rounded-full">
                        <Music className="text-primary size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{track.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {track.artist} · {track.mood}
                        </p>
                      </div>
                    </div>
                    {track.isPremium && <Badge variant="gold">Premium</Badge>}
                  </CardContent>
                </Card>
              ))}
              {musicTracks.length === 0 && (
                <p className="text-muted-foreground text-sm">No tracks seeded yet.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
