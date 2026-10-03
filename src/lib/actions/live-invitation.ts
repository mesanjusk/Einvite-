"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { issueDraftSecret } from "@/lib/guest-session";
import { DEFAULT_SECTION_ORDER, uniqueSlug } from "@/lib/invitation-helpers";
import {
  resolveInviteThemeStyle,
  type SectionConfigEntry,
} from "@/lib/get-invite-data";
import { DEFAULT_EVENT_CATEGORY, eventCategoryFor } from "@/lib/event-categories";
import { pickStockPhotos } from "@/lib/media/stock-photos";
import { DEFAULT_PHOTO_COUNT } from "@/lib/media/constants";
import {
  livePatchSchema,
  liveEventPatchSchema,
  type LivePatch,
  type LiveEventPatch,
} from "@/lib/validations/live-invitation";
import type { ActionResult } from "@/lib/actions/auth";
import { mergeThemeDecor } from "@/lib/theme-recipe";
import { resolveThemeVariant, sectionConfigFromOrder } from "@/lib/theme-variant";

/**
 * The live editor's save path. Where the wizard collects a whole form and
 * writes it in one go, this takes the single field someone just tapped on
 * the invitation itself and writes only that — so editing a name never
 * re-runs the ceremony/family/photo writes the wizard's save does, and a
 * half-finished invitation is always a valid record.
 */

const DRAFT_SLUG_PREFIX = "draft-";

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Everything the client needs to re-render after a save, without a reload. */
type PatchResult = {
  slug: string;
  musicUrl: string | null;
  musicTrackId: string | null;
  customMusicUrl: string | null;
  themeStyle: Record<string, string>;
  themeSlug: string | null;
  galleryAnimation: string;
  sectionConfig: SectionConfigEntry[];
  designRecipe: ReturnType<typeof mergeThemeDecor>;
  revealVideoUrl: string | null;
};

