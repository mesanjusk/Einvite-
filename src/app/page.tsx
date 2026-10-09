import type { Metadata } from "next";

import { db } from "@/lib/db";
import {
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/config/site";
import { RoyalLandingPage } from "@/components/marketing/royal-landing-page";

const TITLE = `${SITE_NAME} — Royal Digital Wedding Invitations`;

export const metadata: Metadata = {
  title: TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [SITE_LOGO_PATH],
    type: "website",
  },
};

export default async function Home() {
  const [themes, demos] = await Promise.all([
    db.theme
      .findMany({
        where: { type: "WEBSITE", isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      })
      .catch(() => []),
    db.invitation
      .findMany({
        where: { isDemo: true, status: "PUBLISHED" },
        select: { slug: true, themeId: true },
        orderBy: { createdAt: "asc" },
      })
      .catch(() => []),
  ]);

  const demoSlugByThemeId = new Map(demos.map((demo) => [demo.themeId, demo.slug]));
  const themeCards = themes.map((theme) => {
          const decor = (theme.decorAssets ?? {}) as {
            revealAnimation?: { preset?: string }; revealVideoPosterUrl?: string; sectionImages?: Record<string, string>;
          };
          const palette = theme.colorPalette as { primary?: string; accent?: string };
          return {
            id: theme.id,
            name: theme.name,
            slug: theme.slug,
            category: theme.category,
            eventCategory: theme.eventCategory,
            eventCategories: theme.eventCategories,
            isPremium: theme.isPremium,
            previewImage: theme.previewImage ?? null,
            revealMode: theme.revealMode,
            revealVideoUrl: theme.revealVideoUrl,
            revealVideoPosterUrl: decor.revealVideoPosterUrl,
            sectionArtwork: decor.sectionImages?.HERO || Object.values(decor.sectionImages ?? {}).find(Boolean) || null,
            revealAnimationPreset: decor.revealAnimation?.preset ?? "MAGIC_BLOOM",
            previewPrimary: palette.primary ?? "#76508c",
            previewAccent: palette.accent ?? "#a987bd",
            demoSlug: demoSlugByThemeId.get(theme.id) ?? null,
          };
        });

  return <RoyalLandingPage themeCards={themeCards} />;
}
