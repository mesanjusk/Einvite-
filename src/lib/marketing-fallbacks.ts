/**
 * Placeholder content for the marketing home page, used only while the
 * database has nothing real to show — a fresh deploy, an unseeded database,
 * or one that's briefly unreachable. Real themes and published demo
 * invitations always win; these exist so the page never renders an empty
 * carousel or a bare theme grid.
 *
 * Images are hotlinked from Unsplash's CDN (no key required), the same
 * source the gallery auto-fill already uses.
 */

function unsplash(id: string, w = 1200) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export type FallbackSlide = {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  cta: string;
  primary: string;
  accent: string;
  background: string;
  image: string;
};

export const FALLBACK_SLIDES: FallbackSlide[] = [
  {
    id: "fallback-royal",
    eyebrow: "Wedding invitation",
    title: "A royal invitation, ready to preview",
    href: "/themes?category=wedding",
    cta: "Choose a design",
    primary: "#7a2e2e",
    accent: "#c9942a",
    background: "#faf3ea",
    image: unsplash("1519741497674-611481863552", 1600),
  },
  {
    id: "fallback-beach",
    eyebrow: "Browse before you edit",
    title: "See the invitation first, then make it yours",
    href: "/themes",
    cta: "Browse templates",
    primary: "#2e6a7a",
    accent: "#8fd0d8",
    background: "#f2f8fa",
    image: unsplash("1520854221256-17451cc331bf", 1600),
  },
  {
    id: "fallback-floral",
    eyebrow: "Live preview · Live edit",
    title: "Choose the design you love before entering details",
    href: "/themes",
    cta: "Preview designs",
    primary: "#a04a6a",
    accent: "#f0c0d0",
    background: "#fdf3f7",
    image: unsplash("1465495976277-4387d4b0b4c6", 1600),
  },
];

export type FallbackTheme = {
  id: string;
  name: string;
  slug: string;
  category: string;
  isPremium: boolean;
  previewImage: string;
  colorPalette: { primary: string; accent: string; background: string };
};

export const FALLBACK_THEMES: FallbackTheme[] = [
  {
    id: "fb-royal",
    name: "Royal",
    slug: "royal",
    category: "traditional",
    isPremium: false,
    previewImage: unsplash("1519741497674-611481863552"),
    colorPalette: { primary: "#7a2e2e", accent: "#c9942a", background: "#faf3ea" },
  },
  {
    id: "fb-beach",
    name: "Beach",
    slug: "beach",
    category: "modern",
    isPremium: false,
    previewImage: unsplash("1520854221256-17451cc331bf"),
    colorPalette: { primary: "#2e6a7a", accent: "#8fd0d8", background: "#f2f8fa" },
  },
  {
    id: "fb-floral",
    name: "Floral",
    slug: "floral",
    category: "fusion",
    isPremium: false,
    previewImage: unsplash("1465495976277-4387d4b0b4c6"),
    colorPalette: { primary: "#a04a6a", accent: "#f0c0d0", background: "#fdf3f7" },
  },
  {
    id: "fb-minimal",
    name: "Minimal",
    slug: "minimal",
    category: "minimal",
    isPremium: false,
    previewImage: unsplash("1511285560929-80b456fea0bc"),
    colorPalette: { primary: "#3a3a3a", accent: "#b9a179", background: "#f7f5f2" },
  },
  {
    id: "fb-palace",
    name: "Palace",
    slug: "palace",
    category: "traditional",
    isPremium: true,
    previewImage: unsplash("1519225421980-715cb0215aed"),
    colorPalette: { primary: "#5a4020", accent: "#d8b45a", background: "#fbf6ec" },
  },
  {
    id: "fb-pastel",
    name: "Pastel",
    slug: "pastel",
    category: "modern",
    isPremium: false,
    previewImage: unsplash("1583939003579-730e3918a45a"),
    colorPalette: { primary: "#8a6a9a", accent: "#e0c8e8", background: "#faf6fb" },
  },
];

/** Stock thumbnail for a theme whose admin hasn't uploaded one yet. */
const THUMBNAIL_POOL = [
  "1519741497674-611481863552",
  "1520854221256-17451cc331bf",
  "1465495976277-4387d4b0b4c6",
  "1511285560929-80b456fea0bc",
  "1519225421980-715cb0215aed",
  "1583939003579-730e3918a45a",
  "1521543387236-8c6f80e7d70e",
  "1544078751-58fee2d8b03f",
];

/**
 * A stable stock thumbnail for a theme without its own preview image —
 * keyed off the slug so the same theme always shows the same picture
 * rather than shuffling between renders.
 */
export function fallbackThumbnailFor(slug: string): string {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return unsplash(THUMBNAIL_POOL[hash % THUMBNAIL_POOL.length]);
}
