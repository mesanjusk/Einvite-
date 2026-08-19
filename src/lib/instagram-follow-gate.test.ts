import { describe, expect, it } from "vitest";

import { decideFollowGate } from "./instagram-follow-gate";

describe("decideFollowGate", () => {
  it("sends the link when the automation isn't followers-only", () => {
    expect(decideFollowGate({ requireFollow: false, isFollower: false })).toBe("ALLOW");
    expect(decideFollowGate({ requireFollow: false, isFollower: null })).toBe("ALLOW");
  });

  it("sends the link to a confirmed follower", () => {
    expect(decideFollowGate({ requireFollow: true, isFollower: true })).toBe("ALLOW");
  });

  it("asks a confirmed non-follower to follow", () => {
    expect(decideFollowGate({ requireFollow: true, isFollower: false })).toBe(
      "NOT_FOLLOWING",
    );
  });

  it("withholds the link when the follow status can't be resolved", () => {
    // The bug this guards: unknown used to send the link, and unknown is the
    // normal answer for a commenter who has never messaged the account — so a
    // followers-only reel was handing its link to non-followers.
    expect(decideFollowGate({ requireFollow: true, isFollower: null })).toBe(
      "UNVERIFIED",
    );
  });
});
