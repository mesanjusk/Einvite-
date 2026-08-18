import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGeminiVideoConfigured } from "@/lib/ai/gemini-video";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { VideoGeneratorPanel } from "@/components/dashboard/video-generator-panel";
import { GeminiKeyForm } from "@/components/dashboard/gemini-key-form";
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
      <div className="flex justify-end">
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </div>

      {!isGeminiVideoConfigured(invitation.geminiApiKey) && (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-4 text-sm">
            No Gemini key is available yet — add your own below, or ask an admin to set{" "}
            <code className="font-mono">GEMINI_API_KEY</code> for the whole platform.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gemini API key</CardTitle>
        </CardHeader>
        <CardContent>
          <GeminiKeyForm invitationId={invitation.id} hasKey={Boolean(invitation.geminiApiKey)} />
        </CardContent>
      </Card>

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
