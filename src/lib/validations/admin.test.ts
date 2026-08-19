import { describe, expect, it } from "vitest";

import { themeFormSchema, musicTrackFormSchema, themeColorwayFormSchema } from "./admin";

const PALETTE = {
  primary: "#7a2e2e",
  secondary: "#f3d9d9",
  accent: "#c9942a",
  background: "#faf3ea",
  foreground: "#3a1414",
};
const FONTS = { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" };

describe("themeFormSchema", () => {
  const base = {
    name: "Royal",
    slug: "royal",
    colorPalette: PALETTE,
    fontPairing: FONTS,
    sectionOrder: ["ENVELOPE", "HERO", "RSVP"] as const,
  };

  it("accepts a valid theme", () => {
    expect(themeFormSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an uppercase or spaced slug", () => {
    expect(themeFormSchema.safeParse({ ...base, slug: "Royal Theme" }).success).toBe(false);
  });

  it("rejects an empty section order", () => {
    expect(themeFormSchema.safeParse({ ...base, sectionOrder: [] }).success).toBe(false);
  });

  it("rejects an unknown section type", () => {
    const result = themeFormSchema.safeParse({ ...base, sectionOrder: ["NOT_A_SECTION"] });
    expect(result.success).toBe(false);
  });

  it("defaults isPremium to false and sortOrder to 0", () => {
    const result = themeFormSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPremium).toBe(false);
      expect(result.data.sortOrder).toBe(0);
    }
  });
});

describe("musicTrackFormSchema", () => {
  it("requires a title and a url", () => {
    expect(musicTrackFormSchema.safeParse({ title: "", url: "" }).success).toBe(false);
    expect(
      musicTrackFormSchema.safeParse({ title: "Song", url: "/music/song.mp3" }).success,
    ).toBe(true);
  });
});

describe("themeColorwayFormSchema", () => {
  const palette = {
    primary: "#1f5140",
    secondary: "#d8e8e0",
    accent: "#c9942a",
    background: "#f6faf7",
    foreground: "#12362a",
  };
  const base = {
    themeId: "t1",
    name: "Emerald & Gold",
    slug: "emerald-gold",
    colorPalette: palette,
  };

  it("accepts a colourway belonging to a theme", () => {
    const result = themeColorwayFormSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sortOrder).toBe(0);
  });

  it("requires the owning theme", () => {
    expect(themeColorwayFormSchema.safeParse({ ...base, themeId: "" }).success).toBe(false);
  });

  it("rejects slugs that aren't url-safe", () => {
    expect(themeColorwayFormSchema.safeParse({ ...base, slug: "Emerald Gold" }).success).toBe(
      false,
    );
  });

  it("requires every palette role, so a partial palette can't render", () => {
    const partial = { ...palette } as Partial<typeof palette>;
    delete partial.foreground;
    expect(
      themeColorwayFormSchema.safeParse({ ...base, colorPalette: partial }).success,
    ).toBe(false);
  });
});
