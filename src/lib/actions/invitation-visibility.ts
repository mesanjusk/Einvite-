"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { resolveInvitationVisibility } from "@/lib/instagram-invitation-visibility";

/**
 * The "I've followed — check again" button on the paused screen.
 *
 * Public and unauthenticated by necessity: whoever is looking at a paused
 * invitation is a guest with no account, and the couple themselves usually
 * aren't signed in either. That makes it a button anyone can press, so it
 * only ever does two things — re-ask Instagram about one account, and say
 * live or not — and `readFollowStatus` won't re-ask more than once a minute
 * while the answer stays no. It reveals nothing: the caller already holds
 * the slug, and "is this page live" is what the page itself answers.
 */
export async function recheckInvitationVisibilityAction(
  slug: string,
): Promise<{ live: boolean }> {
  const invitation = await db.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!invitation) return { live: false };

  const visibility = await resolveInvitationVisibility(invitation.id, {
    force: true,
  });

  if (visibility.decision === "LIVE") revalidatePath(`/invite/${slug}`);

  return { live: visibility.decision === "LIVE" };
}
