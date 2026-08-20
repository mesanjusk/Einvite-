/**
 * The publication gate, wired to the database.
 *
 * One call answers "should this invitation render?" for the public page, the
 * PDF, and the couple's own manage screen, so the three can never disagree
 * about whether an invitation is live.
 */

import { db } from "@/lib/db";
import { readFollowStatus } from "@/lib/instagram-follow-status";
import {
  DEFAULT_PAUSED_MESSAGE,
  decidePublication,
  instagramHandleFrom,
  type PublicationDecision,
} from "@/lib/instagram-publication-gate";

export type InvitationVisibility = {
  decision: PublicationDecision;
  // Whether this invitation is subject to the gate at all — false for one
  // that never came from Instagram, which is most of them.
  gated: boolean;
  profileUrl: string | null;
  handle: string | null;
  message: string;
};

const LIVE_UNGATED: InvitationVisibility = {
  decision: "LIVE",
  gated: false,
  profileUrl: null,
  handle: null,
  message: DEFAULT_PAUSED_MESSAGE,
};

/**
 * Is this invitation live right now, and if not, what should the screen say?
 *
 * `force` re-asks Instagram instead of trusting a stored answer — what the
 * "I've followed" button on the paused screen does, so following takes effect
 * on the next click rather than whenever the cache happens to lapse.
 */
export async function resolveInvitationVisibility(
  invitationId: string,
  options: { force?: boolean } = {},
): Promise<InvitationVisibility> {
  const [link, settings] = await Promise.all([
    db.instagramLink.findUnique({
      where: { invitationId },
      select: { igUserId: true },
    }),
    db.instagramFlowSettings.findUnique({ where: { key: "default" } }),
  ]);

  // Not an Instagram invitation: nothing to gate, and no reason to have
  // spent a thought on it.
  if (!link) return LIVE_UNGATED;

  // No settings row means the defaults are in force, and those gate.
  const gateEnabled = settings?.gateInvitations ?? true;
  if (!gateEnabled) return LIVE_UNGATED;

  const isFollower = await readFollowStatus(link.igUserId, options);

  return {
    decision: decidePublication({
      gateEnabled: true,
      fromInstagram: true,
      isFollower,
    }),
    gated: true,
    profileUrl: settings?.profileUrl ?? null,
    handle: instagramHandleFrom(settings?.profileUrl),
    message: settings?.pausedMessage?.trim() || DEFAULT_PAUSED_MESSAGE,
  };
}
