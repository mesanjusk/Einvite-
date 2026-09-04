import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { getInvitationById, toInviteRenderData } from "@/lib/get-invite-data";
import { eventCategoryFor } from "@/lib/event-categories";
import { INDIC_FONT_VARIABLE_CLASSES } from "@/lib/i18n/fonts";
import { LiveEditor } from "@/components/invite/live/live-editor";
import { EditorPolishStyles } from "@/components/invite/live/editor-polish-styles";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Personalize Your Invitation",
  robots: { index: false, follow: false },
};

export default async function DesignInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  const authorized = await authorizeInvitationAccess(invitationId);
  if (!authorized) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-display text-2xl">We couldn&apos;t verify access</h1>
        <p className="text-muted-foreground text-sm">
          Open your private edit link again, or choose another invitation design.
        </p>
        <Button asChild>
          <Link href="/themes">Browse invitation designs</Link>
        </Button>
      </div>
    );
  }

  const invitation = await getInvitationById(invitationId);
  if (!invitation) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-display text-2xl">This invitation is no longer available</h1>
        <Button asChild>
          <Link href="/themes">Browse invitation designs</Link>
        </Button>
      </div>
    );
  }

  const category = eventCategoryFor(invitation.eventCategory);
  const themeFilter = invitation.themeId
    ? { OR: [{ eventCategory: category.slug }, { id: invitation.themeId }] }
    : { eventCategory: category.slug };

  const [themes, musicTracks, colorway] = await Promise.all([
    db.theme.findMany({
      where: { type: "WEBSITE", ...themeFilter },
      orderBy: { sortOrder: "asc" },
      include: { colorways: { orderBy: { sortOrder: "asc" } } },
    }),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }),
    invitation.colorwayId
      ? db.themeColorway.findUnique({
          where: { id: invitation.colorwayId },
          select: { slug: true },
        })
      : null,
  ]);

  const { inviteData, themeStyle, sectionConfig } = toInviteRenderData(invitation);

  return (
    <div className={`${INDIC_FONT_VARIABLE_CLASSES} guided-editor-shell`}>
      <EditorPolishStyles />
      <LiveEditor
        invitationId={invitation.id}
        initialInvite={inviteData}
        initialThemeStyle={themeStyle}
        initialSections={sectionConfig}
        initialThemeSlug={invitation.theme?.slug ?? null}
        initialColorwaySlug={colorway?.slug ?? null}
        initialMusicTrackId={invitation.musicTrackId ?? null}
        initialCustomMusicUrl={invitation.customMusicUrl ?? null}
        themes={themes.map((theme) => ({
          slug: theme.slug,
          name: theme.name,
          previewImage: theme.previewImage,
          colorPalette: theme.colorPalette as { primary: string; accent: string },
          colorways: theme.colorways.map((colorway) => ({
            slug: colorway.slug,
            name: colorway.name,
            colorPalette: colorway.colorPalette as { primary: string; accent: string },
          })),
        }))}
        musicTracks={musicTracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          mood: track.mood,
          url: track.url,
        }))}
        isPublished={invitation.status === "PUBLISHED"}
        isGuestFlow={!invitation.userId}
        appUrl={getAppUrl()}
      />
    </div>
  );
}
