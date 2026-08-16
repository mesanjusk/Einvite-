import { db } from "@/lib/db";
import { buildInviteThemeStyle } from "@/lib/theme-css-vars";
import type { InviteData } from "@/components/invite/types";

const INVITATION_INCLUDE = {
  theme: true,
  music: true,
  events: { orderBy: { order: "asc" as const } },
  familyMembers: { orderBy: { order: "asc" as const } },
  media: { orderBy: { order: "asc" as const } },
};

export type SectionConfigEntry = {
  id: string;
  type: string;
  visible: boolean;
  locked: boolean;
  order: number;
};

const DEFAULT_PALETTE = {
  primary: "#7a2e2e",
  secondary: "#f3d9d9",
  accent: "#c9942a",
  background: "#faf3ea",
  foreground: "#3a1414",
};

const DEFAULT_FONTS = {
  display: "Playfair Display",
  body: "Cormorant Garamond",
  script: "Great Vibes",
};

export function getInvitationBySlug(slug: string) {
  return db.invitation.findUnique({ where: { slug }, include: INVITATION_INCLUDE });
}

export function getInvitationById(id: string) {
  return db.invitation.findUnique({ where: { id }, include: INVITATION_INCLUDE });
}

/**
 * Resolves a guest from their personalized invite link token, scoped to the
 * given invitation so a token minted for one wedding can't be replayed
 * against another. Marks the guest's first-view timestamp best-effort.
 */
export async function getGuestByToken(invitationId: string, token: string) {
  const guest = await db.guest.findUnique({ where: { inviteToken: token } });
  if (!guest || guest.invitationId !== invitationId) return null;

  if (!guest.viewedAt) {
    db.guest.update({ where: { id: guest.id }, data: { viewedAt: new Date() } }).catch(() => {});
  }

  return guest;
}

type InvitationWithRelations = NonNullable<
  Awaited<ReturnType<typeof getInvitationBySlug>>
>;

export function toInviteRenderData(invitation: InvitationWithRelations) {
  const palette = (invitation.colorPalette ?? invitation.theme?.colorPalette) as
    | typeof DEFAULT_PALETTE
    | undefined;
  const fonts = (invitation.fontPairing ?? invitation.theme?.fontPairing) as
    | typeof DEFAULT_FONTS
    | undefined;

  const themeStyle = buildInviteThemeStyle(palette ?? DEFAULT_PALETTE, fonts ?? DEFAULT_FONTS);

  const inviteData: InviteData = {
    id: invitation.id,
    slug: invitation.slug,
    brideName: invitation.brideName,
    bridePhoto: invitation.bridePhoto,
    groomName: invitation.groomName,
    groomPhoto: invitation.groomPhoto,
    weddingDate: invitation.weddingDate,
    venueName: invitation.venueName,
    venueAddress: invitation.venueAddress,
    googleMapsUrl: invitation.googleMapsUrl,
    customMessage: invitation.customMessage,
    musicUrl: invitation.customMusicUrl ?? invitation.music?.url ?? null,
    galleryAnimation: invitation.galleryAnimation,
    copy: invitation.aiGeneratedCopy as InviteData["copy"],
    events: invitation.events,
    familyMembers: invitation.familyMembers,
    media: invitation.media,
    isDemo: invitation.isDemo,
    themeSlug: invitation.theme?.slug ?? null,
    revealVideoUrl: invitation.theme?.revealVideoUrl ?? null,
  };

  const sectionConfig = (invitation.sectionConfig as SectionConfigEntry[] | null) ?? [];

  return { inviteData, themeStyle, sectionConfig };
}
