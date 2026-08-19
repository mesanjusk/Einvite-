import type { PrismaClient } from "@prisma/client";

import {
  DEMO_INVITATIONS,
  MUSIC_TRACKS,
  PDF_THEMES,
  SECTION_ORDER,
  THEMES,
  VIDEO_TEMPLATES,
  seedThumbnailFor,
} from "./seed-data";
import { pickStockPhotos } from "./media/stock-photos";
import { newPdfPlaceholder, type PdfTemplatePage } from "./validations/pdf-template";

// A simple starter layout so "Elegant Print" is usable out of the box —
// admins can redesign it entirely from /admin/pdf-themes/[id].
const DEFAULT_PDF_PAGES: PdfTemplatePage[] = [
  {
    id: "page-1",
    backgroundColor: "#ffffff",
    size: "A4",
    placeholders: [
      { ...newPdfPlaceholder("STATIC"), id: "ph-1", staticText: "You're Invited", x: 10, y: 15, width: 80, fontSize: 28, align: "center", bold: true },
      { ...newPdfPlaceholder("coupleNames"), id: "ph-2", x: 10, y: 30, width: 80, fontSize: 32, align: "center", bold: true },
      { ...newPdfPlaceholder("weddingDate"), id: "ph-3", x: 10, y: 45, width: 80, fontSize: 18, align: "center" },
      { ...newPdfPlaceholder("venueName"), id: "ph-4", x: 10, y: 52, width: 80, fontSize: 16, align: "center" },
      { ...newPdfPlaceholder("customMessage"), id: "ph-5", x: 15, y: 65, width: 70, fontSize: 12, align: "center" },
    ],
  },
];

export async function runSeed(db: PrismaClient) {
  const themeBySlug = new Map<string, string>();

  for (const theme of THEMES) {
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
  }

  for (const theme of PDF_THEMES) {
    const record = await db.theme.upsert({
      where: { slug: theme.slug },
      update: theme,
      create: theme,
    });
    await db.template.upsert({
      where: { slug: `${theme.slug}-classic` },
      update: { name: `${theme.name} Classic`, themeId: record.id },
      create: {
        name: `${theme.name} Classic`,
        slug: `${theme.slug}-classic`,
        themeId: record.id,
        sectionOrder: [],
        pages: DEFAULT_PDF_PAGES,
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
