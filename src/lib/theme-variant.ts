import { DEFAULT_SECTION_ORDER } from "@/lib/invitation-helpers";
import { mergeThemeDecor } from "@/lib/theme-recipe";

export type ResolvedThemePalette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
};

export type ResolvedThemeFonts = {
  display: string;
  body: string;
  script: string;
};

type BaseThemeLike = {
  colorPalette: unknown;
  fontPairing: unknown;
  decorAssets?: unknown;
  revealMode?: string | null;
  revealVideoUrl?: string | null;
  defaultMusicTrackId?: string | null;
  galleryAnimation?: string | null;
  isPremium?: boolean;
  previewImage?: string | null;
};

type VariantLike = {
  colorPalette?: unknown;
  fontPairing?: unknown;
  decorAssets?: unknown;
  revealMode?: string | null;
  revealVideoUrl?: string | null;
  musicTrackId?: string | null;
  galleryAnimation?: string | null;
  sectionOrder?: unknown;
  isPremium?: boolean;
  previewImage?: string | null;
};

function paletteFrom(input: unknown): ResolvedThemePalette {
  const value = (input ?? {}) as Partial<ResolvedThemePalette>;
  return {
    primary: value.primary ?? "#7a2e2e",
    secondary: value.secondary ?? "#f3d9d9",
    accent: value.accent ?? "#c9942a",
    background: value.background ?? "#faf3ea",
    foreground: value.foreground ?? "#3a1414",
  };
}

function fontsFrom(input: unknown): ResolvedThemeFonts {
  const value = (input ?? {}) as Partial<ResolvedThemeFonts>;
  return {
    display: value.display ?? "Playfair Display",
    body: value.body ?? "Cormorant Garamond",
    script: value.script ?? "Great Vibes",
  };
}

export function resolveThemeVariant(
  theme: BaseThemeLike,
  variant?: VariantLike | null,
  baseSectionOrder?: string[] | null,
) {
  const variantSections = Array.isArray(variant?.sectionOrder)
    ? variant?.sectionOrder.filter((value): value is string => typeof value === "string")
    : null;

  return {
    colorPalette: paletteFrom(variant?.colorPalette ?? theme.colorPalette),
    fontPairing: fontsFrom(variant?.fontPairing ?? theme.fontPairing),
    decorAssets: mergeThemeDecor(theme.decorAssets, variant?.decorAssets),
    revealMode: variant?.revealMode || theme.revealMode || "ANIMATION",
    revealVideoUrl: variant?.revealVideoUrl || theme.revealVideoUrl || null,
    musicTrackId: variant?.musicTrackId ?? theme.defaultMusicTrackId ?? null,
    galleryAnimation: variant?.galleryAnimation || theme.galleryAnimation || "fade",
    sectionOrder:
      variantSections?.length
        ? variantSections
        : baseSectionOrder?.length
          ? baseSectionOrder
          : [...DEFAULT_SECTION_ORDER],
    isPremium: Boolean(variant?.isPremium || theme.isPremium),
    previewImage: variant?.previewImage || theme.previewImage || null,
  };
}

export function sectionConfigFromOrder(sectionOrder: string[]) {
  return sectionOrder.map((type, order) => ({
    id: type,
    type,
    visible: true,
    locked: false,
    order,
  }));
}