export async function patchInvitationAction(
  invitationId: string,
  patch: LivePatch,
): Promise<ActionResult<PatchResult>> {
  const parsed = livePatchSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;

  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const update: Record<string, unknown> = {};

  for (const key of [
    "brideName",
    "groomName",
    "venueName",
    "venueAddress",
    "customMessage",
  ] as const) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  for (const key of ["bridePhoto", "groomPhoto"] as const) {
    if (data[key] !== undefined) update[key] = data[key] || null;
  }
  // Stored null rather than "" so the invitation renders no map button at
  // all once someone clears the link.
  if (data.googleMapsUrl !== undefined)
    update.googleMapsUrl = data.googleMapsUrl || null;
  if (data.weddingDate !== undefined) update.weddingDate = toDate(data.weddingDate);
  if (data.galleryAnimation !== undefined)
    update.galleryAnimation = data.galleryAnimation;

  if (data.copy) {
    const existing = (invitation.aiGeneratedCopy ?? {}) as Record<string, unknown>;
    update.aiGeneratedCopy = { ...existing, ...data.copy };
  }

  // A library track and an uploaded clip are mutually exclusive: whichever
  // was tapped last is the one that plays, so picking one clears the other.
  if (data.musicTrackId !== undefined) {
    update.musicTrackId = data.musicTrackId || null;
    if (data.customMusicUrl === undefined && data.musicTrackId)
      update.customMusicUrl = null;
  }
  if (data.customMusicUrl !== undefined) {
    update.customMusicUrl = data.customMusicUrl || null;
    if (data.musicTrackId === undefined && data.customMusicUrl)
      update.musicTrackId = null;
  }

  // A base theme is the reusable structure; a ThemeColorway is now a lightweight
  // variant recipe. Selecting either one resolves the whole design in one place
  // instead of carrying only a palette across the editor.
  let theme = invitation.themeId
    ? await db.theme.findUnique({ where: { id: invitation.themeId } })
    : null;

  if (data.themeSlug !== undefined && data.themeSlug !== theme?.slug) {
    const next = await db.theme.findUnique({ where: { slug: data.themeSlug } });
    if (!next || next.type !== "WEBSITE") {
      return { success: false, error: "Unknown design selected." };
    }
    const template = await db.template.findFirst({ where: { themeId: next.id } });
    const resolved = resolveThemeVariant(
      next,
      null,
      (template?.sectionOrder as string[] | undefined) ?? DEFAULT_SECTION_ORDER,
    );
    theme = next;
    update.themeId = next.id;
    update.templateId = template?.id ?? null;
    update.colorwayId = null;
    update.colorPalette = Prisma.DbNull;
    update.fontPairing = Prisma.DbNull;
    update.galleryAnimation = resolved.galleryAnimation;
    update.sectionConfig = sectionConfigFromOrder(resolved.sectionOrder);
    if (resolved.musicTrackId) {
      update.musicTrackId = resolved.musicTrackId;
      update.customMusicUrl = null;
    }
  }

  if (data.colorwaySlug !== undefined && theme) {
    const template = await db.template.findFirst({ where: { themeId: theme.id } });
    if (!data.colorwaySlug) {
      const resolved = resolveThemeVariant(
        theme,
        null,
        (template?.sectionOrder as string[] | undefined) ?? DEFAULT_SECTION_ORDER,
      );
      update.colorwayId = null;
      update.colorPalette = Prisma.DbNull;
      update.fontPairing = Prisma.DbNull;
      update.galleryAnimation = resolved.galleryAnimation;
      update.sectionConfig = sectionConfigFromOrder(resolved.sectionOrder);
      update.musicTrackId = resolved.musicTrackId;
      update.customMusicUrl = null;
    } else {
      const colorway = await db.themeColorway.findUnique({
        where: { themeId_slug: { themeId: theme.id, slug: data.colorwaySlug } },
      });
      if (!colorway)
        return { success: false, error: "Unknown design variant selected." };
      const resolved = resolveThemeVariant(
        theme,
        colorway,
        (template?.sectionOrder as string[] | undefined) ?? DEFAULT_SECTION_ORDER,
      );
      update.colorwayId = colorway.id;
      update.colorPalette = resolved.colorPalette;
      update.fontPairing = colorway.fontPairing ?? Prisma.DbNull;
      update.galleryAnimation = resolved.galleryAnimation;
      update.sectionConfig = sectionConfigFromOrder(resolved.sectionOrder);
      update.musicTrackId = resolved.musicTrackId;
      update.customMusicUrl = null;
    }
  }

  // The link guests get should read as the couple's, not as `draft-17872…`
  // — so the first save that knows a name renames it, once.
  const nextBride = (data.brideName ?? invitation.brideName).trim();
  const nextGroom = (data.groomName ?? invitation.groomName).trim();
  let slug = invitation.slug;
  if (slug.startsWith(DRAFT_SLUG_PREFIX) && (nextBride || nextGroom)) {
    slug = await uniqueSlug([nextBride, nextGroom].filter(Boolean).join("-"));
    update.slug = slug;
  }

  const saved = Object.keys(update).length
    ? await db.invitation.update({
        where: { id: invitationId },
        data: update,
        include: { music: true, theme: true, colorway: true },
      })
    : await db.invitation.findUniqueOrThrow({
        where: { id: invitationId },
        include: { music: true, theme: true, colorway: true },
      });

  revalidatePath(`/invite/${saved.slug}`);
  revalidatePath(`/design/${invitationId}`);

  return {
    success: true,
    data: {
      slug: saved.slug,
      musicUrl: saved.customMusicUrl ?? saved.music?.url ?? null,
      musicTrackId: saved.musicTrackId ?? null,
      customMusicUrl: saved.customMusicUrl ?? null,
      themeStyle: resolveInviteThemeStyle(
        saved.colorPalette ?? saved.colorway?.colorPalette ?? saved.theme?.colorPalette,
        saved.fontPairing ?? saved.colorway?.fontPairing ?? saved.theme?.fontPairing,
      ) as Record<string, string>,
      themeSlug: saved.theme?.slug ?? null,
      galleryAnimation: saved.galleryAnimation,
      sectionConfig: (saved.sectionConfig as SectionConfigEntry[] | null) ?? [],
      designRecipe: mergeThemeDecor(
        saved.theme?.decorAssets,
        saved.colorway?.decorAssets,
      ),
      revealVideoUrl:
        saved.introVideoMp4Url ??
        (saved.colorway?.revealMode === "VIDEO"
          ? (saved.colorway?.revealVideoUrl ?? null)
          : saved.theme?.revealMode === "VIDEO"
            ? (saved.theme?.revealVideoUrl ?? null)
            : null),
    },
  };
}

