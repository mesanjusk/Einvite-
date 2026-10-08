import { independentSections } from "@/lib/invitation-sections";
import { db } from "@/lib/db";
import {
  buildInviteThemeStyle,
  type ThemeColorPalette,
  type ThemeFontPairing,
} from "@/lib/theme-css-vars";
import type { InviteData } from "@/components/invite/types";

const INVITATION_INCLUDE = {
  theme: true,
  pdfTheme: true,
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
  title?: string;
  eventId?: string;
  inheritType?: string;
  elementStyles?: InviteData["elementStyles"];
  sectionStyle?: NonNullable<InviteData["sectionStyles"]>[string];
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

/**
 * The invitation's CSS custom properties, with the studio defaults filled in
 * for anything the theme (or a colourway override) doesn't set. Shared by the
 * public render path and the live editor, which re-styles the page in place
 * when someone switches design.
 */
export function resolveInviteThemeStyle(
  palette: unknown,
  fonts: unknown,
): React.CSSProperties {
  return buildInviteThemeStyle(
    (palette as ThemeColorPalette | null) ?? DEFAULT_PALETTE,
    (fonts as ThemeFontPairing | null) ?? DEFAULT_FONTS,
  );
}

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
  const decorAssets = (invitation.theme?.decorAssets ?? {}) as {
    revealVideoWebmUrl?: string;
    revealVideoPosterUrl?: string;
    revealAnimation?: InviteData["revealAnimation"];
    sectionNames?: InviteData["sectionNames"];
    sectionImages?: InviteData["sectionImages"];
    elementStyles?: InviteData["elementStyles"];
    customText?: InviteData["customText"];
    sectionStyles?: InviteData["sectionStyles"];
  };

  const themeStyle = resolveInviteThemeStyle(
    invitation.colorPalette ?? invitation.theme?.colorPalette,
    invitation.fontPairing ?? invitation.theme?.fontPairing,
  );

  const inviteData: InviteData = {
    id: invitation.id,
    slug: invitation.slug,
    eventCategory: invitation.eventCategory,
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
    copy: {
      ...((invitation.theme?.content as Record<string, unknown> | null) ?? {}),
      ...((invitation.aiGeneratedCopy as Record<string, unknown> | null) ?? {}),
    } as InviteData["copy"],
    events: invitation.events,
    familyMembers: invitation.familyMembers,
    media: invitation.media,
    isDemo: invitation.isDemo,
    themeSlug: invitation.theme?.slug ?? null,
    revealVideoUrl:
      invitation.introVideoMp4Url ??
      (invitation.theme?.revealMode === "VIDEO" ? (invitation.theme?.revealVideoUrl ?? null) : null),
    revealVideoWebmUrl: invitation.introVideoWebmUrl ?? (invitation.introVideoMp4Url ? null : invitation.theme?.revealMode === "VIDEO" ? decorAssets.revealVideoWebmUrl || null : null),
    revealVideoPosterUrl: invitation.introVideoPosterUrl ?? (invitation.introVideoMp4Url ? null : invitation.theme?.revealMode === "VIDEO" ? decorAssets.revealVideoPosterUrl || invitation.theme.previewImage || null : null),
    revealAnimation: decorAssets.revealAnimation ?? {
      preset: "MAGIC_BLOOM",
      intensity: 1,
      speed: 1,
    },
    sectionNames: decorAssets.sectionNames ?? {},
    sectionImages: decorAssets.sectionImages ?? {},
    elementStyles: decorAssets.elementStyles ?? {},
    customText: decorAssets.customText ?? {},
    sectionStyles: decorAssets.sectionStyles ?? {},
  };

  const sectionConfig = independentSections((invitation.sectionConfig as SectionConfigEntry[] | null) ?? [], invitation.events);
  for (const section of sectionConfig) {
    if (section.title) inviteData.sectionNames = { ...inviteData.sectionNames, [section.type]: section.title };
    if (section.sectionStyle) inviteData.sectionStyles = { ...inviteData.sectionStyles, [section.type]: section.sectionStyle };
    if (section.elementStyles) inviteData.elementStyles = { ...inviteData.elementStyles, ...section.elementStyles };
    if (section.inheritType) {
      inviteData.elementStyles ??= {};
      for (const [key, value] of Object.entries(inviteData.elementStyles ?? {})) {
        if (key.startsWith(`${section.inheritType}.`)) inviteData.elementStyles[ key.replace(`${section.inheritType}.`, `${section.type}.`) ] ??= value;
      }
    }
  }

  for (const [type, blocks] of Object.entries(inviteData.customText ?? {})) {
    inviteData.customText = { ...inviteData.customText, [type]: blocks.map((block) => ({ ...block, ...inviteData.elementStyles?.[block.id] })) };
  }
  return { inviteData, themeStyle, sectionConfig };
}
