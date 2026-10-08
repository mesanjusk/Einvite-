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

export const REVEAL_ANIMATION_PRESETS = [
  "MAGIC_BLOOM",
  "SPARKLES",
  "CONFETTI",
  "PETALS",
] as const;

export const themeDecorAssetsSchema = z.object({
  musicUrl: z.string().regex(/^$|^https?:\/\/|^\/(?!\/)/, "Use an uploaded file or an HTTP(S) music URL").optional(),
  musicName: z.string().optional(),
  revealVideoWebmUrl: z.string().optional(),
  revealVideoPosterUrl: z.string().optional(),
  revealAnimation: z
    .object({
      preset: z.enum(REVEAL_ANIMATION_PRESETS).default("MAGIC_BLOOM"),
      intensity: z.coerce.number().min(0.5).max(2).default(1),
      speed: z.coerce.number().min(0.5).max(2).default(1),
    })
    .default({ preset: "MAGIC_BLOOM", intensity: 1, speed: 1 }),
  sectionImages: z.record(z.string(), z.string()).default({}),
  // Kept only so themes saved by PR #79 continue to parse; these blocks are
  // no longer rendered. Real section elements are edited through elementStyles.
  sectionTextBlocks: z
    .record(
      z.string(),
      z.array(
        z.object({
          id: z.string().min(1),
          text: z.string(),
          fontSize: z.coerce.number().min(8).max(96).default(22),
          fontRole: z.enum(["display", "body", "script"]).default("body"),
          align: z.enum(["left", "center", "right"]).default("center"),
          color: z.string().optional(),
        }),
      ),
    )
    .default({}),
  elementStyles: z
    .record(
      z.string(),
      z.object({
        text: z.string().optional(),
        hidden: z.boolean().default(false),
        fontSize: z.coerce.number().min(8).max(120).optional(),
        fontRole: z.enum(["display", "body", "script"]).optional(),
        align: z.enum(["left", "center", "right"]).optional(),
        color: z.string().optional(),
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        underline: z.boolean().optional(),
        letterSpacing: z.coerce.number().min(-2).max(12).optional(),
        lineHeight: z.coerce.number().min(0.8).max(3).optional(),
        opacity: z.coerce.number().min(0).max(1).optional(),

        x: z.coerce.number().min(-60).max(60).default(0),
        y: z.coerce.number().min(-60).max(60).default(0),
        showBackground: z.boolean().default(false),
      }),
    )
    .default({}),
  customText: z
    .record(
      z.string(),
      z.array(
        z.object({
          id: z.string().min(1),
          text: z.string(),
          fontSize: z.coerce.number().min(8).max(120).default(22),
          fontRole: z.enum(["display", "body", "script"]).default("body"),
          align: z.enum(["left", "center", "right"]).default("center"),
          color: z.string().optional(),
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        underline: z.boolean().optional(),
        letterSpacing: z.coerce.number().min(-2).max(12).optional(),
        lineHeight: z.coerce.number().min(0.8).max(3).optional(),
        opacity: z.coerce.number().min(0).max(1).optional(),

          x: z.coerce.number().min(-60).max(60).default(0),
          y: z.coerce.number().min(-60).max(60).default(0),
        }),
      ),
    )
    .default({}),
  contentCommunity: z.string().default("General"),
  sectionStyles: z
    .record(
      z.string(),
      z.object({
        x: z.coerce.number().min(-40).max(40).default(0),
        y: z.coerce.number().min(-40).max(40).default(0),
        showBox: z.boolean().default(true),
        primary: z.string().optional(),
        accent: z.string().optional(),
        foreground: z.string().optional(),
        displayFont: z.string().optional(),
        bodyFont: z.string().optional(),
        scriptFont: z.string().optional(),
      }),
    )
    .default({}),
});

export const THEME_CATEGORIES = [
  "traditional",
  "modern",
  "fusion",
  "minimal",
  "classic",
] as const;

export const THEME_TYPES = ["WEBSITE", "PDF"] as const;

export const themeContentSchema = z.object({
  eyebrow: z.string().optional(),
  heroHeadline: z.string().optional(),
  heroSubline: z.string().optional(),
  invitationLetter: z.string().optional(),
  storyHeadline: z.string().optional(),
  thankYou: z.string().optional(),
  hashtagSuffix: z.string().optional(),
});

