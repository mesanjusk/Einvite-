import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — cannot seed the database.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const SECTION_ORDER = [
  "ENVELOPE",
  "HERO",
  "COUNTDOWN",
  "STORY",
  "TIMELINE",
  "GALLERY",
  "VENUE",
  "RSVP",
  "REGISTRY",
  "INSTAGRAM",
  "THANK_YOU",
];

const THEMES = [
  {
    name: "Royal",
    slug: "royal",
    description: "Maroon, gold, and ivory — wax seals and flourish ornaments.",
    colorPalette: {
      primary: "#7a2e2e",
      secondary: "#f3d9d9",
      accent: "#c9942a",
      background: "#faf3ea",
      foreground: "#3a1414",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: true, sparkles: true, motif: "flourish" },
    isPremium: false,
    sortOrder: 0,
  },
  {
    name: "Traditional",
    slug: "traditional",
    description: "Deep red and gold with classic Indian motifs.",
    colorPalette: {
      primary: "#8a1f1f",
      secondary: "#ffe8a0",
      accent: "#b8860b",
      background: "#fff8ec",
      foreground: "#2a1206",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: true, sparkles: false, motif: "paisley" },
    isPremium: false,
    sortOrder: 1,
  },
  {
    name: "Luxury",
    slug: "luxury",
    description: "Black and gold with sharp, editorial typography.",
    colorPalette: {
      primary: "#111111",
      secondary: "#d4af37",
      accent: "#d4af37",
      background: "#0e0e0e",
      foreground: "#f5f0e6",
    },
    fontPairing: { display: "Playfair Display", body: "EB Garamond", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: true, motif: "geometric" },
    isPremium: true,
    sortOrder: 2,
  },
  {
    name: "Minimal",
    slug: "minimal",
    description: "Clean whitespace, quiet typography, understated elegance.",
    colorPalette: {
      primary: "#1a1a1a",
      secondary: "#e5e5e5",
      accent: "#9a9a9a",
      background: "#ffffff",
      foreground: "#1a1a1a",
    },
    fontPairing: { display: "Playfair Display", body: "Inter", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: false, motif: "none" },
    isPremium: false,
    sortOrder: 3,
  },
  {
    name: "Modern",
    slug: "modern",
    description: "Bold color blocking with contemporary sans-serif type.",
    colorPalette: {
      primary: "#1f2937",
      secondary: "#f472b6",
      accent: "#f472b6",
      background: "#fafafa",
      foreground: "#111827",
    },
    fontPairing: { display: "Inter", body: "Inter", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: true, motif: "shapes" },
    isPremium: false,
    sortOrder: 4,
  },
  {
    name: "Temple",
    slug: "temple",
    description: "Stone and saffron tones inspired by temple architecture.",
    colorPalette: {
      primary: "#9a4b1f",
      secondary: "#f2c14e",
      accent: "#7a2e2e",
      background: "#fdf1df",
      foreground: "#3a1f0d",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: true, sparkles: false, motif: "temple-arch" },
    isPremium: true,
    sortOrder: 5,
  },
  {
    name: "Palace",
    slug: "palace",
    description: "Jewel-toned emerald and gold with regal framing.",
    colorPalette: {
      primary: "#0f3d2e",
      secondary: "#c9942a",
      accent: "#c9942a",
      background: "#f6f4ea",
      foreground: "#0f2418",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: true, motif: "jali" },
    isPremium: true,
    sortOrder: 6,
  },
  {
    name: "Beach",
    slug: "beach",
    description: "Sandy neutrals and ocean blue for destination weddings.",
    colorPalette: {
      primary: "#1d4e6b",
      secondary: "#f4e3c1",
      accent: "#e0895f",
      background: "#fbf7ee",
      foreground: "#1d2b33",
    },
    fontPairing: { display: "Playfair Display", body: "EB Garamond", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: false, motif: "waves" },
    isPremium: false,
    sortOrder: 7,
  },
  {
    name: "Floral",
    slug: "floral",
    description: "Soft botanical illustrations in blush and sage.",
    colorPalette: {
      primary: "#5c7a3a",
      secondary: "#f3d9d9",
      accent: "#c9942a",
      background: "#fdf8f2",
      foreground: "#2f3a20",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: true, sparkles: false, motif: "botanical" },
    isPremium: false,
    sortOrder: 8,
  },
  {
    name: "Pastel",
    slug: "pastel",
    description: "Powder pink and lilac, soft and dreamy.",
    colorPalette: {
      primary: "#a78bca",
      secondary: "#f9d5e5",
      accent: "#f9d5e5",
      background: "#fdfaff",
      foreground: "#3a2f4a",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: true, sparkles: true, motif: "confetti" },
    isPremium: false,
    sortOrder: 9,
  },
  {
    name: "Dark Luxury",
    slug: "dark-luxury",
    description: "Charcoal and champagne gold with dramatic shimmer.",
    colorPalette: {
      primary: "#c9a24b",
      secondary: "#2a2a2a",
      accent: "#c9a24b",
      background: "#141414",
      foreground: "#f2ead8",
    },
    fontPairing: { display: "Playfair Display", body: "EB Garamond", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: true, motif: "shimmer" },
    isPremium: true,
    sortOrder: 10,
  },
];

const MUSIC_TRACKS = [
  { title: "Romantic Instrumental", artist: "Studio Library", url: "/music/romantic-instrumental.mp3", mood: "romantic", isPremium: false },
  { title: "Soft Piano Prelude", artist: "Studio Library", url: "/music/soft-piano-prelude.mp3", mood: "romantic", isPremium: false },
  { title: "Traditional Shehnai", artist: "Studio Library", url: "/music/traditional-shehnai.mp3", mood: "traditional", isPremium: true },
  { title: "Upbeat Celebration", artist: "Studio Library", url: "/music/upbeat-celebration.mp3", mood: "upbeat", isPremium: true },
];

async function main() {
  console.log("Seeding themes...");
  const themeBySlug = new Map<string, string>();

  for (const theme of THEMES) {
    const record = await db.theme.upsert({
      where: { slug: theme.slug },
      update: theme,
      create: theme,
    });
    themeBySlug.set(theme.slug, record.id);
  }

  console.log("Seeding default templates (one per theme)...");
  for (const theme of THEMES) {
    const themeId = themeBySlug.get(theme.slug);
    if (!themeId) continue;

    await db.template.upsert({
      where: { slug: `${theme.slug}-classic` },
      update: {
        name: `${theme.name} Classic`,
        themeId,
        sectionOrder: SECTION_ORDER,
        isPremium: theme.isPremium,
      },
      create: {
        name: `${theme.name} Classic`,
        slug: `${theme.slug}-classic`,
        description: `The default section layout for the ${theme.name} theme.`,
        themeId,
        sectionOrder: SECTION_ORDER,
        isPremium: theme.isPremium,
      },
    });
  }

  console.log("Seeding music library...");
  for (const track of MUSIC_TRACKS) {
    await db.musicTrack.upsert({
      where: { id: track.title.toLowerCase().replace(/\s+/g, "-") },
      update: track,
      create: { id: track.title.toLowerCase().replace(/\s+/g, "-"), ...track },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
