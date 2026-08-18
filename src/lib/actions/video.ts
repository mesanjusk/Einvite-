"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/actions/auth";
import {
  buildVideoPrompt,
  isGeminiVideoConfigured,
  startGeminiVideoGeneration,
  pollGeminiVideoOperation,
} from "@/lib/ai/gemini-video";

async function authorizeOwner(invitationId: string, userId: string) {
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { theme: true, events: { orderBy: { order: "asc" } }, media: true },
  });
  if (!invitation || invitation.userId !== userId) return null;
  return invitation;
}

const generateVideoSchema = z.object({
  invitationId: z.string(),
  videoTemplateId: z.string(),
});

/**
 * Kicks off a Gemini video generation job from the invitation's own
 * captured details (names, date, venue, events, theme colors) — the same
 * data already used for the website and PDF. Without GEMINI_API_KEY
 * configured, this still records the resolved prompt and a FAILED job so
 * the UI can explain why, rather than silently doing nothing.
 */
export async function generateInvitationVideoAction(
  input: z.infer<typeof generateVideoSchema>,
): Promise<ActionResult<{ videoId: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = generateVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const invitation = await authorizeOwner(parsed.data.invitationId, session.user.id);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const template = await db.videoTemplate.findUnique({
    where: { id: parsed.data.videoTemplateId },
  });
  if (!template) return { success: false, error: "Unknown video template." };

  const weddingDateDisplay = invitation.weddingDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prompt = buildVideoPrompt(
    {
      brideName: invitation.brideName,
      groomName: invitation.groomName,
      weddingDateDisplay,
      venueName: invitation.venueName,
      customMessage: invitation.customMessage,
      colorPalette: (invitation.colorPalette ?? invitation.theme?.colorPalette) as
        | { primary: string; secondary: string; accent: string }
        | null,
      eventNames: invitation.events.map((e) => e.name),
      photoCount: invitation.media.length,
    },
    {
      promptTemplate: template.promptTemplate,
      styleKeywords: (template.styleKeywords as string[] | null) ?? [],
      aspectRatio: template.aspectRatio,
      durationSeconds: template.durationSeconds,
    },
  );

  const video = await db.invitationVideo.create({
    data: {
      invitationId: invitation.id,
      videoTemplateId: template.id,
      status: "PENDING",
      prompt,
    },
  });

  await db.invitation.update({
    where: { id: invitation.id },
    data: { videoTemplateId: template.id },
  });

  if (!isGeminiVideoConfigured()) {
    await db.invitationVideo.update({
      where: { id: video.id },
      data: {
        status: "FAILED",
        error: "Video generation isn't configured yet — ask an admin to set GEMINI_API_KEY.",
      },
    });
    revalidatePath("/dashboard/publish/video");
    return { success: true, data: { videoId: video.id } };
  }

  const started = await startGeminiVideoGeneration(prompt, {
    model: template.geminiModel,
    aspectRatio: template.aspectRatio,
  });

  await db.invitationVideo.update({
    where: { id: video.id },
    data: started.ok
      ? { status: "PROCESSING", geminiOperationId: started.operationName }
      : { status: "FAILED", error: started.error },
  });

  revalidatePath("/dashboard/publish/video");
  return { success: true, data: { videoId: video.id } };
}

/**
 * Polls a PROCESSING job's Gemini operation and updates it in place. Called
 * from the video panel's refresh button rather than a background worker,
 * since this pass doesn't wire up a job queue.
 */
export async function refreshInvitationVideoAction(videoId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const video = await db.invitationVideo.findUnique({
    where: { id: videoId },
    include: { invitation: { select: { userId: true, slug: true } } },
  });
  if (!video || video.invitation.userId !== session.user.id) {
    return { success: false, error: "Video job not found." };
  }

  if (video.status !== "PROCESSING" || !video.geminiOperationId) {
    revalidatePath("/dashboard/publish/video");
    return { success: true, data: undefined };
  }

  const result = await pollGeminiVideoOperation(video.geminiOperationId);

  if (result.status === "PROCESSING") {
    return { success: true, data: undefined };
  }

  await db.invitationVideo.update({
    where: { id: video.id },
    data:
      result.status === "COMPLETED"
        ? { status: "COMPLETED", videoUrl: result.videoUrl }
        : { status: "FAILED", error: result.error },
  });

  revalidatePath("/dashboard/publish/video");
  return { success: true, data: undefined };
}

export async function deleteInvitationVideoAction(videoId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const video = await db.invitationVideo.findUnique({
    where: { id: videoId },
    include: { invitation: { select: { userId: true } } },
  });
  if (!video || video.invitation.userId !== session.user.id) {
    return { success: false, error: "Video job not found." };
  }

  await db.invitationVideo.delete({ where: { id: videoId } });
  revalidatePath("/dashboard/publish/video");
  return { success: true, data: undefined };
}
