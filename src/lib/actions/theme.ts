"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/actions/auth";

const colorPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  foreground: z.string(),
});

const fontPairingSchema = z.object({
  display: z.string(),
  body: z.string(),
  script: z.string(),
});

const GALLERY_ANIMATIONS = ["fade", "slide", "zoom", "flip", "blur"] as const;

const updateThemeSchema = z.object({
  invitationId: z.string(),
  themeSlug: z.string().optional(),
  colorPalette: colorPaletteSchema.optional(),
  fontPairing: fontPairingSchema.optional(),
  musicTrackId: z.string().nullable().optional(),
  customMusicUrl: z.string().nullable().optional(),
  galleryAnimation: z.enum(GALLERY_ANIMATIONS).optional(),
});

export async function updateInvitationThemeAction(
  input: z.infer<typeof updateThemeSchema>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = updateThemeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const invitation = await db.invitation.findUnique({
    where: { id: parsed.data.invitationId },
  });
  if (!invitation || invitation.userId !== session.user.id) {
    return { success: false, error: "Invitation not found." };
  }

  let themeId: string | undefined;
  if (parsed.data.themeSlug) {
    const theme = await db.theme.findUnique({ where: { slug: parsed.data.themeSlug } });
    if (!theme || theme.type !== "WEBSITE") return { success: false, error: "Unknown theme." };
    themeId = theme.id;
  }

  if (parsed.data.musicTrackId) {
    const track = await db.musicTrack.findUnique({ where: { id: parsed.data.musicTrackId } });
    if (!track) return { success: false, error: "Unknown music track." };
  }

  await db.invitation.update({
    where: { id: parsed.data.invitationId },
    data: {
      ...(themeId ? { themeId } : {}),
      ...(parsed.data.colorPalette ? { colorPalette: parsed.data.colorPalette } : {}),
      ...(parsed.data.fontPairing ? { fontPairing: parsed.data.fontPairing } : {}),
      ...(parsed.data.musicTrackId !== undefined
        ? { musicTrackId: parsed.data.musicTrackId || null }
        : {}),
      ...(parsed.data.customMusicUrl !== undefined
        ? { customMusicUrl: parsed.data.customMusicUrl || null }
        : {}),
      ...(parsed.data.galleryAnimation ? { galleryAnimation: parsed.data.galleryAnimation } : {}),
    },
  });

  revalidatePath("/dashboard/publish/theme");
  revalidatePath(`/invite/${invitation.slug}`);

  return { success: true, data: undefined };
}

const updatePdfThemeSchema = z.object({
  invitationId: z.string(),
  pdfThemeSlug: z.string().nullable(),
});

/**
 * Sets (or clears) the PDF-specific theme override used by the
 * `?print=1` "Download PDF" flow. Clearing it falls back to the
 * invitation's website theme.
 */
export async function updateInvitationPdfThemeAction(
  input: z.infer<typeof updatePdfThemeSchema>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = updatePdfThemeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const invitation = await db.invitation.findUnique({
    where: { id: parsed.data.invitationId },
  });
  if (!invitation || invitation.userId !== session.user.id) {
    return { success: false, error: "Invitation not found." };
  }

  let pdfThemeId: string | null = null;
  if (parsed.data.pdfThemeSlug) {
    const theme = await db.theme.findUnique({ where: { slug: parsed.data.pdfThemeSlug } });
    if (!theme || theme.type !== "PDF") return { success: false, error: "Unknown PDF theme." };
    pdfThemeId = theme.id;
  }

  await db.invitation.update({
    where: { id: parsed.data.invitationId },
    data: { pdfThemeId },
  });

  revalidatePath("/dashboard/publish/pdf");
  revalidatePath(`/invite/${invitation.slug}`);

  return { success: true, data: undefined };
}
