export const CUSTOM_EXPERIENCE_KEYS = ["royal-story"] as const;

export type CustomExperienceKey = (typeof CUSTOM_EXPERIENCE_KEYS)[number];

export function isCustomExperienceKey(value: string | null | undefined): value is CustomExperienceKey {
  return CUSTOM_EXPERIENCE_KEYS.includes(value as CustomExperienceKey);
}

export function resolveCustomExperienceKey(theme: {
  slug?: string | null;
  renderEngine?: string | null;
  customExperienceKey?: string | null;
} | null | undefined): CustomExperienceKey | null {
  if (!theme) return null;
  if (theme.renderEngine === "GENERIC") return null;

  if (isCustomExperienceKey(theme.customExperienceKey)) {
    return theme.customExperienceKey;
  }

  // Royal is the first V2 custom experience. Existing production rows predate
  // renderEngine/customExperienceKey, so the slug mapping upgrades them
  // without requiring a destructive reseed.
  if (!theme.renderEngine && theme.slug === "royal") return "royal-story";

  return null;
}
