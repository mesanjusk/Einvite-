import { z } from "zod";
import { SECTION_TYPES, themeDecorAssetsSchema } from "./admin";
export const invitationSectionsSchema = z.array(z.object({
  id: z.string().min(1).max(150),
  type: z.union([z.enum(SECTION_TYPES), z.string().regex(/^EVENT_[a-z0-9-]{1,80}$/)]),
  visible: z.boolean(), locked: z.boolean().default(false), order: z.number().int().min(0).max(40),
  title: z.string().trim().min(1).max(100).optional(), eventId: z.string().regex(/^[a-f0-9]{24}$/).optional(), inheritType: z.literal("TIMELINE").optional(),
  sectionStyle: themeDecorAssetsSchema.shape.sectionStyles.unwrap().valueType.optional(),
  elementStyles: themeDecorAssetsSchema.shape.elementStyles.optional(),
})).min(1).max(40).refine((sections) => new Set(sections.map((section) => section.id)).size === sections.length, "Section IDs must be unique");
