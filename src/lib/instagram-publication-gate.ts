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
 * That is the whole trade, and it is why this gate looks nothing like the
 * one on issuing a link. That one fails closed on an unresolved check,
 * because a stranger who can't be resolved is exactly who it exists to stop.
 * This one fails *open* on the same answer: the person behind it already
 * passed the first gate, has a real conversation with the account, and
 * resolves reliably — so an unresolved answer here means Instagram is having
 * a moment, not that a couple is cheating. Taking a wedding invitation off
 * the internet in front of their guests over an API hiccup is the one
 * outcome worth engineering against.
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
  // Fails open, as above: only a plain "no" pauses an invitation.
  return isFollower === false ? "PAUSED" : "LIVE";
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
