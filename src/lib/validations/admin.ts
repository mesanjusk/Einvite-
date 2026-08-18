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

export const THEME_TYPES = ["WEBSITE", "PDF"] as const;

export const themeFormSchema = z.object({
  id: z.string().optional(),
  type: z.enum(THEME_TYPES).default("WEBSITE"),
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  previewImage: z.string().optional(),
  revealMode: z.enum(["ANIMATION", "VIDEO"]).default("ANIMATION"),
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
  isDefault: z.boolean().default(false),
});

export type MusicTrackFormInput = z.infer<typeof musicTrackFormSchema>;
export type MusicTrackFormValues = z.input<typeof musicTrackFormSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["USER", "ADMIN"]),
});

export const VIDEO_ASPECT_RATIOS = ["9:16", "16:9", "1:1"] as const;

export const videoTemplateFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  previewImage: z.string().optional(),
  aspectRatio: z.enum(VIDEO_ASPECT_RATIOS).default("9:16"),
  durationSeconds: z.coerce.number().int().min(5).max(60).default(15),
  promptTemplate: z.string().min(1, "Prompt template is required"),
  styleKeywords: z.array(z.string()).default([]),
  geminiModel: z.string().min(1).default("veo-3.0-generate-001"),
  isPremium: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export type VideoTemplateFormInput = z.infer<typeof videoTemplateFormSchema>;
export type VideoTemplateFormValues = z.input<typeof videoTemplateFormSchema>;

export const instagramAutomationFormSchema = z.object({
  id: z.string().optional(),
  mediaId: z
    .string()
    .min(1, "Instagram media ID is required")
    .regex(/^\d+$/, "Media IDs are numeric — copy it from the dashboard's comment log"),
  label: z.string().min(1, "Give the reel a name you'll recognise"),
  permalink: z.string().optional(),
  triggerWord: z.string().min(1, "Trigger word is required"),
  replyMessage: z
    .string()
    .min(1, "Reply message is required")
    .refine((v) => v.includes("{{link}}"), "Include {{link}} so the invite link is sent"),
  duplicateMessage: z.string().min(1, "Duplicate reply is required"),
  requireFollow: z.boolean().default(false),
  notFollowingMessage: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type InstagramAutomationFormInput = z.infer<typeof instagramAutomationFormSchema>;
export type InstagramAutomationFormValues = z.input<typeof instagramAutomationFormSchema>;
