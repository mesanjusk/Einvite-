import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { GuestInvitationWizard } from "@/components/guest/guest-invitation-wizard";

export const metadata: Metadata = {
  title: "Edit Your Invitation",
  robots: { index: false, follow: false },
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function EditGuestInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) notFound();

  const [themes, musicTracks, events, familyMembers, media] = await Promise.all([
    db.theme.findMany({ orderBy: { sortOrder: "asc" } }),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }),
    db.event.findMany({ where: { invitationId }, orderBy: { order: "asc" } }),
    db.familyMember.findMany({ where: { invitationId }, orderBy: { order: "asc" } }),
    db.media.findMany({ where: { invitationId }, orderBy: { order: "asc" } }),
  ]);

  const theme = invitation.themeId ? await db.theme.findUnique({ where: { id: invitation.themeId } }) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="font-display text-primary text-lg">
        AI Wedding Invitation Studio
      </Link>

      <div>
        <h1 className="font-display text-2xl">Edit Your Invitation</h1>
        <p className="text-muted-foreground text-sm">
          Update your details, photos, or theme. Changes go live as soon as you save.
        </p>
      </div>

      <GuestInvitationWizard
        existingInvitationId={invitation.id}
        isPublished={invitation.status === "PUBLISHED"}
        themes={themes.map((t) => ({
          slug: t.slug,
          name: t.name,
          category: t.category,
          isPremium: t.isPremium,
          colorPalette: t.colorPalette as { primary: string; accent: string },
        }))}
        musicTracks={musicTracks.map((m) => ({ id: m.id, title: m.title, mood: m.mood }))}
        initialMedia={media.map((m) => ({ id: m.id, url: m.url, isAuto: m.isAuto }))}
        initialValues={{
          brideName: invitation.brideName,
          bridePhoto: invitation.bridePhoto ?? undefined,
          groomName: invitation.groomName,
          groomPhoto: invitation.groomPhoto ?? undefined,
          weddingDate: toDateInputValue(invitation.weddingDate),
          venueName: invitation.venueName ?? "",
          venueAddress: invitation.venueAddress ?? "",
          googleMapsUrl: invitation.googleMapsUrl ?? "",
          customMessage: invitation.customMessage ?? "",
          language: invitation.language,
          themeSlug: theme?.slug ?? "royal",
          musicTrackId: invitation.musicTrackId ?? undefined,
          customMusicUrl: invitation.customMusicUrl ?? undefined,
          events: events.map((event) => ({
            name: event.name,
            date: toDateInputValue(event.date),
            time: event.time ?? "",
            venueName: event.venueName ?? "",
            address: event.address ?? "",
            googleMapsUrl: event.googleMapsUrl ?? "",
            dressCode: event.dressCode ?? "",
            accentColor: event.accentColor ?? undefined,
          })),
          familyMembers: familyMembers.map((member) => ({
            side: member.side,
            relation: member.relation,
            name: member.name,
            photo: member.photo ?? undefined,
          })),
          useAiCopy: false,
        }}
      />
    </div>
  );
}
