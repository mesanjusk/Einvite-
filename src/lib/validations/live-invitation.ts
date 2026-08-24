import { z } from "zod";

/**
 * Schemas for the live editor — the surface where a couple edits their
 * invitation by tapping the invitation itself rather than filling in the
 * wizard's form. Every save is one small patch of the field just touched,
 * so these are deliberately narrow: an allow-list of what a tap can change,
 * with every entry optional.
 *
 * Kept out of the "use server" action file, which may only export async
 * functions.
 */

const text = (max: number) => z.string().max(max);

export const GALLERY_ANIMATIONS = ["fade", "slide", "zoom", "flip", "blur"] as const;

/** Copy overrides that live inside the invitation's `aiGeneratedCopy` JSON. */
export const liveCopyPatchSchema = z
  .object({
    heroHeadline: text(120),
    invitationLetter: text(1200),
    storyHeadline: text(120),
  })
  .partial();

export const livePatchSchema = z
  .object({
    brideName: text(80),
    groomName: text(80),
    bridePhoto: text(600).nullable(),
    groomPhoto: text(600).nullable(),
    // `yyyy-mm-dd`, the same shape the wizard's date input produces.
    weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
    venueName: text(160),
    venueAddress: text(400),
    googleMapsUrl: text(600),
    customMessage: text(2000),
    copy: liveCopyPatchSchema,
    musicTrackId: z.string().nullable(),
    customMusicUrl: text(600).nullable(),
    galleryAnimation: z.enum(GALLERY_ANIMATIONS),
    themeSlug: z.string().min(1),
    colorwaySlug: z.string().nullable(),
  })
  .partial();

export type LivePatch = z.infer<typeof livePatchSchema>;

export const liveEventPatchSchema = z
  .object({
    name: text(80),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
    time: text(40).nullable(),
    venueName: text(160).nullable(),
    address: text(400).nullable(),
    googleMapsUrl: text(600).nullable(),
    dressCode: text(160).nullable(),
    tagline: text(240).nullable(),
  })
  .partial();

export type LiveEventPatch = z.infer<typeof liveEventPatchSchema>;
