import { describe, expect, it } from "vitest";

import {
  DEFAULT_FLOW_SETTINGS,
  buildFollowStep,
  buildLinkStep,
  buildOpenerStep,
  buildPublishedStep,
  decodeFlowPayload,
  encodeFlowPayload,
  matchFlowTextReply,
  toPlainText,
  type FlowSettings,
} from "./instagram-flow";

const settings: FlowSettings = {
  ...DEFAULT_FLOW_SETTINGS,
  profileUrl: "https://instagram.com/ourstudio",
};

describe("flow payloads", () => {
  it("round-trips a tap and the reel it started on", () => {
    const payload = encodeFlowPayload("CTA", "652f1a0000000000000000aa");
    expect(decodeFlowPayload(payload)).toEqual({
      tap: "CTA",
      automationId: "652f1a0000000000000000aa",
    });
  });

  it("round-trips a tap with no reel behind it", () => {
    expect(decodeFlowPayload(encodeFlowPayload("FOLLOWING"))).toEqual({
      tap: "FOLLOWING",
      automationId: undefined,
    });
  });

  it("ignores payloads that aren't ours", () => {
    // Meta sends postbacks from its own surfaces through the same field, and
    // reading one as a tap would hand out a link nobody asked for.
    expect(decodeFlowPayload("GET_STARTED")).toBeNull();
    expect(decodeFlowPayload("ig_flow:SOMETHING_ELSE")).toBeNull();
    expect(decodeFlowPayload(undefined)).toBeNull();
  });
});

describe("buildOpenerStep", () => {
  it("offers one button carrying the reel it was sent from", () => {
    const step = buildOpenerStep(settings, {
      username: "asha",
      automationId: "652f1a0000000000000000aa",
    });

    expect(step.text).toBe(settings.openerMessage);
    expect(step.buttons).toEqual([
      {
        type: "postback",
        title: settings.openerButtonLabel,
        payload: "ig_flow:CTA:652f1a0000000000000000aa",
      },
    ]);
  });

  it("never leaks a link — that is the whole point of the opener", () => {
    const step = buildOpenerStep(
      { ...settings, openerMessage: "Tap below {{link}}" },
      {},
    );
    expect(step.text).toBe("Tap below ");
  });
});

describe("buildFollowStep", () => {
  it("pairs the profile link with the button that re-runs the check", () => {
    const step = buildFollowStep(settings, { automationId: "aa" });

    expect(step.text).toBe(settings.followMessage);
    expect(step.buttons).toEqual([
      { type: "url", title: settings.profileButtonLabel, url: settings.profileUrl },
      {
        type: "postback",
        title: settings.followButtonLabel,
        payload: "ig_flow:FOLLOWING:aa",
      },
    ]);
  });

  it("drops the profile button when no profile URL is configured", () => {
    const step = buildFollowStep({ ...settings, profileUrl: null }, {});
    expect(step.buttons).toHaveLength(1);
    expect(step.buttons[0].type).toBe("postback");
  });

  it("keeps the button on a retry so a stale check isn't a dead end", () => {
    const step = buildFollowStep(settings, { retry: true });

    expect(step.text).toBe(settings.stillNotFollowingMessage);
    expect(step.buttons.some((b) => b.type === "postback")).toBe(true);
  });
});

describe("buildLinkStep", () => {
  it("sends the editor link as one plain message", () => {
    const step = buildLinkStep(settings, {
      link: "https://example.com/e/tok",
      username: "asha",
    });

    expect(step.text).toContain("https://example.com/e/tok");
    // No buttons on purpose: a link button turns the message into a card,
    // and a card splits into two bubbles past 80 characters.
    expect(step.buttons).toEqual([]);
  });

  it("sends the already-claimed wording to someone who has a link", () => {
    const step = buildLinkStep(settings, {
      link: "https://example.com/e/tok",
      alreadyClaimed: true,
    });

    expect(step.text).toContain("already have");
    expect(step.text).toContain("https://example.com/e/tok");
  });
});

describe("buildPublishedStep", () => {
  it("sends the public invitation, in one message", () => {
    const step = buildPublishedStep(settings, {
      link: "https://example.com/invite/asha-rohan",
      username: "asha",
    });

    expect(step.text).toContain("https://example.com/invite/asha-rohan");
    expect(step.buttons).toEqual([]);
  });

  it("is about the invitation being live, not about claiming a link", () => {
    // The two messages arrive at different moments and must not read the
    // same: this one lands when the couple press Publish.
    expect(buildPublishedStep(settings, { link: "x" }).text).not.toBe(
      buildLinkStep(settings, { link: "x" }).text,
    );
  });
});

describe("toPlainText", () => {
  it("spells tappable buttons out as words to reply with", () => {
    const step = buildFollowStep(settings, {});
    const plain = toPlainText(step);

    // The URL button has nothing to type, so it isn't offered.
    expect(plain).toContain(settings.followButtonLabel);
    expect(plain).not.toContain(settings.profileButtonLabel);
    expect(plain.startsWith(settings.followMessage)).toBe(true);
  });

  it("leaves a step with no buttons alone", () => {
    const step = buildLinkStep(settings, { link: "https://example.com/e/tok" });
    expect(toPlainText(step)).toBe(step.text);
  });
});

describe("matchFlowTextReply", () => {
  it("reads a typed button label as the tap it stands for", () => {
    expect(matchFlowTextReply("Send me the link", settings)).toBe("CTA");
    expect(matchFlowTextReply("I'm following ✅", settings)).toBe("FOLLOWING");
  });

  it("forgives the emoji, the case, and a curly apostrophe", () => {
    expect(matchFlowTextReply("  i’m following  ", settings)).toBe("FOLLOWING");
    expect(matchFlowTextReply("SEND ME THE LINK", settings)).toBe("CTA");
  });

  it("doesn't read an ordinary message as a tap", () => {
    expect(matchFlowTextReply("are you following me?", settings)).toBeNull();
    expect(matchFlowTextReply("", settings)).toBeNull();
  });
});
