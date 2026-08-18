import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvitationPicker } from "@/components/dashboard/invitation-picker";
import { ThemeEditorForm } from "@/components/dashboard/theme-editor-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Publish — Theme" };

type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
};

type FontPairing = {
  display: string;
  body: string;
  script: string;
};

const FALLBACK_PALETTE: Palette = {
  primary: "#7a2e2e",
  secondary: "#f3d9d9",
  accent: "#c9942a",
  background: "#faf3ea",
  foreground: "#3a1414",
};

const FALLBACK_FONTS: FontPairing = {
  display: "Playfair Display",
  body: "Cormorant Garamond",
  script: "Great Vibes",
};

export default async function ThemeEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { invitationId } = await searchParams;

  const [invitations, themes, musicTracks] = await Promise.all([
    db.invitation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, brideName: true, groomName: true },
    }),
    db.theme.findMany({ where: { type: "WEBSITE" }, orderBy: { sortOrder: "asc" } }),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }),
  ]);

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Create an invitation first to customize its theme.{" "}
          <Link href="/dashboard/invitations/new" className="text-primary underline">
            Create one now
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const selectedId = invitations.some((inv) => inv.id === invitationId)
    ? invitationId!
    : invitations[0].id;
  const invitation = await db.invitation.findUnique({
    where: { id: selectedId },
    include: { theme: true },
  });
  if (!invitation) return null;

  const currentPalette =
    (invitation.colorPalette as Palette | null) ??
    (invitation.theme?.colorPalette as Palette | null) ??
    FALLBACK_PALETTE;

  const currentFonts =
    (invitation.fontPairing as FontPairing | null) ??
    (invitation.theme?.fontPairing as FontPairing | null) ??
    FALLBACK_FONTS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Pick a base theme, fine-tune colors and fonts, choose gallery animation and
          background music — changes save to this invitation only.
        </p>
        <InvitationPicker invitations={invitations} selectedId={selectedId} />
      </div>

      <ThemeEditorForm
        invitationId={invitation.id}
        brideName={invitation.brideName}
        groomName={invitation.groomName}
        themes={themes.map((t) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          category: t.category,
          colorPalette: t.colorPalette as { primary: string; accent: string; background: string },
          fontPairing: t.fontPairing as FontPairing,
        }))}
        musicTracks={musicTracks.map((track) => ({
          id: track.id,
          title: track.title,
          mood: track.mood,
          url: track.url,
        }))}
        currentThemeSlug={invitation.theme?.slug ?? themes[0]?.slug ?? "royal"}
        currentPalette={currentPalette}
        currentFonts={currentFonts}
        currentMusicTrackId={invitation.musicTrackId ?? null}
        currentCustomMusicUrl={invitation.customMusicUrl ?? null}
        currentGalleryAnimation={invitation.galleryAnimation}
      />
    </div>
  );
}
