import { describe, expect, it } from "vitest";

import { decidePublication, instagramHandleFrom } from "./instagram-publication-gate";
import {
  FOLLOWING_TRUST_MS,
  NOT_FOLLOWING_TRUST_MS,
  isFollowStatusStale,
} from "./instagram-follow-status";

describe("decidePublication", () => {
  it("pauses an Instagram invitation whose owner stopped following", () => {
    expect(
      decidePublication({ gateEnabled: true, fromInstagram: true, isFollower: false }),
    ).toBe("PAUSED");
  });

  it("keeps it live while they follow", () => {
    expect(
      decidePublication({ gateEnabled: true, fromInstagram: true, isFollower: true }),
    ).toBe("LIVE");
  });

  it("fails open when Instagram won't answer", () => {
    // The opposite of the gate on *issuing* a link, and deliberately so:
    // taking a wedding invitation off the internet in front of its guests
    // over an API hiccup is worse than a few hours of unearned circulation.
    expect(
      decidePublication({ gateEnabled: true, fromInstagram: true, isFollower: null }),
    ).toBe("LIVE");
  });

  it("never touches an invitation that didn't come from Instagram", () => {
    expect(
      decidePublication({ gateEnabled: true, fromInstagram: false, isFollower: false }),
    ).toBe("LIVE");
  });

  it("does nothing at all when the gate is switched off", () => {
    expect(
      decidePublication({ gateEnabled: false, fromInstagram: true, isFollower: false }),
    ).toBe("LIVE");
  });
});

describe("isFollowStatusStale", () => {
  const now = Date.UTC(2026, 1, 1, 12, 0, 0);
  const ago = (ms: number) => new Date(now - ms);

  it("trusts a recent yes and re-asks an old one", () => {
    expect(isFollowStatusStale({ isFollower: true, checkedAt: ago(60_000) }, now)).toBe(
      false,
    );
    expect(
      isFollowStatusStale(
        { isFollower: true, checkedAt: ago(FOLLOWING_TRUST_MS + 1) },
        now,
      ),
    ).toBe(true);
  });

  it("re-asks a no almost immediately, so following again lands fast", () => {
    expect(
      isFollowStatusStale(
        { isFollower: false, checkedAt: ago(NOT_FOLLOWING_TRUST_MS + 1) },
        now,
      ),
    ).toBe(true);
    // A "no" is trusted far more briefly than a "yes" — that asymmetry is
    // the point, not an accident of the numbers.
    expect(NOT_FOLLOWING_TRUST_MS).toBeLessThan(FOLLOWING_TRUST_MS);
  });

  it("treats nothing stored as stale", () => {
    expect(isFollowStatusStale(null, now)).toBe(true);
  });
});

describe("instagramHandleFrom", () => {
  it("reads the handle out of a profile URL", () => {
    expect(instagramHandleFrom("https://instagram.com/sanjusk")).toBe("@sanjusk");
    expect(instagramHandleFrom("https://www.instagram.com/sanjusk/")).toBe("@sanjusk");
  });

  it("returns null for anything that isn't one", () => {
    expect(instagramHandleFrom("https://example.com/sanjusk")).toBeNull();
    expect(instagramHandleFrom("https://instagram.com")).toBeNull();
    expect(instagramHandleFrom("not a url")).toBeNull();
    expect(instagramHandleFrom(null)).toBeNull();
  });
});
