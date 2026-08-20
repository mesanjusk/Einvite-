import { z } from "zod";

import { AUTO_VIDEO_MODEL } from "@/lib/ai/gemini-video";
import { DEFAULT_EVENT_CATEGORY, EVENT_CATEGORY_SLUGS } from "@/lib/event-categories";

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

export const THEME_CATEGORIES = [
  "traditional",
  "modern",
  "fusion",
  "minimal",
  "classic",
] as const;

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
  // Which celebration the design is for. PDF themes are print layouts shared
  // by every celebration, so this only steers the WEBSITE picker.
  eventCategory: z.enum(EVENT_CATEGORY_SLUGS).default(DEFAULT_EVENT_CATEGORY),
  isPremium: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  colorPalette: colorPaletteSchema,
  fontPairing: fontPairingSchema,
  sectionOrder: z
    .array(z.enum(SECTION_TYPES))
    .min(1, "At least one section is required"),
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
  geminiModel: z.string().min(1).default(AUTO_VIDEO_MODEL),
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
    .refine(
      (v) => v.includes("{{link}}"),
      "Include {{link}} so the invite link is sent",
    ),
  duplicateMessage: z.string().min(1, "Duplicate reply is required"),
  requireFollow: z.boolean().default(false),
  notFollowingMessage: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type InstagramAutomationFormInput = z.infer<
  typeof instagramAutomationFormSchema
>;
export type InstagramAutomationFormValues = z.input<
  typeof instagramAutomationFormSchema
>;

export const INSTAGRAM_DM_MATCH_TYPES = [
  "EXACT",
  "CONTAINS",
  "STARTS_WITH",
  "ANY",
] as const;

export const instagramDmRuleFormSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1, "Give the rule a name you'll recognise"),
    matchType: z.enum(INSTAGRAM_DM_MATCH_TYPES).default("CONTAINS"),
    keyword: z.string().optional(),
    replyMessage: z.string().min(1, "Reply message is required"),
    issueLink: z.boolean().default(false),
    duplicateMessage: z.string().optional(),
    priority: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
  })
  // ANY is the deliberate catch-all and needs no keyword; every other type is
  // meaningless without one, and a blank keyword would quietly match every
  // DM — the behaviour these rules exist to stop.
  .refine((v) => v.matchType === "ANY" || Boolean(v.keyword?.trim()), {
    message: "Keyword is required unless the rule replies to every message",
    path: ["keyword"],
  })
  .refine((v) => !v.issueLink || v.replyMessage.includes("{{link}}"), {
    message: "Include {{link}} so the invite link is sent",
    path: ["replyMessage"],
  });

export type InstagramDmRuleFormInput = z.infer<typeof instagramDmRuleFormSchema>;
export type InstagramDmRuleFormValues = z.input<typeof instagramDmRuleFormSchema>;

export const themeColorwayFormSchema = z.object({
  id: z.string().optional(),
  themeId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  colorPalette: colorPaletteSchema,
  sortOrder: z.coerce.number().int().default(0),
});

export type ThemeColorwayFormInput = z.infer<typeof themeColorwayFormSchema>;
export type ThemeColorwayFormValues = z.input<typeof themeColorwayFormSchema>;
