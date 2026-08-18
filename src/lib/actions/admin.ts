"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteImage, isCloudinaryConfigured } from "@/lib/media/cloudinary";
import { generateToken, hashToken } from "@/lib/otp";
import { getAppUrl } from "@/lib/app-url";
import type { ActionResult } from "@/lib/actions/auth";
import {
  themeFormSchema,
  musicTrackFormSchema,
  updateUserRoleSchema,
  videoTemplateFormSchema,
  type ThemeFormInput,
  type MusicTrackFormInput,
  type VideoTemplateFormInput,
} from "@/lib/validations/admin";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function upsertThemeAction(input: ThemeFormInput): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = themeFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (!data.id) {
    const existing = await db.theme.findUnique({ where: { slug: data.slug } });
    if (existing) return { success: false, error: "A theme with this slug already exists." };
  }

  const themeFields = {
    type: data.type,
    name: data.name,
    slug: data.slug,
    description: data.description,
    previewImage: data.previewImage,
    revealMode: data.revealMode,
    revealVideoUrl: data.revealVideoUrl,
    category: data.category,
    isPremium: data.isPremium,
    sortOrder: data.sortOrder,
    colorPalette: data.colorPalette,
    fontPairing: data.fontPairing,
  };

  const theme = data.id
    ? await db.theme.update({ where: { id: data.id }, data: themeFields })
    : await db.theme.create({ data: themeFields });

  await db.template.upsert({
    where: { slug: `${theme.slug}-classic` },
    update: { name: `${theme.name} Classic`, themeId: theme.id, sectionOrder: data.sectionOrder },
    create: {
      name: `${theme.name} Classic`,
      slug: `${theme.slug}-classic`,
      themeId: theme.id,
      sectionOrder: data.sectionOrder,
    },
  });

  const adminPath = data.type === "PDF" ? "/admin/pdf-themes" : "/admin/themes";
  revalidatePath(adminPath);
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/invitations/new");
  revalidatePath("/dashboard/publish/theme");
  revalidatePath("/dashboard/publish/pdf");

  return { success: true, data: undefined };
}

export async function deleteThemeAction(themeId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const theme = await db.theme.findUnique({ where: { id: themeId } });
  if (!theme) return { success: false, error: "Theme not found." };

  const inUse = await db.invitation.count({
    where: { OR: [{ themeId }, { pdfThemeId: themeId }] },
  });
  if (inUse > 0) {
    return {
      success: false,
      error: `${inUse} invitation(s) still use this theme — cannot delete.`,
    };
  }

  await db.template.deleteMany({ where: { themeId } });
  await db.theme.delete({ where: { id: themeId } });

  revalidatePath(theme.type === "PDF" ? "/admin/pdf-themes" : "/admin/themes");
  return { success: true, data: undefined };
}

export async function upsertMusicTrackAction(
  input: MusicTrackFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = musicTrackFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (data.isDefault) {
    // Only one track can be the auto-assigned default at a time.
    await db.musicTrack.updateMany({
      where: { isDefault: true, ...(data.id ? { id: { not: data.id } } : {}) },
      data: { isDefault: false },
    });
  }

  if (data.id) {
    await db.musicTrack.update({
      where: { id: data.id },
      data: {
        title: data.title,
        artist: data.artist,
        url: data.url,
        mood: data.mood,
        isPremium: data.isPremium,
        isDefault: data.isDefault,
      },
    });
  } else {
    await db.musicTrack.create({
      data: {
        title: data.title,
        artist: data.artist,
        url: data.url,
        mood: data.mood,
        isPremium: data.isPremium,
        isDefault: data.isDefault,
      },
    });
  }

  revalidatePath("/admin/music");
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/invitations/new");

  return { success: true, data: undefined };
}

export async function deleteMusicTrackAction(trackId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const inUse = await db.invitation.count({ where: { musicTrackId: trackId } });
  if (inUse > 0) {
    return {
      success: false,
      error: `${inUse} invitation(s) still use this track — cannot delete.`,
    };
  }

  await db.musicTrack.delete({ where: { id: trackId } });
  revalidatePath("/admin/music");
  return { success: true, data: undefined };
}

export async function updateUserRoleAction(input: {
  userId: string;
  role: "USER" | "ADMIN";
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  if (parsed.data.userId === session.user.id && parsed.data.role === "USER") {
    return { success: false, error: "You can't demote yourself." };
  }

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function setUserActiveAction(input: {
  userId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  if (input.userId === session.user.id && !input.isActive) {
    return { success: false, error: "You can't deactivate yourself." };
  }

  await db.user.update({
    where: { id: input.userId },
    data: { isActive: input.isActive },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  if (userId === session.user.id) {
    return { success: false, error: "You can't delete your own account." };
  }

  await db.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function upsertVideoTemplateAction(
  input: VideoTemplateFormInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const parsed = videoTemplateFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (!data.id) {
    const existing = await db.videoTemplate.findUnique({ where: { slug: data.slug } });
    if (existing) return { success: false, error: "A video template with this slug already exists." };
  }

  const fields = {
    name: data.name,
    slug: data.slug,
    description: data.description,
    previewImage: data.previewImage,
    aspectRatio: data.aspectRatio,
    durationSeconds: data.durationSeconds,
    promptTemplate: data.promptTemplate,
    styleKeywords: data.styleKeywords,
    geminiModel: data.geminiModel,
    isPremium: data.isPremium,
    sortOrder: data.sortOrder,
  };

  if (data.id) {
    await db.videoTemplate.update({ where: { id: data.id }, data: fields });
  } else {
    await db.videoTemplate.create({ data: fields });
  }

  revalidatePath("/admin/video-templates");
  revalidatePath("/dashboard/publish/video");

  return { success: true, data: undefined };
}

export async function deleteVideoTemplateAction(videoTemplateId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const inUse = await db.invitation.count({ where: { videoTemplateId } });
  if (inUse > 0) {
    return {
      success: false,
      error: `${inUse} invitation(s) still reference this video template — cannot delete.`,
    };
  }

  await db.invitationVideo.deleteMany({ where: { videoTemplateId } });
  await db.videoTemplate.delete({ where: { id: videoTemplateId } });

  revalidatePath("/admin/video-templates");
  return { success: true, data: undefined };
}

export async function adminDeleteMediaAction(mediaId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) return { success: false, error: "Not found." };

  if (media.cloudinaryId && isCloudinaryConfigured()) {
    await deleteImage(media.cloudinaryId, media.type === "VIDEO" ? "video" : "image").catch(
      (error) => console.error("Failed to delete Cloudinary asset", error),
    );
  }

  await db.media.delete({ where: { id: mediaId } });

  revalidatePath("/admin/invitations");
  return { success: true, data: undefined };
}

export async function adminRegenerateEditLinkAction(
  invitationId: string,
): Promise<ActionResult<{ editUrl: string }>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { phoneLink: true },
  });
  if (!invitation) return { success: false, error: "Invitation not found." };
  if (!invitation.phoneLink) {
    return { success: false, error: "This invitation has no WhatsApp-verified owner yet." };
  }

  const rawEditToken = generateToken();
  await db.phoneLink.update({
    where: { id: invitation.phoneLink.id },
    data: { editTokenHash: hashToken(rawEditToken) },
  });

  revalidatePath("/admin/invitations");
  return { success: true, data: { editUrl: `${getAppUrl()}/e/${rawEditToken}` } };
}
