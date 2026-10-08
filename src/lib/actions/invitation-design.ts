"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { db } from "@/lib/db";
import { getInvitationById, toInviteRenderData } from "@/lib/get-invite-data";
import { safeDesignSuggestion, suggestionStyles } from "@/lib/design-assist";
import { elementsForSection } from "@/lib/theme-element-catalog";
import type { ActionResult } from "./auth";

export async function saveInvitationDesignAction(invitationId: string, input: unknown): Promise<ActionResult<ReturnType<typeof toInviteRenderData>>> {
  if (!await authorizeInvitationAccess(invitationId)) return { success: false, error: "Invitation not found." };
  const invitation = await getInvitationById(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };
  const rendered = toInviteRenderData(invitation);
  const allowedKeys = rendered.sectionConfig.flatMap((section) => [
    ...elementsForSection(section.type).map((element) => element.key),
    ...(rendered.inviteData.customText?.[section.type] ?? []).map((block) => block.id),
  ]);
  let suggestion;
  try { suggestion = safeDesignSuggestion(input, allowedKeys); }
  catch { return { success: false, error: "Invalid design suggestion. Analyze the current sections again." }; }
  const styles = suggestionStyles(suggestion);
  const sections = rendered.sectionConfig.map((section) => {
    const keys = [...elementsForSection(section.type).map((element) => element.key), ...(rendered.inviteData.customText?.[section.type] ?? []).map((block) => block.id)];
    return { ...section, elementStyles: { ...section.elementStyles, ...Object.fromEntries(keys.filter((key) => styles[key]).map((key) => [key, styles[key]])) } };
  });
  await db.invitation.update({ where: { id: invitationId }, data: {
    colorPalette: suggestion.palette, fontPairing: suggestion.fonts,
    sectionConfig: JSON.parse(JSON.stringify(sections)) as Prisma.InputJsonValue,
  } });
  const saved = await getInvitationById(invitationId);
  if (!saved) return { success: false, error: "Invitation not found." };
  revalidatePath(`/invite/${saved.slug}`); revalidatePath(`/design/${invitationId}`);
  return { success: true, data: toInviteRenderData(saved) };
}
