import { describe, expect, it } from "vitest";

import { decideFollowGate, decideLinkGate } from "./instagram-follow-gate";

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

describe("decideLinkGate", () => {
  it("holds the link back when the account rule is on, whatever the rule says", () => {
    // The leak this exists to close: a reel or DM rule with its own switch
    // off used to hand links to non-followers.
    expect(
      decideLinkGate({
        accountFollowersOnly: true,
        ruleRequiresFollow: false,
        isFollower: false,
      }),
    ).toBe("NOT_FOLLOWING");

    expect(
      decideLinkGate({
        accountFollowersOnly: true,
        ruleRequiresFollow: false,
        isFollower: null,
      }),
    ).toBe("UNVERIFIED");
  });

  it("still sends to a confirmed follower", () => {
    expect(decideLinkGate({ accountFollowersOnly: true, isFollower: true })).toBe(
      "ALLOW",
    );
  });

  it("lets a single reel tighten past an account rule that is off", () => {
    expect(
      decideLinkGate({
        accountFollowersOnly: false,
        ruleRequiresFollow: true,
        isFollower: false,
      }),
    ).toBe("NOT_FOLLOWING");
  });

  it("opens the gate only when the account rule is off and nothing else asks", () => {
    expect(
      decideLinkGate({
        accountFollowersOnly: false,
        ruleRequiresFollow: false,
        isFollower: false,
      }),
    ).toBe("ALLOW");
  });
});
