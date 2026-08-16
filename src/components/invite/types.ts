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
};

export type InviteCopy = {
  heroHeadline?: string;
  heroSubline?: string;
  invitationLetter?: string;
  storyHeadline?: string;
  hashtags?: string[];
};

export type InviteData = {
  id: string;
  slug: string;
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
  revealVideoUrl: string | null;
};
