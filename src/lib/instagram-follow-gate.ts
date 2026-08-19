/**
 * Whether a commenter gets the link when an automation is followers-only.
 *
 * Kept apart from the webhook route so the decision is testable without a
 * database or a Meta payload, the same way `selectDmRule` is.
 *
 * The subtle case is an *unverified* status. Instagram has no general "does
 * user X follow account Y" lookup — the only source is the messaging User
 * Profile endpoint's `is_user_follow_business`, which it resolves only for
 * users it considers reachable (in practice, ones with an existing
 * conversation). A commenter who has never messaged the account therefore
 * comes back as unknown, and that is the *common* case for a fresh
 * commenter, not a rare one.
 *
 * This used to fail open — unknown sent the link — which meant a
 * followers-only reel handed its link to everyone who commented, since
 * almost every first-time commenter is unresolvable. So unknown now fails
 * closed: they are asked to follow and comment again. The reply itself is a
 * private reply to the comment, which opens a conversation, so the second
 * comment resolves for real and a genuine follower gets the link then.
 *
 * The escape hatch when an account's follow lookups never resolve at all
 * (missing permission, say) is the "Followers only" toggle itself — turning
 * it off is what "send the link regardless" means now.
 */

export type FollowGateDecision =
  // Send the link.
  | "ALLOW"
  // Instagram says they don't follow: ask them to follow.
  | "NOT_FOLLOWING"
  // Instagram couldn't tell us: ask them to follow, and find out for real
  // when they comment again.
  | "UNVERIFIED";

export function decideFollowGate({
  requireFollow,
  isFollower,
}: {
  requireFollow: boolean;
  // null when Instagram couldn't resolve the status at all.
  isFollower: boolean | null;
}): FollowGateDecision {
  if (!requireFollow) return "ALLOW";
  if (isFollower === true) return "ALLOW";
  if (isFollower === false) return "NOT_FOLLOWING";
  return "UNVERIFIED";
}
