import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGeminiVideoConfigured } from "@/lib/ai/gemini-video";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { VideoGeneratorPanel } from "@/components/dashboard/video-generator-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Publish — Video" };

export default async function PublishVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { invitationId } = await searchParams;

  const [invitations, videoTemplates] = await Promise.all([
    db.invitation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, brideName: true, groomName: true },
    }),
    db.videoTemplate.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Create an invitation first to generate a video.{" "}
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
  const invitation = await db.invitation.findUnique({
    where: { id: selectedId },
    include: {
      videos: { orderBy: { createdAt: "desc" }, include: { videoTemplate: { select: { name: true } } } },
    },
  });
  if (!invitation) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Generate a Gemini video teaser from the details you already entered — names, date,
          venue, and your theme colors — using an admin-managed style template.
        </p>
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </div>

      {!isGeminiVideoConfigured() && (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-4 text-sm">
            Video generation isn&apos;t configured on this deployment yet — you can start a job,
            but it will fail until an admin sets <code className="font-mono">GEMINI_API_KEY</code>.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Video template</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoGeneratorPanel
            invitationId={invitation.id}
            templates={videoTemplates.map((t) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
              description: t.description,
              aspectRatio: t.aspectRatio,
              durationSeconds: t.durationSeconds,
            }))}
            currentTemplateId={invitation.videoTemplateId}
            jobs={invitation.videos}
          />
        </CardContent>
      </Card>
    </div>
  );
}
