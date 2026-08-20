/**
 * Erasing everything we hold about one Instagram user.
 *
 * /data-deletion promises to remove "your Instagram user ID, username, stored
 * follower status, comment records, and your invitation with its access link",
 * and Meta requires the same erasure to be reachable without a human in the
 * loop — from the deauthorize callback when someone disconnects the app, and
 * from the data deletion callback when they ask through Meta. All three routes
 * plus the "DELETE" DM run this one function so they cannot drift apart and
 * leave the promise partly kept.
 */

import { db } from "@/lib/db";

export type InstagramDeletionSummary = {
  invitationsDeleted: number;
  linksDeleted: number;
  leadsDeleted: number;
  profilesDeleted: number;
  commentLogsDeleted: number;
  messageLogsDeleted: number;
  flowStatesDeleted: number;
};

export async function deleteInstagramUserData(
  igUserId: string,
): Promise<InstagramDeletionSummary> {
  // The invitation goes first and takes its InstagramLink with it: every
  // child of Invitation cascades, so this is also what clears the events,
  // photos, guests, and RSVPs that belong to the invitation being erased.
  const link = await db.instagramLink.findUnique({
    where: { igUserId },
    select: { invitationId: true },
  });

  let invitationsDeleted = 0;
  let linksDeleted = 0;

  if (link) {
    await db.invitation.delete({ where: { id: link.invitationId } });
    invitationsDeleted = 1;
    linksDeleted = 1;
  }

  // Deleting the invitation cascades the link away, but a link can also be
  // orphaned by an invitation deleted elsewhere, so sweep by user id too.
  const strayLinks = await db.instagramLink.deleteMany({ where: { igUserId } });
  linksDeleted += strayLinks.count;

  const [leads, profiles, commentLogs, messageLogs, flowStates] = await Promise.all([
    db.instagramLead.deleteMany({ where: { igUserId } }),
    db.instagramProfile.deleteMany({ where: { igUserId } }),
    db.instagramCommentLog.deleteMany({ where: { igUserId } }),
    // The DM log holds message text this person sent us, so it goes with the
    // rest. A "DELETE" DM logs its own row after this runs, on purpose: that
    // row records the request, not the erased history.
    db.instagramMessageLog.deleteMany({ where: { igUserId } }),
    // Where they had got to in the button flow. Erasing it means a returning
    // user starts the flow from the opener, which is what "fresh" promises.
    db.instagramFlowState.deleteMany({ where: { igUserId } }),
  ]);

  return {
    invitationsDeleted,
    linksDeleted,
    leadsDeleted: leads.count,
    profilesDeleted: profiles.count,
    commentLogsDeleted: commentLogs.count,
    messageLogsDeleted: messageLogs.count,
    flowStatesDeleted: flowStates.count,
  };
}
