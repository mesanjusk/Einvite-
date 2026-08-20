/**
 * Whether an invitation that came from Instagram is live for its guests.
 *
 * The offer is: comment the keyword, follow, and build your invitation for
 * free — no restrictions, no account, nothing to pay. Building it is never
 * gated, because a half-finished invitation nobody can share is worth
 * nothing to anyone. What the follow buys is *circulation*: the public page
 * the couple sends to their family stays live while they follow, and goes
 * back to a follow-first screen when they don't.
 *
 * The gate wants a *confirmed* follow, not merely the absence of a refusal.
 * It read the other way first — pause only on a plain "no" — and that made
 * the whole thing ornamental: `is_user_follow_business` answers "I don't
 * know" often enough, and a stale yes lives long enough, that an unfollowed
 * account kept circulating exactly as before. "Unfollowing must stop the
 * link working" cannot survive a maybe being counted as a yes.
 *
 * The softness that remains lives one layer down, in readFollowStatus: a
 * check Instagram won't answer falls back to the last answer it did give,
 * for a few hours, so an outage at Meta's end doesn't take a wedding
 * invitation off the internet in front of its guests. Past that window the
 * silence stops counting as a yes and the page pauses.
 */

export type PublicationDecision =
  // Show the invitation.
  | "LIVE"
  // Show the follow-first screen instead.
  | "PAUSED";

export function decidePublication({
  gateEnabled,
  fromInstagram,
  isFollower,
}: {
  // The account-wide switch. Off means invitations are never gated.
  gateEnabled: boolean;
  // Whether this invitation was claimed through Instagram at all. One made
  // from the website or a WhatsApp number was never part of the offer and is
  // never gated by it.
  fromInstagram: boolean;
  // null when Instagram wouldn't say.
  isFollower: boolean | null;
}): PublicationDecision {
  if (!gateEnabled || !fromInstagram) return "LIVE";
  // Only a confirmed follower circulates. A "no" and an "I don't know" both
  // pause — see above for why the second one has to.
  return isFollower === true ? "LIVE" : "PAUSED";
}

/**
 * The @handle in an Instagram profile URL, for wording that reads like a
 * person rather than a link. Returns null for anything that isn't one, so
 * the screen falls back to saying "our Instagram".
 */
export function instagramHandleFrom(profileUrl?: string | null): string | null {
  if (!profileUrl) return null;

  try {
    const url = new URL(profileUrl.trim());
    if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return null;

    const handle = url.pathname.split("/").filter(Boolean)[0];
    return handle ? `@${handle}` : null;
  } catch {
    return null;
  }
}

/**
 * What the follow-first screen says when an admin hasn't written their own.
 * Addressed to whoever opened the link — which is usually a guest, not the
 * couple, and the ask has to make sense to both.
 */
export const DEFAULT_PAUSED_MESSAGE =
  "This invitation was made free through an Instagram promotion. It goes live for everyone the moment its owner follows the account — and stays live for as long as they do.";
