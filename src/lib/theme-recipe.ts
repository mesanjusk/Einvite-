export const EFFECT_PRESETS = ["mixed", "petals", "sparkles", "confetti", "minimal"] as const;
export const EFFECT_INTENSITIES = ["low", "medium", "high"] as const;
export const HERO_STYLES = ["classic", "royal", "glass", "minimal"] as const;
export const GALLERY_STYLES = ["polaroid", "royal-stack", "clean"] as const;

export type EffectPreset = (typeof EFFECT_PRESETS)[number];
export type EffectIntensity = (typeof EFFECT_INTENSITIES)[number];
export type HeroStyle = (typeof HERO_STYLES)[number];
export type GalleryStyle = (typeof GALLERY_STYLES)[number];

export type ThemeDecorConfig = {
  effectPreset: EffectPreset;
  effectIntensity: EffectIntensity;
  heroStyle: HeroStyle;
  galleryStyle: GalleryStyle;
  backgroundImageUrl?: string;
  motifImageUrl?: string;
};

export const DEFAULT_THEME_DECOR: ThemeDecorConfig = {
  effectPreset: "mixed",
  effectIntensity: "medium",
  heroStyle: "classic",
  galleryStyle: "polaroid",
  backgroundImageUrl: undefined,
  motifImageUrl: undefined,
};

export function normalizeThemeDecor(input: unknown): ThemeDecorConfig {
  const value = (input ?? {}) as Partial<ThemeDecorConfig>;

  return {
    effectPreset: EFFECT_PRESETS.includes(value.effectPreset as EffectPreset)
      ? (value.effectPreset as EffectPreset)
      : DEFAULT_THEME_DECOR.effectPreset,
    effectIntensity: EFFECT_INTENSITIES.includes(value.effectIntensity as EffectIntensity)
      ? (value.effectIntensity as EffectIntensity)
      : DEFAULT_THEME_DECOR.effectIntensity,
    heroStyle: HERO_STYLES.includes(value.heroStyle as HeroStyle)
      ? (value.heroStyle as HeroStyle)
      : DEFAULT_THEME_DECOR.heroStyle,
    galleryStyle: GALLERY_STYLES.includes(value.galleryStyle as GalleryStyle)
      ? (value.galleryStyle as GalleryStyle)
      : DEFAULT_THEME_DECOR.galleryStyle,
    backgroundImageUrl:
      typeof value.backgroundImageUrl === "string" && value.backgroundImageUrl.trim()
        ? value.backgroundImageUrl.trim()
        : undefined,
    motifImageUrl:
      typeof value.motifImageUrl === "string" && value.motifImageUrl.trim()
        ? value.motifImageUrl.trim()
        : undefined,
  };
}

export function mergeThemeDecor(base: unknown, override: unknown): ThemeDecorConfig {
  const normalizedBase = normalizeThemeDecor(base);
  const rawOverride = (override ?? {}) as Partial<ThemeDecorConfig>;

  return normalizeThemeDecor({
    ...normalizedBase,
    ...Object.fromEntries(
      Object.entries(rawOverride).filter(([, value]) => value !== undefined && value !== null && value !== ""),
    ),
  });
}