async function authorizeEvent(eventId: string) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  const invitation = await authorizeInvitationAccess(event.invitationId);
  if (!invitation) return null;
  return { event, invitation };
}

export async function patchInviteEventAction(
  eventId: string,
  patch: LiveEventPatch,
): Promise<ActionResult<{ id: string }>> {
  const parsed = liveEventPatchSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const authorized = await authorizeEvent(eventId);
  if (!authorized) return { success: false, error: "Event not found." };

  const { date, ...rest } = parsed.data;
  const update: Record<string, unknown> = { ...rest };
  if (date !== undefined) update.date = toDate(date);
  // Optional detail rows disappear from the invitation when cleared, rather
  // than printing an empty "Venue —" line.
  for (const key of [
    "time",
    "venueName",
    "address",
    "googleMapsUrl",
    "dressCode",
    "tagline",
  ]) {
    if (update[key] === "") update[key] = null;
  }

  await db.event.update({ where: { id: eventId }, data: update });

  revalidatePath(`/invite/${authorized.invitation.slug}`);
  return { success: true, data: { id: eventId } };
}

export type LiveEvent = {
  id: string;
  name: string;
  date: Date;
  time: string | null;
  venueName: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  dressCode: string | null;
  accentColor: string | null;
  tagline: string | null;
};

export async function addInviteEventAction(
  invitationId: string,
): Promise<ActionResult<LiveEvent>> {
  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const existing = await db.event.findMany({
    where: { invitationId },
    orderBy: { order: "asc" },
  });

  // Suggest the next function this kind of celebration usually has, so the
  // new card lands as "Sangeet" rather than as an empty box to name.
  const category = eventCategoryFor(invitation.eventCategory);
  const used = new Set(existing.map((e) => e.name.trim().toLowerCase()));
  const suggestion =
    category.defaultEvents.find((name) => !used.has(name.toLowerCase())) ??
    "New function";

  const created = await db.event.create({
    data: {
      invitationId,
      name: suggestion,
      date: invitation.weddingDate,
      order: existing.length,
    },
  });

  revalidatePath(`/invite/${invitation.slug}`);
  return {
    success: true,
    data: {
      id: created.id,
      name: created.name,
      date: created.date,
      time: created.time,
      venueName: created.venueName,
      address: created.address,
      googleMapsUrl: created.googleMapsUrl,
      dressCode: created.dressCode,
      accentColor: created.accentColor,
      tagline: created.tagline,
    },
  };
}

export async function deleteInviteEventAction(
  eventId: string,
): Promise<ActionResult<{ id: string }>> {
  const authorized = await authorizeEvent(eventId);
  if (!authorized) return { success: false, error: "Event not found." };

  await db.event.delete({ where: { id: eventId } });

  revalidatePath(`/invite/${authorized.invitation.slug}`);
  return { success: true, data: { id: eventId } };
}

/**
 * Persists the gallery's order after a photo is added, replaced or removed,
 * so the pile of polaroids looks the same on the guest's screen as it did in
 * the editor when the couple arranged it.
 */