export const themeFormSchema = z.object({
  id: z.string().optional(),
  type: z.enum(THEME_TYPES).default("WEBSITE"),
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .regex(/^$|^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only")
    .default(""),
  description: z.string().optional(),
  previewImage: z.string().optional(),
  revealMode: z.enum(["ANIMATION", "VIDEO"]).default("ANIMATION"),
  revealVideoUrl: z.string().optional(),
  category: z.enum(THEME_CATEGORIES).default("classic"),
  // Which celebration the design is for. PDF themes are print layouts shared
  // by every celebration, so this only steers the WEBSITE picker.
  eventCategory: z.enum(EVENT_CATEGORY_SLUGS).default(DEFAULT_EVENT_CATEGORY),
  eventCategories: z
    .array(z.enum(EVENT_CATEGORY_SLUGS))
    .min(1, "Choose at least one celebration")
    .default([DEFAULT_EVENT_CATEGORY]),
  isPremium: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  colorPalette: colorPaletteSchema,
  fontPairing: fontPairingSchema,
  content: themeContentSchema.optional(),
  decorAssets: themeDecorAssetsSchema.optional(),
  sectionOrder: z
    .array(z.enum(SECTION_TYPES))
    .min(1, "At least one section is required"),
}).superRefine((value, context) => {
  if (value.revealMode === "VIDEO" && !value.revealVideoUrl?.trim()) {
    context.addIssue({ code: "custom", path: ["revealVideoUrl"], message: "Choose a reveal video or switch the opening to Animation." });
  }
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

// A group is picked from the `usergroups` collection, so the name is free
// text here rather than an enum — the list is data, and adding a group there
// must not need a redeploy. An empty string clears the group.
export const updateUserGroupSchema = z.object({
  userId: z.string().min(1),
  group: z.string().trim().max(120),
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


export const THEME_LIBRARY_ASSET_KINDS = ["IMAGE", "REVEAL_VIDEO"] as const;

export const themeLibraryAssetFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required"),
  kind: z.enum(THEME_LIBRARY_ASSET_KINDS),
  url: z.string().trim().min(1, "Asset URL is required"),
  thumbnailUrl: z.string().trim().optional(),
  category: z.string().trim().optional(),
  community: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export type ThemeLibraryAssetFormInput = z.infer<typeof themeLibraryAssetFormSchema>;

export const THEME_CONTENT_ROLES = ["heading", "subheading", "body", "blessing"] as const;

export const themeContentItemFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required"),
  community: z.string().trim().min(1).default("General"),
  section: z.enum(SECTION_TYPES).default("HERO"),
  role: z.enum(THEME_CONTENT_ROLES).default("body"),
  text: z.string().trim().min(1, "Content text is required"),
  previewImage: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export type ThemeContentItemFormInput = z.infer<typeof themeContentItemFormSchema>;

export const instagramAutomationFormSchema = z
  .object({
    id: z.string().optional(),
    mediaId: z
      .string()
      .min(1, "Instagram media ID is required")
      .regex(
        /^\d+$/,
        "Media IDs are numeric — copy it from the dashboard's comment log",
      ),
    label: z.string().min(1, "Give the reel a name you'll recognise"),
    permalink: z.string().optional(),
    triggerWord: z.string().min(1, "Trigger word is required"),
    replyMessage: z.string().min(1, "Reply message is required"),
    duplicateMessage: z.string().min(1, "Duplicate reply is required"),
    requireFollow: z.boolean().default(false),
    notFollowingMessage: z.string().optional(),
    useButtonFlow: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  // The plain reply has to carry {{link}} or it promises a link it never
  // sends. The button flow's reply is only the opener — the link comes later,
  // from the flow's own wording — so requiring it there would be wrong.
  .refine((v) => v.useButtonFlow || v.replyMessage.includes("{{link}}"), {
    message: "Include {{link}} so the invite link is sent",
    path: ["replyMessage"],
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
    // Required unless the rule only starts the button flow, which brings its
    // own wording — see the refinements below.
    replyMessage: z.string().default(""),
    issueLink: z.boolean().default(false),
    duplicateMessage: z.string().optional(),
    startFlow: z.boolean().default(false),
    requireFollow: z.boolean().default(true),
    notFollowingMessage: z.string().optional(),
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
  .refine((v) => v.startFlow || v.replyMessage.trim().length > 0, {
    message: "Reply message is required",
    path: ["replyMessage"],
  })
  .refine((v) => v.startFlow || !v.issueLink || v.replyMessage.includes("{{link}}"), {
    message: "Include {{link}} so the invite link is sent",
    path: ["replyMessage"],
  });

export type InstagramDmRuleFormInput = z.infer<typeof instagramDmRuleFormSchema>;
export type InstagramDmRuleFormValues = z.input<typeof instagramDmRuleFormSchema>;

// Instagram truncates a quick reply title past 20 characters, so a label that
// doesn't fit is cut off in the DM rather than rejected — better to say so in
// the form than to ship a button reading "I'm following ✅" as "I'm followin".
const flowButtonLabel = (field: string) =>
  z
    .string()
    .min(1, `${field} is required`)
    .max(20, `${field} must be 20 characters or fewer — Instagram cuts it off`);

export const instagramFlowSettingsFormSchema = z.object({
  isActive: z.boolean().default(true),
  openerMessage: z.string().min(1, "Opening message is required"),
  openerButtonLabel: flowButtonLabel("Opening button"),
  requireFollow: z.boolean().default(true),
  followMessage: z.string().min(1, "Follow-first message is required"),
  followButtonLabel: flowButtonLabel("Follow-confirmed button"),
  stillNotFollowingMessage: z
    .string()
    .min(1, "Message for a failed follow check is required"),
  profileUrl: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\//.test(v), {
      message: "Profile link must start with http:// or https://",
    })
    .optional(),
  profileButtonLabel: flowButtonLabel("Profile button"),
  gateInvitations: z.boolean().default(true),
  pausedMessage: z.string().optional(),
  linkMessage: z
    .string()
    .min(1, "Link message is required")
    .refine(
      (v) => v.includes("{{link}}"),
      "Include {{link}} so the invite link is sent",
    ),
  notifyOnPublish: z.boolean().default(true),
  publishedMessage: z
    .string()
    .min(1, "Published message is required")
    .refine(
      (v) => v.includes("{{link}}"),
      "Include {{link}} so the invitation link is sent",
    ),
  duplicateMessage: z
    .string()
    .min(1, "Message for someone who already claimed is required")
    .refine(
      (v) => v.includes("{{link}}"),
      "Include {{link}} so their existing link is sent",
    ),
});

export type InstagramFlowSettingsFormInput = z.infer<
  typeof instagramFlowSettingsFormSchema
>;
export type InstagramFlowSettingsFormValues = z.input<
  typeof instagramFlowSettingsFormSchema
>;

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

// ---------------------------------------------------------------------------
// Celebration form configuration
// ---------------------------------------------------------------------------

export const eventCategoryConfigFormSchema = z.object({
  slug: z.string().min(1),
  isEnabled: z.boolean().default(true),
  label: z.string().optional(),
  tagline: z.string().optional(),
  primaryNameLabel: z.string().optional(),
  secondaryNameLabel: z.string().optional(),
  secondaryOptional: z.boolean().default(false),
  joiner: z.string().optional(),
  dateLabel: z.string().optional(),
  eventsLabel: z.string().optional(),
  familyBrideLabel: z.string().optional(),
  familyGroomLabel: z.string().optional(),
  // Typed one per line in the form; blank lines dropped on save.
  defaultEvents: z.string().optional(),
  familyRelations: z.string().optional(),
  steps: z.array(z.string()).default([]),
  fields: z
    .record(
      z.string(),
      z.object({
        enabled: z.boolean().default(true),
        required: z.boolean().default(false),
        label: z.string().optional(),
      }),
    )
    .default({}),
});

export type EventCategoryConfigFormInput = z.infer<
  typeof eventCategoryConfigFormSchema
>;
export type EventCategoryConfigFormValues = z.input<
  typeof eventCategoryConfigFormSchema
>;

export const adminResetSchema = z.object({
  confirmation: z.string(),
  includeUserAccounts: z.boolean().default(false),
});

export type AdminResetInput = z.infer<typeof adminResetSchema>;
