import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SiteLogo } from "@/components/brand/site-logo";
import { GuestInvitationWizard } from "@/components/guest/guest-invitation-wizard";

export const metadata: Metadata = {
  title: "Create Your Invitation",
  robots: { index: false, follow: false },
};

export default async function CreateInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const [{ theme: themeSlugParam }, themes, musicTracks] = await Promise.all([
    searchParams,
    db.theme
      .findMany({
        where: { type: "WEBSITE" },
        orderBy: { sortOrder: "asc" },
        include: { colorways: { orderBy: { sortOrder: "asc" } } },
      })
      .catch(() => []),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }).catch(() => []),
  ]);
  const initialThemeSlug = themes.some((t) => t.slug === themeSlugParam)
    ? themeSlugParam
    : undefined;

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 bg-gradient-to-b from-[oklch(0.97_0.015_340)] to-background px-4 py-12">
      <Link href="/" className="inline-block">
        <SiteLogo size="lg" />
      </Link>

      <div className="mx-auto w-full max-w-2xl">
        <GuestInvitationWizard
          themes={themes.map((t) => ({
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
          musicTracks={musicTracks.map((m) => ({ id: m.id, title: m.title, artist: m.artist, mood: m.mood, url: m.url }))}
          initialValues={initialThemeSlug ? { themeSlug: initialThemeSlug } : undefined}
        />
      </div>
    </div>
  );
}
