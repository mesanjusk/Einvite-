import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { GuestInvitationWizard } from "@/components/guest/guest-invitation-wizard";

export const metadata: Metadata = { title: "Create Your Invitation" };

export default async function CreateInvitationPage() {
  const [themes, musicTracks] = await Promise.all([
    db.theme.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }).catch(() => []),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="font-display text-primary text-lg">
        AI Wedding Invitation Studio
      </Link>

      <div>
        <h1 className="font-display text-2xl">Create Your Invitation</h1>
        <p className="text-muted-foreground text-sm">
          No account needed to get started. Answer a few questions, add your photos, and
          we&apos;ll verify your WhatsApp number when you&apos;re ready to publish.
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
        musicTracks={musicTracks.map((m) => ({ id: m.id, title: m.title, mood: m.mood }))}
      />
    </div>
  );
}
