/**
 * Follower status, read two different ways for two different jobs.
 *
 * Issuing a link asks the question once, at a moment we control, and must
 * never answer from memory — a cached "yes" was long enough to follow, take
 * a link, unfollow, and keep passing on the way back. That path calls
 * `checkFollowStatusLive`.
 *
 * Keeping an invitation live asks the same question on every public page
 * view, from visitors who have nothing to do with Instagram. Calling Meta on
 * each of those would be one API call per guest per refresh, so that path
 * calls `readFollowStatus`, which serves the stored answer until it is stale
 * enough to be worth re-asking.
 *
 * The staleness rule is deliberately lopsided, because the two mistakes cost
 * different things. Believing someone still follows for a few minutes after
 * they stopped costs a few minutes of a live invitation. Believing they still
 * *don't* follow costs a couple who just followed a page that stays dark
 * while they wonder whether it worked — so a negative is re-checked almost
 * immediately, and a positive is allowed to sit.
 */

import { db } from "@/lib/db";
import { fetchInstagramFollowStatus } from "@/lib/instagram";

// How long a "they follow us" answer is trusted for the publication gate.
export const FOLLOWING_TRUST_MS = 15 * 60 * 1000;
// How long a "they don't" answer is trusted. Short: this is the answer that
// keeps an invitation dark, and following again has to take effect quickly
// or nobody believes it worked.
export const NOT_FOLLOWING_TRUST_MS = 60 * 1000;

export type StoredFollowStatus = {
  isFollower: boolean;
  checkedAt: Date;
} | null;

/**
 * Whether a stored answer is too old to keep using. Pure, so the policy is
 * testable without a database or a clock.
 */
export function isFollowStatusStale(
  stored: StoredFollowStatus,
  now: number = Date.now(),
): boolean {
  if (!stored) return true;

  const age = now - stored.checkedAt.getTime();
  return age >= (stored.isFollower ? FOLLOWING_TRUST_MS : NOT_FOLLOWING_TRUST_MS);
}

/**
 * Asks Instagram, every time, and records what it said.
 *
 * Returns null when the status can't be resolved at all — the caller decides
 * what that means, and for anything that hands out a link it means "no"
 * (see decideFollowGate). Unresolved answers are not stored: they say
 * nothing, and writing one would age out a real answer we already had.
 */
export async function checkFollowStatusLive(
  igUserId: string,
  username?: string,
): Promise<boolean | null> {
  const { isFollower, username: fetchedUsername } =
    await fetchInstagramFollowStatus(igUserId);
  if (isFollower === null) return null;

  await db.instagramProfile.upsert({
    where: { igUserId },
    create: {
      igUserId,
      username: fetchedUsername ?? username,
      isFollower,
      checkedAt: new Date(),
    },
    update: {
      username: fetchedUsername ?? username,
      isFollower,
      checkedAt: new Date(),
    },
  });

  return isFollower;
}

/**
 * The status as the publication gate should read it: stored while it is
 * fresh, re-asked when it isn't.
 *
 * When the re-ask comes back unresolved — a hiccup at Meta's end, a token
 * that needs refreshing — the stored answer stands rather than the
 * invitation going dark on a question nobody actually answered. With nothing
 * stored at all there is nothing to stand on, and null is returned for the
 * caller to treat as its own kind of no.
 */
export async function readFollowStatus(
  igUserId: string,
  options: { force?: boolean } = {},
): Promise<boolean | null> {
  const stored = await db.instagramProfile.findUnique({
    where: { igUserId },
    select: { isFollower: true, checkedAt: true },
  });

  if (!options.force && !isFollowStatusStale(stored)) {
    return stored!.isFollower;
  }

  const live = await checkFollowStatusLive(igUserId);
  return live ?? stored?.isFollower ?? null;
}
