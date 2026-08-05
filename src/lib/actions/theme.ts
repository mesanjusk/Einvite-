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

const updateThemeSchema = z.object({
  invitationId: z.string(),
  themeSlug: z.string().optional(),
  colorPalette: colorPaletteSchema.optional(),
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
    if (!theme) return { success: false, error: "Unknown theme." };
    themeId = theme.id;
  }

  await db.invitation.update({
    where: { id: parsed.data.invitationId },
    data: {
      ...(themeId ? { themeId } : {}),
      ...(parsed.data.colorPalette ? { colorPalette: parsed.data.colorPalette } : {}),
    },
  });

  revalidatePath("/dashboard/theme-editor");
  revalidatePath(`/invite/${invitation.slug}`);

  return { success: true, data: undefined };
}
