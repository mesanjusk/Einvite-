export type InviteEvent = {
  id: string;
  name: string;
  date: Date;
  time: string | null;
  venueName: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  dressCode: string | null;
  accentColor: string | null;
  tagline: string | null;
};

export type InviteFamilyMember = {
  id: string;
  side: "BRIDE" | "GROOM";
  relation: string;
  name: string;
  photo: string | null;
};

export type InviteMedia = {
  id: string;
  url: string;
  caption: string | null;
  type?: "IMAGE" | "VIDEO";
};

export type InviteCopy = {
  eyebrow?: string;
  heroHeadline?: string;
  heroSubline?: string;
  invitationLetter?: string;
  storyHeadline?: string;
  thankYou?: string;
  hashtagSuffix?: string;
  hashtags?: string[];
};

export type InviteData = {
  id: string;
  slug: string;
  /** Which celebration this is — see src/lib/event-categories.ts. */
  eventCategory: string;
  brideName: string;
  bridePhoto: string | null;
  groomName: string;
  groomPhoto: string | null;
  weddingDate: Date;
  venueName: string | null;
  venueAddress: string | null;
  googleMapsUrl: string | null;
  customMessage: string | null;
  musicUrl: string | null;
  galleryAnimation: string;
  copy: InviteCopy | null;
  events: InviteEvent[];
  familyMembers: InviteFamilyMember[];
  media: InviteMedia[];
  isDemo: boolean;
  themeSlug: string | null;
  revealMode?: "ANIMATION" | "VIDEO";
  revealVideoUrl: string | null;
  revealVideoWebmUrl?: string | null;
  revealVideoPosterUrl?: string | null;
  revealTransition?: "NONE" | "FADE" | "SLIDE" | "ZOOM";
  revealAnimation?: {
    preset: "MAGIC_BLOOM" | "SPARKLES" | "CONFETTI" | "PETALS";
    intensity: number;
    speed: number;
  };
  sectionNames?: Record<string, string>;
  sectionImages?: Partial<Record<string, string>>;
  elementStyles?: Record<
    string,
    {
      text?: string;
      hidden?: boolean;
      width?: number;
      fontSize?: number;
      fontRole?: "display" | "body" | "script";
      align?: "left" | "center" | "right";
      color?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      letterSpacing?: number;
      lineHeight?: number;
      opacity?: number;

      x?: number;
      y?: number;
      showBackground?: boolean;
    }
  >;
  customText?: Record<
    string,
    Array<{
      id: string;
      text: string;
      width?: number;
      fontSize: number;
      fontRole: "display" | "body" | "script";
      align: "left" | "center" | "right";
      color?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      letterSpacing?: number;
      lineHeight?: number;
      opacity?: number;

      x?: number;
      y?: number;
    }>
  >;
  sectionStyles?: Record<
    string,
    {
      x?: number;
      y?: number;
      scratchShape?: "box" | "round" | "heart" | "diamond" | "hexagon";
      showBox?: boolean;
      primary?: string;
      accent?: string;
      foreground?: string;
      displayFont?: string;
      bodyFont?: string;
      scriptFont?: string;
    }
  >;
};
