import { themeEventSections } from "@/lib/event-sections";
import type { InviteData } from "@/components/invite/types";
import type { ThemeFormValues } from "@/lib/validations/admin";
import { elementsForSection } from "@/lib/theme-element-catalog";
import { themeMusicUrl } from "@/lib/theme-music";

export const PREVIEW_SECTION_TYPES = new Set([
  "ENVELOPE", "HERO", "COUNTDOWN", "TIMELINE", "GALLERY", "STORY", "VENUE", "RSVP", "THANK_YOU",
]);

/** Uses the current form draft; no database read or save is needed to preview. */
export function buildThemePreviewData(draft: ThemeFormValues): InviteData {
  const decor = draft.decorAssets;
  return {
    id: "theme-preview", slug: "theme-preview", eventCategory: draft.eventCategories?.[0] ?? draft.eventCategory ?? "wedding",
    brideName: "Meera", groomName: "Arjun", bridePhoto: null, groomPhoto: null,
    weddingDate: new Date("2026-12-12T18:30:00+05:30"), venueName: "Sample Celebration Palace", venueAddress: "Sample venue address", googleMapsUrl: null,
    customMessage: null, musicUrl: themeMusicUrl(decor), galleryAnimation: "fade",
    copy: draft.content ?? {},
    events: (themeEventSections(decor) ?? ["Sangeet"]).map((name, index) => ({ id: `preview-event-${index}`, name, date: new Date("2026-12-11T19:00:00+05:30"), time: "7:00 PM", venueName: "Sample Celebration Palace", address: null, googleMapsUrl: null, dressCode: "Festive", accentColor: null, tagline: "Join us for this celebration" })),
    familyMembers: [],
    media: [{ id: "preview-photo", url: "/images/theme-preview-photo.svg", caption: "Sample customer photo", type: "IMAGE" }],
    isDemo: true, themeSlug: "preview",
    revealMode: draft.revealMode,
    revealVideoUrl: draft.revealMode === "VIDEO" ? draft.revealVideoUrl || null : null,
    revealVideoWebmUrl: draft.revealMode === "VIDEO" ? decor?.revealVideoWebmUrl || null : null,
    revealVideoPosterUrl: draft.revealMode === "VIDEO" ? decor?.revealVideoPosterUrl || draft.previewImage || null : null,
    revealAnimation: {
      preset: decor?.revealAnimation?.preset ?? "MAGIC_BLOOM",
      intensity: Number(decor?.revealAnimation?.intensity ?? 1),
      speed: Number(decor?.revealAnimation?.speed ?? 1),
    },
    sectionImages: decor?.sectionImages ?? {},
    sectionStyles: (decor?.sectionStyles ?? {}) as InviteData["sectionStyles"],
    elementStyles: (decor?.elementStyles ?? {}) as InviteData["elementStyles"],
    customText: (decor?.customText ?? {}) as InviteData["customText"],
  };
}

/** A library choice is used only if its actual text is present in a visible layer. */
export function contentPlacements(draft: ThemeFormValues, text: string): string[] {
  const target = text.trim();
  if (!target) return [];
  return draft.sectionOrder.filter((section) => {
    const styles = draft.decorAssets?.elementStyles ?? {};
    return elementsForSection(section).some((element) => {
      if (styles[element.key]?.hidden) return false;
      const value = element.coreField ? draft.content?.[element.coreField] : styles[element.key]?.text;
      return value?.trim() === target;
    }) || (draft.decorAssets?.customText?.[section] ?? []).some((block) => block.text.trim() === target);
  });
}
