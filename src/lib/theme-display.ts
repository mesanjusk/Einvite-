import { EVENT_CATEGORY_SLUGS } from "@/lib/event-categories";

type ThemeCategories = {
  eventCategory?: string | null;
  eventCategories?: string[] | null;
};

const LEGACY_THEME_NAMES: Record<string, string> = {
  "traditional-invitation": "Traditional Invitation · Palace",
  traditionalinvitation: "Traditional Invitation · Botanical",
};

export function displayThemeName(name: string, slug: string) {
  return (
    LEGACY_THEME_NAMES[slug] ??
    name.replace(/traditionalinvitation/gi, "Traditional Invitation").trim()
  );
}

export function displayThemeStyle(style: string) {
  return style
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function availableEventCategorySlugs(themes: ThemeCategories[]) {
  const supported = new Set<string>(EVENT_CATEGORY_SLUGS);
  const available = new Set<string>();

  for (const theme of themes) {
    for (const category of [theme.eventCategory, ...(theme.eventCategories ?? [])]) {
      if (category && supported.has(category)) available.add(category);
    }
  }

  return [...available];
}
