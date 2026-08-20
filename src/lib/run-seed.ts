import type { PrismaClient } from "@prisma/client";

import {
  CATEGORY_THEMES,
  DEMO_INVITATIONS,
  MUSIC_TRACKS,
  PDF_THEMES,
  SECTION_ORDER,
  THEMES,
  VIDEO_TEMPLATES,
  seedThumbnailFor,
  THEME_COLORWAYS,
} from "./seed-data";
import { pickStockPhotos } from "./media/stock-photos";

export async function runSeed(db: PrismaClient) {
  const themeBySlug = new Map<string, string>();

  // Wedding designs and the designs for every other celebration are seeded
  // the same way — they differ only in `eventCategory` and the default copy
  // the category ones carry.
  const websiteThemes = [...THEMES, ...CATEGORY_THEMES];

  for (const theme of websiteThemes) {
    // Seeded themes carry a stock thumbnail so the catalogue and home page
    // show photos out of the box; an admin-uploaded one is never overwritten.
    const existing = await db.theme.findUnique({
      where: { slug: theme.slug },
      select: { previewImage: true },
    });
    const previewImage = existing?.previewImage ?? seedThumbnailFor(theme.slug);

    const record = await db.theme.upsert({
      where: { slug: theme.slug },
      update: { ...theme, previewImage },
      create: { ...theme, previewImage },
    });
    themeBySlug.set(theme.slug, record.id);

    for (const [index, colorway] of (THEME_COLORWAYS[theme.slug] ?? []).entries()) {
      await db.themeColorway.upsert({
        where: { themeId_slug: { themeId: record.id, slug: colorway.slug } },
        update: { name: colorway.name, colorPalette: colorway.colorPalette, sortOrder: index },
        create: {
          themeId: record.id,
          name: colorway.name,
          slug: colorway.slug,
          colorPalette: colorway.colorPalette,
          sortOrder: index,
        },
      });
    }
  }

  for (const theme of PDF_THEMES) {
    const record = await db.theme.upsert({
      where: { slug: theme.slug },
      update: theme,
      create: theme,
    });
    // Deliberately created without `pages`: a print design with no hand-drawn
    // template is rendered from the invitation's own data and photos, which is
    // what these layouts are for. An admin who draws one from
    // /admin/library/pdf-themes/[id] takes over from there, and a template
    // drawn earlier is never overwritten by re-seeding.
    await db.template.upsert({
      where: { slug: `${theme.slug}-classic` },
      update: { name: `${theme.name} Classic`, themeId: record.id },
      create: {
        name: `${theme.name} Classic`,
        slug: `${theme.slug}-classic`,
        themeId: record.id,
        sectionOrder: [],
      },
    });
  }

  for (const template of VIDEO_TEMPLATES) {
    await db.videoTemplate.upsert({
      where: { slug: template.slug },
      update: template,
      create: template,
    });
  }

  for (const theme of websiteThemes) {
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

  for (const track of MUSIC_TRACKS) {
    await db.musicTrack.upsert({
      where: { title: track.title },
      update: track,
      create: track,
    });
  }

  let demoInvitations = 0;
  for (const demo of DEMO_INVITATIONS) {
    const themeId = themeBySlug.get(demo.themeSlug);
    if (!themeId) continue;
    const template = await db.template.findFirst({ where: { themeId } });

    const invitation = await db.invitation.upsert({
      where: { slug: demo.slug },
      update: {
        eventCategory: demo.eventCategory,
        brideName: demo.brideName,
        groomName: demo.groomName,
        weddingDate: new Date(demo.weddingDate),
        venueName: demo.venueName,
        venueAddress: demo.venueAddress,
        customMessage: demo.customMessage,
        themeId,
        templateId: template?.id,
        status: "PUBLISHED",
        isDemo: true,
        publishedAt: new Date(),
      },
      create: {
        slug: demo.slug,
        eventCategory: demo.eventCategory,
        brideName: demo.brideName,
        groomName: demo.groomName,
        weddingDate: new Date(demo.weddingDate),
        venueName: demo.venueName,
        venueAddress: demo.venueAddress,
        customMessage: demo.customMessage,
        themeId,
        templateId: template?.id,
        status: "PUBLISHED",
        isDemo: true,
        publishedAt: new Date(),
        language: "EN",
        sectionConfig: SECTION_ORDER.map((type, order) => ({
          id: type,
          type,
          visible: true,
          locked: false,
          order,
        })),
      },
    });
    demoInvitations += 1;

    const mediaCount = await db.media.count({ where: { invitationId: invitation.id } });
    if (mediaCount < 5) {
      const urls = pickStockPhotos(5 - mediaCount);
      await db.media.createMany({
        data: urls.map((url, i) => ({
          invitationId: invitation.id,
          url,
          type: "IMAGE" as const,
          isAuto: true,
          order: mediaCount + i,
        })),
      });
    }
  }

  return {
    themes: websiteThemes.length,
    templates: websiteThemes.length,
    pdfThemes: PDF_THEMES.length,
    videoTemplates: VIDEO_TEMPLATES.length,
    musicTracks: MUSIC_TRACKS.length,
    demoInvitations,
  };
}
