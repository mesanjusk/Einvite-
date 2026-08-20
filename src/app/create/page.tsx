import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SiteLogo } from "@/components/brand/site-logo";
import { GuestInvitationWizard } from "@/components/guest/guest-invitation-wizard";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { DEFAULT_EVENT_CATEGORY, eventCategoryFor } from "@/lib/event-categories";

export const metadata: Metadata = {
  title: "Create Your Invitation",
  robots: { index: false, follow: false },
};

export default async function CreateInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; category?: string }>;
}) {
  const { theme: themeSlugParam, category: categoryParam } = await searchParams;
  const category = eventCategoryFor(categoryParam);

  const [themes, musicTracks] = await Promise.all([
    db.theme
      .findMany({
        where: { type: "WEBSITE", eventCategory: category.slug },
        orderBy: { sortOrder: "asc" },
        include: { colorways: { orderBy: { sortOrder: "asc" } } },
      })
      .catch(() => []),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }).catch(() => []),
  ]);

  // Themes seeded before this category existed carry no `eventCategory`, so
  // a category with nothing of its own still opens on the wedding designs
  // rather than on an empty picker.
  const fallbackThemes =
    themes.length === 0 && category.slug !== DEFAULT_EVENT_CATEGORY
      ? await db.theme
          .findMany({
            where: { type: "WEBSITE", eventCategory: DEFAULT_EVENT_CATEGORY },
            orderBy: { sortOrder: "asc" },
            include: { colorways: { orderBy: { sortOrder: "asc" } } },
          })
          .catch(() => [])
      : [];
  const visibleThemes = themes.length > 0 ? themes : fallbackThemes;

  const initialThemeSlug = visibleThemes.some((t) => t.slug === themeSlugParam)
    ? themeSlugParam
    : undefined;

  return (
    <div className="to-background flex min-h-svh flex-col items-center gap-6 bg-gradient-to-b from-[oklch(0.97_0.015_340)] px-4 py-12">
      <Link href="/" className="inline-block">
        <SiteLogo size="lg" />
      </Link>

      <div className="w-full max-w-3xl">
        <EventCategoryChips activeSlug={category.slug} />
        <p className="text-muted-foreground mt-4 text-center text-sm">
          {category.tagline}
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <GuestInvitationWizard
          eventCategory={category.slug}
          themes={visibleThemes.map((t) => ({
            slug: t.slug,
            name: t.name,
            category: t.category,
            isPremium: t.isPremium,
            previewImage: t.previewImage,
            colorPalette: t.colorPalette as { primary: string; accent: string },
            colorways: t.colorways.map((c) => ({
              slug: c.slug,
              name: c.name,
              colorPalette: c.colorPalette as { primary: string; accent: string },
            })),
          }))}
          musicTracks={musicTracks.map((m) => ({
            id: m.id,
            title: m.title,
            artist: m.artist,
            mood: m.mood,
            url: m.url,
          }))}
          initialValues={{
            eventCategory: category.slug,
            ...(initialThemeSlug ? { themeSlug: initialThemeSlug } : {}),
          }}
        />
      </div>
    </div>
  );
}
