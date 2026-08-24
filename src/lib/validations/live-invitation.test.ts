import { describe, expect, it } from "vitest";

import { livePatchSchema, liveEventPatchSchema } from "./live-invitation";

describe("livePatchSchema", () => {
  it("accepts a single tapped field on its own", () => {
    const parsed = livePatchSchema.safeParse({ brideName: "Aarti" });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual({ brideName: "Aarti" });
  });

  it("drops fields the editor is not allowed to write", () => {
    const parsed = livePatchSchema.safeParse({
      brideName: "Aarti",
      status: "PUBLISHED",
      userId: "someone-else",
      draftSecretHash: "stolen",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual({ brideName: "Aarti" });
  });

  it("only takes a date in the shape the date picker produces", () => {
    expect(livePatchSchema.safeParse({ weddingDate: "2026-02-14" }).success).toBe(true);
    expect(livePatchSchema.safeParse({ weddingDate: "14/02/2026" }).success).toBe(
      false,
    );
    expect(livePatchSchema.safeParse({ weddingDate: "next spring" }).success).toBe(
      false,
    );
  });

  it("refuses a name longer than the invitation can print", () => {
    expect(livePatchSchema.safeParse({ brideName: "a".repeat(81) }).success).toBe(
      false,
    );
  });

  it("lets music be cleared but not set to a number", () => {
    expect(livePatchSchema.safeParse({ musicTrackId: null }).success).toBe(true);
    expect(livePatchSchema.safeParse({ customMusicUrl: null }).success).toBe(true);
    expect(livePatchSchema.safeParse({ musicTrackId: 7 }).success).toBe(false);
  });

  it("keeps copy overrides to the three lines the editor exposes", () => {
    const parsed = livePatchSchema.safeParse({
      copy: { storyHeadline: "Forever Us", seoTitle: "spam" },
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.copy).toEqual({ storyHeadline: "Forever Us" });
  });

  it("only allows a gallery animation the renderer knows", () => {
    expect(livePatchSchema.safeParse({ galleryAnimation: "blur" }).success).toBe(true);
    expect(livePatchSchema.safeParse({ galleryAnimation: "explode" }).success).toBe(
      false,
    );
  });
});

describe("liveEventPatchSchema", () => {
  it("takes one detail of one ceremony", () => {
    const parsed = liveEventPatchSchema.safeParse({ time: "7:00 PM" });
    expect(parsed.success && parsed.data).toEqual({ time: "7:00 PM" });
  });

  it("accepts null for the optional rows, so clearing one removes it", () => {
    const parsed = liveEventPatchSchema.safeParse({
      time: null,
      venueName: null,
      dressCode: null,
      tagline: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invitation id smuggled in alongside", () => {
    const parsed = liveEventPatchSchema.safeParse({
      name: "Haldi",
      invitationId: "other",
    });
    expect(parsed.success && parsed.data).toEqual({ name: "Haldi" });
  });
});
