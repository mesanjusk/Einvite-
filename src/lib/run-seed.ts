import type { PrismaClient } from "@prisma/client";

import { MUSIC_TRACKS, SECTION_ORDER, THEMES } from "./seed-data";

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

  return {
    themes: THEMES.length,
    templates: THEMES.length,
    musicTracks: MUSIC_TRACKS.length,
  };
}
