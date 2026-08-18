import type { PrismaClient } from "@prisma/client";

import {
  DEMO_INVITATIONS,
  MUSIC_TRACKS,
  PDF_THEMES,
  SECTION_ORDER,
  THEMES,
  VIDEO_TEMPLATES,
} from "./seed-data";
import { pickStockPhotos } from "./media/stock-photos";

export async function runSeed(db: PrismaClient) {
  const themeBySlug = new Map<string, string>();

  for (const theme of THEMES) {
    const record = await db.theme.upsert({
      where: { slug: theme.slug },
      update: theme,
      create: theme,
    });
    themeBySlug.set(theme.slug, record.id);
  }

  for (const theme of PDF_THEMES) {
    await db.theme.upsert({
      where: { slug: theme.slug },
      update: theme,
      create: theme,
    });
  }

  for (const template of VIDEO_TEMPLATES) {
    await db.videoTemplate.upsert({
      where: { slug: template.slug },
      update: template,
      create: template,
    });
  }

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
    themes: THEMES.length,
    templates: THEMES.length,
    pdfThemes: PDF_THEMES.length,
    videoTemplates: VIDEO_TEMPLATES.length,
    musicTracks: MUSIC_TRACKS.length,
    demoInvitations,
  };
}
