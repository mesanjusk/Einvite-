import type { Metadata } from "next";

import { db } from "@/lib/db";
import { GuestInvitationWizard } from "@/components/guest/guest-invitation-wizard";

export const metadata: Metadata = { title: "Create Invitation" };

export default async function NewInvitationPage() {
  const [themes, musicTracks] = await Promise.all([
    db.theme.findMany({ where: { type: "WEBSITE" }, orderBy: { sortOrder: "asc" } }),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Create Invitation</h1>
        <p className="text-muted-foreground text-sm">
          Answer a few questions, add at least 5 photos, and we&apos;ll lay out every
          section for you — the same builder your couples use.
        </p>
      </div>

      <GuestInvitationWizard
        themes={themes.map((t) => ({
          slug: t.slug,
          name: t.name,
          category: t.category,
          isPremium: t.isPremium,
          colorPalette: t.colorPalette as { primary: string; accent: string },
        }))}
        musicTracks={musicTracks.map((m) => ({ id: m.id, title: m.title, artist: m.artist, mood: m.mood, url: m.url }))}
      />
    </div>
  );
}
