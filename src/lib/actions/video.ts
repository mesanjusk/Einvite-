"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import type { ActionResult } from "@/lib/actions/auth";
import {
  buildVideoPrompt,
  isGeminiVideoConfigured,
  startGeminiVideoGeneration,
  pollGeminiVideoOperation,
} from "@/lib/ai/gemini-video";

// Reachable from both the signed-in dashboard (Publish → Video) and the
// guest "pre-logged-in" manage page (/manage/[invitationId]) — ownership is
// authorized the same way either flow already authorizes edits.
async function authorizeOwner(invitationId: string) {
  const access = await authorizeInvitationAccess(invitationId);
  if (!access) return null;
  return db.invitation.findUnique({
    where: { id: invitationId },
    include: { theme: true, events: { orderBy: { order: "asc" } }, media: true },
  });
}

function revalidateInvitationPaths(invitationId: string) {
  revalidatePath("/dashboard/publish/video");
  revalidatePath(`/manage/${invitationId}`);
}

const generateVideoSchema = z.object({
  invitationId: z.string(),
  videoTemplateId: z.string(),
});

/**
 * Kicks off a Gemini video generation job from the invitation's own
 * captured details (names, date, venue, events, theme colors) — the same
 * data already used for the website and PDF. Prefers the invitation's own
 * Gemini key (Google AI Studio) when the couple has added one, falling
 * back to the platform's GEMINI_API_KEY; without either, this still
 * records the resolved prompt and a FAILED job so the UI can explain why.
 */
export async function generateInvitationVideoAction(
  input: z.infer<typeof generateVideoSchema>,
): Promise<ActionResult<{ videoId: string }>> {
  const parsed = generateVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const invitation = await authorizeOwner(parsed.data.invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  // One video per invitation — each generation is a paid Gemini call, and the
  // service is offered as one video per user. Failed jobs don't count, so a
  // generation that errored can be retried; deleting the video frees the slot.
  const existingVideos = await db.invitationVideo.count({
    where: { invitationId: invitation.id, status: { in: ["PENDING", "PROCESSING", "COMPLETED"] } },
  });
  if (existingVideos > 0) {
    return {
      success: false,
      error: "You already have a video for this invitation. Delete it to generate a new one.",
    };
  }

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

  if (!isGeminiVideoConfigured(invitation.geminiApiKey)) {
    await db.invitationVideo.update({
      where: { id: video.id },
      data: {
        status: "FAILED",
        error:
          "No Gemini API key is configured — add your own key above, or ask an admin to set GEMINI_API_KEY.",
      },
    });
    revalidateInvitationPaths(invitation.id);
    return { success: true, data: { videoId: video.id } };
  }

  const started = await startGeminiVideoGeneration(prompt, {
    model: template.geminiModel,
    aspectRatio: template.aspectRatio,
    apiKey: invitation.geminiApiKey,
  });

  await db.invitationVideo.update({
    where: { id: video.id },
    data: started.ok
      ? {
          status: "PROCESSING",
          geminiOperationId: started.operationName,
          // Which model actually ran — the template's pinned one, or the
          // fallback picked when the key couldn't reach it.
          geminiModel: started.model,
        }
      : { status: "FAILED", error: started.error },
  });

  revalidateInvitationPaths(invitation.id);
  return { success: true, data: { videoId: video.id } };
}

/**
 * Polls a PROCESSING job's Gemini operation and updates it in place. Called
 * from the video panel's refresh button rather than a background worker,
 * since this pass doesn't wire up a job queue.
 */
export async function refreshInvitationVideoAction(videoId: string): Promise<ActionResult> {
  const video = await db.invitationVideo.findUnique({
    where: { id: videoId },
    include: { invitation: { select: { id: true, geminiApiKey: true } } },
  });
  if (!video) return { success: false, error: "Video job not found." };

  const access = await authorizeInvitationAccess(video.invitation.id);
  if (!access) return { success: false, error: "Video job not found." };

  if (video.status !== "PROCESSING" || !video.geminiOperationId) {
    revalidateInvitationPaths(video.invitation.id);
    return { success: true, data: undefined };
  }

  const result = await pollGeminiVideoOperation(video.geminiOperationId, video.invitation.geminiApiKey);

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

  revalidateInvitationPaths(video.invitation.id);
  return { success: true, data: undefined };
}

export async function deleteInvitationVideoAction(videoId: string): Promise<ActionResult> {
  const video = await db.invitationVideo.findUnique({
    where: { id: videoId },
    include: { invitation: { select: { id: true } } },
  });
  if (!video) return { success: false, error: "Video job not found." };

  const access = await authorizeInvitationAccess(video.invitation.id);
  if (!access) return { success: false, error: "Video job not found." };

  await db.invitationVideo.delete({ where: { id: videoId } });
  revalidateInvitationPaths(video.invitation.id);
  return { success: true, data: undefined };
}

const updateGeminiKeySchema = z.object({
  invitationId: z.string(),
  geminiApiKey: z.string().trim().min(1).nullable(),
});

/**
 * Sets or clears the couple's own Gemini API key for this invitation. The
 * key is write-only from the client's perspective — this action never
 * returns the stored value, only success/failure, so it's never rendered
 * back into a page.
 */
export async function updateInvitationGeminiKeyAction(
  input: z.infer<typeof updateGeminiKeySchema>,
): Promise<ActionResult> {
  const parsed = updateGeminiKeySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const access = await authorizeInvitationAccess(parsed.data.invitationId);
  if (!access) return { success: false, error: "Invitation not found." };

  await db.invitation.update({
    where: { id: parsed.data.invitationId },
    data: { geminiApiKey: parsed.data.geminiApiKey },
  });

  revalidateInvitationPaths(parsed.data.invitationId);
  return { success: true, data: undefined };
}
