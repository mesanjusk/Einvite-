import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SiteLogo } from "@/components/brand/site-logo";
import { GuestInvitationWizard } from "@/components/guest/guest-invitation-wizard";
import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { DEFAULT_EVENT_CATEGORY, eventCategoryFor } from "@/lib/event-categories";
import { loadEventCategory } from "@/lib/event-category-loader";

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
  // What this celebration's form asks, as an admin configured it.
  const categoryConfig = await loadEventCategory(category.slug);

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

      {/* The way in that people actually want: a finished invitation on
          screen, edited by tapping it. The wizard below stays for anyone who
          would rather answer questions in order. */}
      <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-white/70 p-5 text-center shadow-sm">
        <h2 className="font-display text-xl">Design it live</h2>
        <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
          Open a ready-made {category.label.toLowerCase()} invitation and tap anything on
          it — names, dates, photos, music — to make it yours.
        </p>
        <StartLiveInvitationButton
          category={category.slug}
          themeSlug={initialThemeSlug}
          className="bg-primary text-primary-foreground mt-4 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium shadow-sm"
        >
          Start editing live
        </StartLiveInvitationButton>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <p className="text-muted-foreground mb-3 text-center text-xs tracking-[0.2em] uppercase">
          Or fill in the details step by step
        </p>
        <GuestInvitationWizard
          eventCategory={category.slug}
          categoryConfig={categoryConfig}
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