export async function setMediaOrderAction(
  invitationId: string,
  mediaIds: string[],
): Promise<ActionResult<{ ordered: number }>> {
  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const owned = await db.media.findMany({
    where: { invitationId },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((media) => media.id));
  const ordered = mediaIds.filter((id) => ownedIds.has(id));

  await Promise.all(
    ordered.map((id, order) => db.media.update({ where: { id }, data: { order } })),
  );

  revalidatePath(`/invite/${invitation.slug}`);
  return { success: true, data: { ordered: ordered.length } };
}

export type LiveFamilyMember = {
  id: string;
  side: "BRIDE" | "GROOM";
  relation: string;
  name: string;
  photo: string | null;
};

/**
 * Writes one relative by their place on the invitation — "the bride's
 * father" — rather than by id, because that is what the editor knows: the
 * "daughter of …" line has a slot per relation, and a slot cleared to
 * nothing means that relative comes off the invitation.
 */
export async function setFamilyMemberAction(
  invitationId: string,
  side: "BRIDE" | "GROOM",
  relation: string,
  name: string,
): Promise<ActionResult<{ members: LiveFamilyMember[] }>> {
  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const cleanRelation = relation.trim().slice(0, 40);
  const cleanName = name.trim().slice(0, 80);
  if (!cleanRelation) return { success: false, error: "Missing relation." };

  const existing = await db.familyMember.findMany({
    where: { invitationId },
    orderBy: { order: "asc" },
  });
  const match = existing.find(
    (member) =>
      member.side === side &&
      member.relation.trim().toLowerCase() === cleanRelation.toLowerCase(),
  );

  if (!cleanName) {
    if (match) await db.familyMember.delete({ where: { id: match.id } });
  } else if (match) {
    await db.familyMember.update({
      where: { id: match.id },
      data: { name: cleanName },
    });
  } else {
    await db.familyMember.create({
      data: {
        invitationId,
        side,
        relation: cleanRelation,
        name: cleanName,
        order: existing.length,
      },
    });
  }

  const members = await db.familyMember.findMany({
    where: { invitationId },
    orderBy: { order: "asc" },
  });

  revalidatePath(`/invite/${invitation.slug}`);
  return {
    success: true,
    data: {
      members: members.map((member) => ({
        id: member.id,
        side: member.side,
        relation: member.relation,
        name: member.name,
        photo: member.photo,
      })),
    },
  };
}

export async function setSectionVisibilityAction(
  invitationId: string,
  sectionId: string,
  visible: boolean,
): Promise<ActionResult<{ sectionConfig: SectionConfigEntry[] }>> {
  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) return { success: false, error: "Invitation not found." };

  const sections = (invitation.sectionConfig as SectionConfigEntry[] | null) ?? [];
  const target = sections.find((section) => section.id === sectionId);
  if (!target) return { success: false, error: "Unknown section." };
  if (target.locked && !visible) {
    return { success: false, error: "This section can't be hidden." };
  }

  const next = sections.map((section) =>
    section.id === sectionId ? { ...section, visible } : section,
  );

  await db.invitation.update({
    where: { id: invitationId },
    data: { sectionConfig: next },
  });

  revalidatePath(`/invite/${invitation.slug}`);
  return { success: true, data: { sectionConfig: next } };
}

/**
 * Starts a fresh invitation for someone who tapped "make this mine" on an
 * invitation they were sent, and hands back the id of the copy to open in
 * the live editor.
 *
 * What gets copied is the *design* — the theme, its colour scheme, the
 * section layout, the gallery's reveal style and the library track. Never
 * the other couple's own content: their names, dates, venue, relatives and
 * uploaded photos stay theirs. The new invitation opens with the functions
 * this kind of celebration usually has and a set of stock photos, so it
 * reads as a finished invitation from the first tap instead of an empty page.
 */
