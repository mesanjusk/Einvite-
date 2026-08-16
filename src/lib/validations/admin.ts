import { z } from "zod";

export const colorPaletteSchema = z.object({
  primary: z.string().min(1),
  secondary: z.string().min(1),
  accent: z.string().min(1),
  background: z.string().min(1),
  foreground: z.string().min(1),
});

export const fontPairingSchema = z.object({
  display: z.string().min(1),
  body: z.string().min(1),
  script: z.string().min(1),
});

export const SECTION_TYPES = [
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
] as const;

export const THEME_CATEGORIES = ["traditional", "modern", "fusion", "minimal", "classic"] as const;

export const themeFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  previewImage: z.string().optional(),
  revealVideoUrl: z.string().optional(),
  category: z.enum(THEME_CATEGORIES).default("classic"),
  isPremium: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  colorPalette: colorPaletteSchema,
  fontPairing: fontPairingSchema,
  sectionOrder: z.array(z.enum(SECTION_TYPES)).min(1, "At least one section is required"),
});

export type ThemeFormInput = z.infer<typeof themeFormSchema>;
export type ThemeFormValues = z.input<typeof themeFormSchema>;

export const musicTrackFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  url: z.string().min(1, "URL or file path is required"),
  mood: z.string().optional(),
  isPremium: z.boolean().default(false),
});

export type MusicTrackFormInput = z.infer<typeof musicTrackFormSchema>;
export type MusicTrackFormValues = z.input<typeof musicTrackFormSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["USER", "ADMIN"]),
});
