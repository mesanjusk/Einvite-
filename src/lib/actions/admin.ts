"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/actions/auth";
import {
  themeFormSchema,
  musicTrackFormSchema,
  updateUserRoleSchema,
  type ThemeFormInput,
  type MusicTrackFormInput,
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
    name: data.name,
    slug: data.slug,
    description: data.description,
    previewImage: data.previewImage,
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

  revalidatePath("/admin/themes");
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/invitations/new");

  return { success: true, data: undefined };
}

export async function deleteThemeAction(themeId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin access required." };

  const inUse = await db.invitation.count({ where: { themeId } });
  if (inUse > 0) {
    return {
      success: false,
      error: `${inUse} invitation(s) still use this theme — cannot delete.`,
    };
  }

  await db.template.deleteMany({ where: { themeId } });
  await db.theme.delete({ where: { id: themeId } });

  revalidatePath("/admin/themes");
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

  if (data.id) {
    await db.musicTrack.update({
      where: { id: data.id },
      data: {
        title: data.title,
        artist: data.artist,
        url: data.url,
        mood: data.mood,
        isPremium: data.isPremium,
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
      },
    });
  }

  revalidatePath("/admin/music");
  revalidatePath("/dashboard/music");
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
