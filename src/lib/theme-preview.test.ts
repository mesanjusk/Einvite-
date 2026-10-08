import { describe, it, expect } from "vitest";
import { buildThemePreviewData, contentPlacements } from "./theme-preview";
import { startingMusicUrl } from "./theme-music";
import { themeFormSchema } from "./validations/admin";

const draft = themeFormSchema.parse({
  name: "Test draft", colorPalette: { primary: "#76508c", secondary: "#eee6f4", accent: "#a987bd", background: "#ffffff", foreground: "#4b3659" },
  fontPairing: { display: "Playfair Display", body: "Inter", script: "Great Vibes" },
  sectionOrder: ["ENVELOPE", "HERO", "GALLERY", "RSVP"],
  content: { invitationLetter: "Selected library text" },
  revealMode: "VIDEO", revealVideoUrl: "/test.mp4",
  decorAssets: { musicUrl: "/own-music.wav", musicName: "Own music", revealVideoWebmUrl: "/test.webm", revealVideoPosterUrl: "/poster.jpg", sectionImages: { HERO: "/art.jpg" } },
});

describe("theme draft preview", () => {
  it("previews all separately configured events and the selected scratch shape", () => {
    const preview = buildThemePreviewData({ ...draft, decorAssets: { ...draft.decorAssets!, eventSections: ["Sangeet", "Mehendi", "Wedding", "Pheras"], sectionStyles: { COUNTDOWN: { x: 0, y: 0, showBox: true, scratchShape: "heart" } } } });
    expect(preview.events.map((event) => event.name)).toEqual(["Sangeet", "Mehendi", "Wedding", "Pheras"]);
    expect(new Set(preview.events.map((event) => event.id)).size).toBe(4);
    expect(preview.sectionStyles?.COUNTDOWN.scratchShape).toBe("heart");
  });
  it("uses unsaved video, poster, music, artwork and content without mutating the draft", () => {
    const before = JSON.stringify(draft);
    const preview = buildThemePreviewData(draft);
    expect(preview).toMatchObject({ revealVideoUrl: "/test.mp4", revealVideoWebmUrl: "/test.webm", revealVideoPosterUrl: "/poster.jpg", musicUrl: "/own-music.wav", sectionImages: { HERO: "/art.jpg" }, copy: { invitationLetter: "Selected library text" } });
    expect(preview.media).toHaveLength(1);
    expect(JSON.stringify(draft)).toBe(before);
  });
  it("does not play a stored video after the opening switches to coded animation", () => {
    expect(buildThemePreviewData({ ...draft, revealMode: "ANIMATION" })).toMatchObject({ revealVideoUrl: null, revealVideoWebmUrl: null, revealVideoPosterUrl: null });
  });
  it("marks only text that exists in active visible layers, including custom text", () => {
    expect(contentPlacements(draft, "Selected library text")).toEqual(["HERO"]);
    expect(contentPlacements({ ...draft, sectionOrder: ["RSVP"] }, "Selected library text")).toEqual([]);
    expect(contentPlacements({ ...draft, decorAssets: { ...draft.decorAssets, elementStyles: { "HERO.invitationLetter": { hidden: true } } } }, "Selected library text")).toEqual([]);
    expect(contentPlacements({ ...draft, decorAssets: { ...draft.decorAssets, customText: { RSVP: [{ id: "custom", text: "Personal blessing", fontSize: 22, fontRole: "body", align: "center" }] } } }, "Personal blessing")).toEqual(["RSVP"]);
    expect(contentPlacements(draft, "")).toEqual([]);
  });
  it("requires a video choice and keeps audio/reveal metadata when parsing a saved theme", () => {
    expect(themeFormSchema.safeParse({ ...draft, revealVideoUrl: "" }).success).toBe(false);
    expect(themeFormSchema.parse(draft).decorAssets?.musicUrl).toBe("/own-music.wav");
    expect(themeFormSchema.safeParse({ ...draft, decorAssets: { musicUrl: "javascript:alert(1)" } }).success).toBe(false);
  });
});

describe("new invitation theme music", () => {
  it("copies theme audio only when the customer has not chosen a track or silence", () => {
    expect(startingMusicUrl({}, draft.decorAssets)).toBe("/own-music.wav");
    expect(startingMusicUrl({ customMusicUrl: "/customer.wav" }, draft.decorAssets)).toBe("/customer.wav");
    expect(startingMusicUrl({ customMusicUrl: "" }, draft.decorAssets)).toBeNull();
    expect(startingMusicUrl({ musicTrackId: "track-id" }, draft.decorAssets)).toBeNull();
    expect(startingMusicUrl({}, null)).toBeNull();
  });
});

describe("admin text styling round trip", () => {
  it("retains typography for both preloaded layers and added text in the guest preview", () => {
    const typography = { bold: true, italic: false, underline: true, letterSpacing: 1.5, lineHeight: 1.8, opacity: 0.65 };
    const parsed = themeFormSchema.parse({ ...draft, decorAssets: { ...draft.decorAssets, elementStyles: { "HERO.invitationLetter": typography }, customText: { HERO: [{ id: "CUSTOM.HERO.sample", text: "Added blessing", fontSize: 24, fontRole: "body", align: "center", ...typography }] } } });
    const preview = buildThemePreviewData(parsed);
    expect(preview.elementStyles?.["HERO.invitationLetter"]).toMatchObject(typography);
    expect(preview.customText?.HERO[0]).toMatchObject(typography);
    expect(themeFormSchema.safeParse({ ...draft, decorAssets: { elementStyles: { "HERO.invitationLetter": { opacity: 4 } } } }).success).toBe(false);
  });
});
