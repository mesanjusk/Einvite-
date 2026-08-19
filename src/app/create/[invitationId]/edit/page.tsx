import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { SiteLogo } from "@/components/brand/site-logo";
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
    db.theme.findMany({ where: { type: "WEBSITE" }, orderBy: { sortOrder: "asc" } }),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }),
    db.event.findMany({ where: { invitationId }, orderBy: { order: "asc" } }),
    db.familyMember.findMany({ where: { invitationId }, orderBy: { order: "asc" } }),
    db.media.findMany({ where: { invitationId }, orderBy: { order: "asc" } }),
  ]);

  const theme = invitation.themeId ? await db.theme.findUnique({ where: { id: invitation.themeId } }) : null;

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 bg-gradient-to-b from-[oklch(0.97_0.015_340)] to-background px-4 py-12">
      <Link href="/" className="inline-block">
        <SiteLogo size="lg" />
      </Link>

      <div className="mx-auto w-full max-w-2xl">
        <GuestInvitationWizard
          existingInvitationId={invitation.id}
          isPublished={invitation.status === "PUBLISHED"}
          hasPhoneLink={Boolean(invitation.phoneLink)}
          themes={themes.map((t) => ({
            slug: t.slug,
            name: t.name,
            category: t.category,
            isPremium: t.isPremium,
            colorPalette: t.colorPalette as { primary: string; accent: string },
          }))}
          musicTracks={musicTracks.map((m) => ({ id: m.id, title: m.title, artist: m.artist, mood: m.mood, url: m.url }))}
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
            religion: invitation.religion ?? "",
            caste: invitation.caste ?? "",
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
    </div>
  );
}
