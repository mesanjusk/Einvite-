import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
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
    db.theme.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }).catch(() => []),
  ]);
  const initialThemeSlug = themes.some((t) => t.slug === themeSlugParam)
    ? themeSlugParam
    : undefined;

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 bg-gradient-to-b from-[oklch(0.97_0.02_80)] to-background px-4 py-12">
      <Link href="/" className="font-display text-primary text-2xl">
        AI Wedding Invitation Studio
      </Link>

      <div className="mx-auto w-full max-w-2xl">
        <GuestInvitationWizard
          themes={themes.map((t) => ({
            slug: t.slug,
            name: t.name,
            category: t.category,
            isPremium: t.isPremium,
            colorPalette: t.colorPalette as { primary: string; accent: string },
          }))}
          musicTracks={musicTracks.map((m) => ({ id: m.id, title: m.title, mood: m.mood }))}
          initialValues={initialThemeSlug ? { themeSlug: initialThemeSlug } : undefined}
        />
      </div>
    </div>
  );
}
