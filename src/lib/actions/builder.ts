"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/actions/auth";

const sectionConfigEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  order: z.number().int(),
});

const inputSchema = z.object({
  invitationId: z.string(),
  sections: z.array(sectionConfigEntrySchema),
});

export async function updateSectionConfigAction(
  input: z.infer<typeof inputSchema>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid section configuration." };
  }

  const invitation = await db.invitation.findUnique({
    where: { id: parsed.data.invitationId },
  });
  if (!invitation || invitation.userId !== session.user.id) {
    return { success: false, error: "Invitation not found." };
  }

  await db.invitation.update({
    where: { id: parsed.data.invitationId },
    data: { sectionConfig: parsed.data.sections },
  });

  revalidatePath("/dashboard/builder");
  revalidatePath(`/invite/${invitation.slug}`);

  return { success: true, data: undefined };
}
