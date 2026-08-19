export const SECTION_ORDER = [
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

// Stock thumbnails so a freshly seeded catalogue shows photos rather than
// bare gradients. Admins can replace any of these from Manage Themes.
const THEME_THUMBNAILS: Record<string, string> = {
  royal: "1519741497674-611481863552",
  traditional: "1519225421980-715cb0215aed",
  luxury: "1544078751-58fee2d8b03f",
  minimal: "1511285560929-80b456fea0bc",
  modern: "1583939003579-730e3918a45a",
  temple: "1606216794074-735e91aa2c92",
  palace: "1583334026965-2a3f37c8e9fb",
  beach: "1520854221256-17451cc331bf",
  floral: "1465495976277-4387d4b0b4c6",
  pastel: "1521543387236-8c6f80e7d70e",
};

export function seedThumbnailFor(slug: string): string | undefined {
  const id = THEME_THUMBNAILS[slug];
  return id ? `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80` : undefined;
}

export const THEMES = [
  {
    name: "Royal",
    slug: "royal",
    description: "Maroon, gold, and ivory — wax seals and flourish ornaments.",
    category: "traditional",
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
    category: "traditional",
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
    category: "modern",
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
    category: "minimal",
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
    category: "modern",
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
    category: "traditional",
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
    category: "traditional",
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
    category: "modern",
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
    category: "fusion",
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
    category: "fusion",
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
    category: "modern",
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
  {
    name: "South Indian Kalyanam",
    slug: "kalyanam",
    description: "Kanjivaram maroon and temple gold for a classic South Indian wedding.",
    category: "traditional",
    colorPalette: {
      primary: "#6b1414",
      secondary: "#fbe6a6",
      accent: "#c98a1f",
      background: "#fff6e5",
      foreground: "#2c0f0a",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: true, sparkles: false, motif: "temple-arch" },
    isPremium: true,
    sortOrder: 11,
  },
  {
    name: "Bengali Biye",
    slug: "bengali-biye",
    description: "Shakha-pola red and white with brushed gold accents.",
    category: "traditional",
    colorPalette: {
      primary: "#a3123a",
      secondary: "#fffaf3",
      accent: "#c9942a",
      background: "#fff8f0",
      foreground: "#3a0d18",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: true, sparkles: false, motif: "paisley" },
    isPremium: false,
    sortOrder: 12,
  },
  {
    name: "Sikh Anand Karaj",
    slug: "anand-karaj",
    description: "Saffron and royal blue honoring a Sikh Anand Karaj ceremony.",
    category: "traditional",
    colorPalette: {
      primary: "#1c3f7a",
      secondary: "#ffd48a",
      accent: "#e8842c",
      background: "#fff8ec",
      foreground: "#1a1a2e",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: true, motif: "flourish" },
    isPremium: false,
    sortOrder: 13,
  },
  {
    name: "Nikah Elegance",
    slug: "nikah-elegance",
    description: "Emerald and gold with Islamic geometric framing for a Nikah.",
    category: "traditional",
    colorPalette: {
      primary: "#0b3d2e",
      secondary: "#e9d9a8",
      accent: "#c9942a",
      background: "#f7f5ea",
      foreground: "#0b1f16",
    },
    fontPairing: { display: "Playfair Display", body: "EB Garamond", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: true, motif: "jali" },
    isPremium: true,
    sortOrder: 14,
  },
  {
    name: "Mehendi Garden",
    slug: "mehendi-garden",
    description: "Henna green and marigold for sangeet and mehendi functions.",
    category: "traditional",
    colorPalette: {
      primary: "#3c6e2e",
      secondary: "#ffe08a",
      accent: "#e8842c",
      background: "#fbfbe5",
      foreground: "#1f2e12",
    },
    fontPairing: { display: "Playfair Display", body: "Cormorant Garamond", script: "Great Vibes" },
    decorAssets: { petals: true, sparkles: false, motif: "botanical" },
    isPremium: false,
    sortOrder: 15,
  },
  {
    name: "Boho Modern",
    slug: "boho-modern",
    description: "Terracotta, sage, and cream with a relaxed contemporary feel.",
    category: "modern",
    colorPalette: {
      primary: "#a4633b",
      secondary: "#dbe3c6",
      accent: "#c98a5b",
      background: "#faf6ef",
      foreground: "#33291f",
    },
    fontPairing: { display: "Playfair Display", body: "Inter", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: false, motif: "botanical" },
    isPremium: false,
    sortOrder: 16,
  },
  {
    name: "Scandi Modern",
    slug: "scandi-modern",
    description: "Muted blue-grey and white — quiet, airy, contemporary.",
    category: "modern",
    colorPalette: {
      primary: "#3d4f5c",
      secondary: "#e7ebee",
      accent: "#8a9aa5",
      background: "#ffffff",
      foreground: "#22292e",
    },
    fontPairing: { display: "Playfair Display", body: "Inter", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: false, motif: "none" },
    isPremium: false,
    sortOrder: 17,
  },
  {
    name: "Neon Sangeet",
    slug: "neon-sangeet",
    description: "Hot pink and electric purple on black for a high-energy sangeet night.",
    category: "fusion",
    colorPalette: {
      primary: "#ff3d81",
      secondary: "#1a1025",
      accent: "#8b5cf6",
      background: "#100a17",
      foreground: "#fdf1ff",
    },
    fontPairing: { display: "Inter", body: "Inter", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: true, motif: "shapes" },
    isPremium: true,
    sortOrder: 18,
  },
  {
    name: "Monochrome Modern",
    slug: "monochrome-modern",
    description: "Black, white, and grey — an editorial, gallery-clean look.",
    category: "modern",
    colorPalette: {
      primary: "#0a0a0a",
      secondary: "#f2f2f2",
      accent: "#5c5c5c",
      background: "#ffffff",
      foreground: "#0a0a0a",
    },
    fontPairing: { display: "Inter", body: "Inter", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: false, motif: "geometric" },
    isPremium: false,
    sortOrder: 19,
  },
  {
    name: "Rustic Modern",
    slug: "rustic-modern",
    description: "Warm browns and olive with a contemporary countryside feel.",
    category: "modern",
    colorPalette: {
      primary: "#5b3a29",
      secondary: "#e6dcc6",
      accent: "#7c8a52",
      background: "#faf6ee",
      foreground: "#2b1d13",
    },
    fontPairing: { display: "Playfair Display", body: "Inter", script: "Great Vibes" },
    decorAssets: { petals: false, sparkles: false, motif: "botanical" },
    isPremium: false,
    sortOrder: 20,
  },
];

// PDF-type themes for the "Download PDF" stylesheet — same shape as website
// themes, filtered by `type` so they never show up in the website picker.
export const PDF_THEMES = [
  {
    type: "PDF" as const,
    name: "Elegant Print",
    slug: "elegant-print",
    description: "A high-contrast, ink-friendly layout tuned for printing.",
    category: "classic",
    colorPalette: {
      primary: "#3a1414",
      secondary: "#e8d9c8",
      accent: "#8a1f1f",
      background: "#ffffff",
      foreground: "#1a1a1a",
    },
    fontPairing: { display: "Playfair Display", body: "EB Garamond", script: "Great Vibes" },
    isPremium: false,
    sortOrder: 0,
  },
];

// Gemini video prompt templates — {{placeholders}} are filled from the
// invitation's own captured details at generation time.
export const VIDEO_TEMPLATES = [
  {
    name: "Cinematic Teaser",
    slug: "cinematic-teaser",
    description: "A romantic, golden-hour teaser announcing the wedding date and venue.",
    aspectRatio: "9:16",
    durationSeconds: 15,
    promptTemplate:
      "A cinematic, romantic wedding invitation teaser for {{coupleNames}}, announcing their wedding on {{weddingDate}}. Warm golden-hour lighting, gentle camera movement, elegant typography overlay with the couple's names.",
    styleKeywords: ["golden hour", "romantic", "slow motion", "elegant"],
    geminiModel: "veo-3.0-generate-001",
    isPremium: false,
    sortOrder: 0,
  },
];

// No bundled "Studio Library" tracks: shipping placeholder mp3 URLs with no
// actual audio file behind them (the original state of this list) silently
// breaks music for anyone who picks one — the button shows up but nothing
// plays. Real tracks need real licensed audio files hosted somewhere; add
// them via /admin/music with a working URL once you have one.
export const MUSIC_TRACKS: {
  title: string;
  artist: string;
  url: string;
  mood: string;
  isPremium: boolean;
}[] = [];

// Homepage "see it in action" showcase — published, isDemo invitations so
// visitors can preview real invitations (in a phone mockup) before signing
// up. Re-running the seed only ever updates these by slug, never creates
// duplicates.
export const DEMO_INVITATIONS = [
  {
    slug: "demo-royal-wedding",
    themeSlug: "royal",
    brideName: "Aisha",
    groomName: "Rohan",
    weddingDate: "2026-12-12",
    venueName: "The Grand Palace",
    venueAddress: "Lake Pichola Road, Udaipur, Rajasthan",
    customMessage: "Join us as we begin our forever, with love, laughter, and a little royal drama.",
  },
  {
    slug: "demo-beach-wedding",
    themeSlug: "beach",
    brideName: "Meera",
    groomName: "Karthik",
    weddingDate: "2026-11-08",
    venueName: "Sunset Cove Resort",
    venueAddress: "Candolim Beach, Goa",
    customMessage: "Sand, sun, and forever — come celebrate with us by the sea.",
  },
  {
    slug: "demo-pastel-wedding",
    themeSlug: "pastel",
    brideName: "Priya",
    groomName: "Dev",
    weddingDate: "2027-02-14",
    venueName: "The Garden Terrace",
    venueAddress: "Whitefield, Bengaluru, Karnataka",
    customMessage: "Two hearts, one promise — join us for a wedding to remember.",
  },
] as const;

// Colourways per theme: same design, different palette. Keyed by theme slug;
// a theme with no entry simply ships in its own default palette. Each entry
// mirrors the shape of Theme.colorPalette.
export const THEME_COLORWAYS: Record<
  string,
  { name: string; slug: string; colorPalette: Record<string, string> }[]
> = {
  royal: [
    {
      name: "Maroon & Gold",
      slug: "maroon-gold",
      colorPalette: {
        primary: "#7a2e2e",
        secondary: "#f3d9d9",
        accent: "#c9942a",
        background: "#faf3ea",
        foreground: "#3a1414",
      },
    },
    {
      name: "Emerald & Gold",
      slug: "emerald-gold",
      colorPalette: {
        primary: "#1f5140",
        secondary: "#d8e8e0",
        accent: "#c9942a",
        background: "#f6faf7",
        foreground: "#12362a",
      },
    },
    {
      name: "Midnight & Rose",
      slug: "midnight-rose",
      colorPalette: {
        primary: "#2b2f52",
        secondary: "#dcdff0",
        accent: "#c98a9a",
        background: "#f7f7fb",
        foreground: "#1a1d33",
      },
    },
  ],
  traditional: [
    {
      name: "Kumkum Red",
      slug: "kumkum-red",
      colorPalette: {
        primary: "#8f2f24",
        secondary: "#f6dcd6",
        accent: "#d9a520",
        background: "#fdf6ee",
        foreground: "#3d1410",
      },
    },
    {
      name: "Turmeric",
      slug: "turmeric",
      colorPalette: {
        primary: "#a8720f",
        secondary: "#f7e6c4",
        accent: "#7a2e2e",
        background: "#fdf8ee",
        foreground: "#3f2a08",
      },
    },
    {
      name: "Peacock",
      slug: "peacock",
      colorPalette: {
        primary: "#14566b",
        secondary: "#cfe6ed",
        accent: "#d9a520",
        background: "#f3fafc",
        foreground: "#0b3140",
      },
    },
  ],
  beach: [
    {
      name: "Ocean",
      slug: "ocean",
      colorPalette: {
        primary: "#2e6a7a",
        secondary: "#d6ecf1",
        accent: "#8fd0d8",
        background: "#f2f8fa",
        foreground: "#12333c",
      },
    },
    {
      name: "Sunset",
      slug: "sunset",
      colorPalette: {
        primary: "#b4573c",
        secondary: "#f8dfd3",
        accent: "#e8a76a",
        background: "#fdf6f1",
        foreground: "#4a1e12",
      },
    },
    {
      name: "Palm",
      slug: "palm",
      colorPalette: {
        primary: "#3d6b46",
        secondary: "#dcebdd",
        accent: "#c8b06a",
        background: "#f5faf5",
        foreground: "#1e3a23",
      },
    },
  ],
  floral: [
    {
      name: "Blush",
      slug: "blush",
      colorPalette: {
        primary: "#a04a6a",
        secondary: "#f7dce6",
        accent: "#f0c0d0",
        background: "#fdf3f7",
        foreground: "#4a1c2c",
      },
    },
    {
      name: "Lavender",
      slug: "lavender",
      colorPalette: {
        primary: "#6f5a9a",
        secondary: "#e4dcf2",
        accent: "#c0aee0",
        background: "#f8f5fd",
        foreground: "#2f2450",
      },
    },
    {
      name: "Marigold",
      slug: "marigold",
      colorPalette: {
        primary: "#c07a12",
        secondary: "#fae5c2",
        accent: "#e0a93c",
        background: "#fdf8ef",
        foreground: "#4c2f04",
      },
    },
  ],
  minimal: [
    {
      name: "Ink",
      slug: "ink",
      colorPalette: {
        primary: "#3a3a3a",
        secondary: "#e6e4e0",
        accent: "#b9a179",
        background: "#f7f5f2",
        foreground: "#1c1c1c",
      },
    },
    {
      name: "Sage",
      slug: "sage",
      colorPalette: {
        primary: "#5c6f5c",
        secondary: "#e2e9e0",
        accent: "#a8b89f",
        background: "#f6f8f5",
        foreground: "#2b352b",
      },
    },
    {
      name: "Sand",
      slug: "sand",
      colorPalette: {
        primary: "#8a7350",
        secondary: "#f0e7d8",
        accent: "#c9b38c",
        background: "#faf6ee",
        foreground: "#3b3020",
      },
    },
  ],
  pastel: [
    {
      name: "Lilac",
      slug: "lilac",
      colorPalette: {
        primary: "#8a6a9a",
        secondary: "#ece0f2",
        accent: "#e0c8e8",
        background: "#faf6fb",
        foreground: "#3d2b47",
      },
    },
    {
      name: "Mint",
      slug: "mint",
      colorPalette: {
        primary: "#4e8a7a",
        secondary: "#d9efe7",
        accent: "#a8ddcd",
        background: "#f4fbf8",
        foreground: "#20443a",
      },
    },
    {
      name: "Peach",
      slug: "peach",
      colorPalette: {
        primary: "#c4735a",
        secondary: "#fae0d5",
        accent: "#f0b79c",
        background: "#fdf6f2",
        foreground: "#4f2618",
      },
    },
  ],
};