export async function startLiveInvitationAction(input: {
  fromSlug?: string;
  category?: string;
  themeSlug?: string;
  variantSlug?: string;
}): Promise<ActionResult<{ invitationId: string }>> {
  const session = await auth();

  const source = input.fromSlug
    ? await db.invitation.findUnique({
        where: { slug: input.fromSlug },
        include: { theme: true, colorway: true },
      })
    : null;

  const category = eventCategoryFor(
    source?.eventCategory ?? input.category ?? DEFAULT_EVENT_CATEGORY,
  );

  let theme = source?.theme ?? null;
  if (!theme && input.themeSlug) {
    theme = await db.theme.findUnique({ where: { slug: input.themeSlug } });
  }
  if (!theme || theme.type !== "WEBSITE") {
    theme =
      (await db.theme.findFirst({
        where: { type: "WEBSITE", eventCategory: category.slug },
        orderBy: { sortOrder: "asc" },
      })) ??
      (await db.theme.findFirst({
        where: { type: "WEBSITE" },
        orderBy: { sortOrder: "asc" },
      }));
  }

  const template = theme
    ? await db.template.findFirst({ where: { themeId: theme.id } })
    : null;
  const variant =
    !source && theme && input.variantSlug
      ? await db.themeColorway.findUnique({
          where: { themeId_slug: { themeId: theme.id, slug: input.variantSlug } },
        })
      : null;
  const resolvedDesign = theme
    ? resolveThemeVariant(
        theme,
        variant,
        (template?.sectionOrder as string[] | undefined) ?? DEFAULT_SECTION_ORDER,
      )
    : null;

  // Music: only shared library tracks travel with a design. Uploaded audio
  // belongs to the person who uploaded it.
  const musicTrackId =
    source?.musicTrackId ??
    resolvedDesign?.musicTrackId ??
    (await db.musicTrack.findFirst({ where: { isDefault: true } }))?.id ??
    null;

  const sectionConfig =
    (source?.sectionConfig as SectionConfigEntry[] | null) ??
    sectionConfigFromOrder(resolvedDesign?.sectionOrder ?? DEFAULT_SECTION_ORDER);

  const weddingDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
  const slug = await uniqueSlug(`${DRAFT_SLUG_PREFIX}${Date.now()}`);

  const invitation = await db.invitation.create({
    data: {
      userId: session?.user?.id,
      slug,
      eventCategory: category.slug,
      brideName: "",
      groomName: "",
      weddingDate,
      themeId: theme?.id,
      templateId: template?.id,
      colorwayId: source?.colorwayId ?? variant?.id ?? null,
      colorPalette:
        source?.colorPalette ??
        (variant ? resolvedDesign?.colorPalette : undefined),
      fontPairing:
        source?.fontPairing ??
        (variant?.fontPairing ?? undefined),
      musicTrackId,
      galleryAnimation: source?.galleryAnimation ?? resolvedDesign?.galleryAnimation ?? "fade",
      sectionConfig,
    },
  });

  // The ceremony names of the invitation this was started from, where there
  // are any — a Marathi wedding's Haldi/Mehendi list is part of what someone
  // liked enough to tap "make this mine" — otherwise the category's own.
  const sourceEventNames = source
    ? (
        await db.event.findMany({
          where: { invitationId: source.id },
          orderBy: { order: "asc" },
          select: { name: true },
        })
      ).map((event) => event.name)
    : [];
  const eventNames = sourceEventNames.length
    ? sourceEventNames
    : category.defaultEvents;

  if (eventNames.length) {
    await db.event.createMany({
      data: eventNames.map((name, order) => ({
        invitationId: invitation.id,
        name,
        date: weddingDate,
        order,
      })),
    });
  }

  await db.media.createMany({
    data: pickStockPhotos(DEFAULT_PHOTO_COUNT).map((url, order) => ({
      invitationId: invitation.id,
      url,
      type: "IMAGE" as const,
      isAuto: true,
      order,
    })),
  });

  if (!session?.user) {
    const draftSecretHash = await issueDraftSecret(invitation.id);
    await db.invitation.update({
      where: { id: invitation.id },
      data: { draftSecretHash },
    });
  }

  return { success: true, data: { invitationId: invitation.id } };
}
