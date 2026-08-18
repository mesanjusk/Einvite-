import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasGuestAccess } from "@/lib/guest-session";

/**
 * Shared authorization for anything that touches an invitation's media —
 * either the signed-in owner (dashboard flow) or a guest holding the
 * matching draft/owner cookie (public "Get started" flow). Returns the
 * invitation (with its phone link, for callers that need it) or null.
 */
export async function authorizeInvitationAccess(invitationId: string) {
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { phoneLink: true, instagramLink: true },
  });
  if (!invitation) return null;

  const session = await auth();
  if (session?.user && invitation.userId === session.user.id) return invitation;

  // Either ownership link can authorize: the phone one from the WhatsApp
  // publish flow, or the Instagram one from the comment-to-DM flow.
  const guestOk = await hasGuestAccess(invitation, [
    invitation.phoneLink?.editTokenHash,
    invitation.instagramLink?.editTokenHash,
  ]);
  return guestOk ? invitation : null;
}
