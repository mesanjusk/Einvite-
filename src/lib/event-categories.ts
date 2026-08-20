/**
 * The kinds of celebration this studio makes invitations for. Everything
 * downstream — the wizard's field labels, the ceremony list it pre-fills,
 * the fallback copy, the PDF's cover title — is looked up from here, so a
 * birthday never gets asked for the bride's name and a housewarming never
 * gets a wedding letter.
 *
 * The invitation record itself stays wedding-shaped (`brideName`,
 * `groomName`, `weddingDate`) because every renderer already reads those
 * fields. A category simply decides what those two name slots *mean*: for a
 * wedding they're the couple, for a birthday they're the birthday star and
 * whoever is hosting. `secondaryOptional` marks the categories where the
 * second slot can be left empty, and `joiner` is what prints between them.
 */

export const EVENT_CATEGORY_SLUGS = [
  "wedding",
  "ring-ceremony",
  "engagement",
  "birthday",
  "naming",
  "anniversary",
  "housewarming",
  "baby-shower",
] as const;

export type EventCategorySlug = (typeof EVENT_CATEGORY_SLUGS)[number];

export type EventCategoryContent = {
  /** Short line above the names on the cover — "Wedding Invitation". */
  eyebrow: string;
  heroHeadline: string;
  /** One-sentence invitation line; `{date}` and `{venue}` are filled in. */
  heroSubline: string;
  /** 2-3 sentence formal paragraph; `{names}`, `{date}`, `{venue}` filled in. */
  invitationLetter: string;
  /** Heading over the photo/story section. */
  storyHeadline: string;
  /** Closing line at the end of the invitation and the PDF. */
  thankYou: string;
  /** Suffix for the auto-built hashtag, e.g. "Wedding" → "AishaRohanWedding". */
  hashtagSuffix: string;
};

export type EventCategory = {
  slug: EventCategorySlug;
  label: string;
  /** Icon key resolved to a lucide icon by the chip/card components. */
  icon:
    | "heart"
    | "heart-handshake"
    | "gem"
    | "cake"
    | "sparkles"
    | "party-popper"
    | "house"
    | "baby";
  tagline: string;
  /** Field label for the first name slot (`brideName` on the record). */
  primaryNameLabel: string;
  /** Field label for the second name slot (`groomName` on the record). */
  secondaryNameLabel: string;
  /** Whether the second name slot may be left blank. */
  secondaryOptional: boolean;
  /** Printed between the two names wherever both are shown. */
  joiner: string;
  dateLabel: string;
  eventsLabel: string;
  /** Column headings over the two family lists, on the site and in the PDF. */
  familyLabels: { bride: string; groom: string };
  /** Ceremony/function names the wizard pre-fills the events step with. */
  defaultEvents: string[];
  /** Relationship suggestions for the family step. */
  familyRelations: string[];
  content: EventCategoryContent;
};

const CATEGORIES: Record<EventCategorySlug, EventCategory> = {
  wedding: {
    slug: "wedding",
    label: "Wedding",
    icon: "heart",
    tagline: "The whole celebration — from haldi to reception.",
    primaryNameLabel: "Bride's name",
    secondaryNameLabel: "Groom's name",
    secondaryOptional: false,
    joiner: "&",
    dateLabel: "Wedding date",
    eventsLabel: "Ceremonies",
    familyLabels: { bride: "Bride's family", groom: "Groom's family" },
    defaultEvents: ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"],
    familyRelations: [
      "Father",
      "Mother",
      "Brother",
      "Sister",
      "Grandfather",
      "Grandmother",
    ],
    content: {
      eyebrow: "Wedding Invitation",
      heroHeadline: "We're Getting Married",
      heroSubline: "Join us as we celebrate our wedding — {date}",
      invitationLetter:
        "Together with our families, we joyfully invite you to celebrate the wedding of {names} on {date}.{venue} Your presence would mean the world to us as we begin this new chapter.",
      storyHeadline: "Forever Us",
      thankYou: "With love and gratitude, we can't wait to celebrate with you.",
      hashtagSuffix: "Wedding",
    },
  },
  "ring-ceremony": {
    slug: "ring-ceremony",
    label: "Ring Ceremony",
    icon: "heart-handshake",
    tagline: "The rings go on — and the families come together.",
    primaryNameLabel: "Bride-to-be's name",
    secondaryNameLabel: "Groom-to-be's name",
    secondaryOptional: false,
    joiner: "&",
    dateLabel: "Ceremony date",
    eventsLabel: "Functions",
    familyLabels: { bride: "Bride-to-be's family", groom: "Groom-to-be's family" },
    defaultEvents: ["Ring Ceremony", "Lunch"],
    familyRelations: [
      "Father",
      "Mother",
      "Brother",
      "Sister",
      "Grandfather",
      "Grandmother",
    ],
    content: {
      eyebrow: "Ring Ceremony",
      heroHeadline: "We're Putting a Ring On It",
      heroSubline: "Be with us as we exchange rings — {date}",
      invitationLetter:
        "With hearts full of joy, our families invite you to the ring ceremony of {names} on {date}.{venue} Come bless the beginning of their journey together.",
      storyHeadline: "The First Yes",
      thankYou: "Thank you for standing with us at the very start.",
      hashtagSuffix: "RingCeremony",
    },
  },
  engagement: {
    slug: "engagement",
    label: "Engagement",
    icon: "gem",
    tagline: "The promise made official, with everyone watching.",
    primaryNameLabel: "Bride-to-be's name",
    secondaryNameLabel: "Groom-to-be's name",
    secondaryOptional: false,
    joiner: "&",
    dateLabel: "Engagement date",
    eventsLabel: "Functions",
    familyLabels: { bride: "Bride-to-be's family", groom: "Groom-to-be's family" },
    defaultEvents: ["Engagement", "Dinner"],
    familyRelations: [
      "Father",
      "Mother",
      "Brother",
      "Sister",
      "Grandfather",
      "Grandmother",
    ],
    content: {
      eyebrow: "Engagement Invitation",
      heroHeadline: "We Said Yes",
      heroSubline: "Celebrate our engagement with us — {date}",
      invitationLetter:
        "Together with our families, we're delighted to invite you to the engagement of {names} on {date}.{venue} Join us for an evening of promises, laughter, and good food.",
      storyHeadline: "How It Started",
      thankYou: "Grateful for every one of you who shares this joy with us.",
      hashtagSuffix: "Engagement",
    },
  },
  birthday: {
    slug: "birthday",
    label: "Birthday",
    icon: "cake",
    tagline: "Cake, music, and everyone you love in one room.",
    primaryNameLabel: "Birthday star's name",
    secondaryNameLabel: "Hosted by (optional)",
    secondaryOptional: true,
    joiner: "·",
    dateLabel: "Birthday",
    eventsLabel: "Party plan",
    familyLabels: { bride: "Family", groom: "Hosts" },
    defaultEvents: ["Cake Cutting", "Dinner & Music"],
    familyRelations: [
      "Father",
      "Mother",
      "Brother",
      "Sister",
      "Grandfather",
      "Grandmother",
    ],
    content: {
      eyebrow: "Birthday Invitation",
      heroHeadline: "It's Party Time",
      heroSubline: "Come celebrate the big day with us — {date}",
      invitationLetter:
        "You're invited to celebrate the birthday of {names} on {date}.{venue} Bring your appetite and your dancing shoes — the cake is on us.",
      storyHeadline: "Another Year",
      thankYou: "Thank you for making the day brighter just by being there.",
      hashtagSuffix: "Birthday",
    },
  },
  naming: {
    slug: "naming",
    label: "Naming",
    icon: "sparkles",
    tagline: "The day the little one gets their name.",
    primaryNameLabel: "Baby's name",
    secondaryNameLabel: "Parents (optional)",
    secondaryOptional: true,
    joiner: "·",
    dateLabel: "Ceremony date",
    eventsLabel: "Rituals",
    familyLabels: { bride: "Mother's family", groom: "Father's family" },
    defaultEvents: ["Naming Ceremony", "Lunch"],
    familyRelations: [
      "Father",
      "Mother",
      "Grandfather",
      "Grandmother",
      "Uncle",
      "Aunt",
    ],
    content: {
      eyebrow: "Naming Ceremony",
      heroHeadline: "A Name, At Last",
      heroSubline: "Join us for our little one's naming ceremony — {date}",
      invitationLetter:
        "With joy in our hearts, we invite you to the naming ceremony of {names} on {date}.{venue} Come shower our little one with your blessings.",
      storyHeadline: "Our Little One",
      thankYou: "Your blessings mean everything to our family.",
      hashtagSuffix: "NamingCeremony",
    },
  },
  anniversary: {
    slug: "anniversary",
    label: "Anniversary",
    icon: "party-popper",
    tagline: "Years together, worth making a night of.",
    primaryNameLabel: "First name",
    secondaryNameLabel: "Partner's name",
    secondaryOptional: false,
    joiner: "&",
    dateLabel: "Anniversary date",
    eventsLabel: "Functions",
    familyLabels: { bride: "Family", groom: "Family" },
    defaultEvents: ["Anniversary Celebration", "Dinner"],
    familyRelations: [
      "Son",
      "Daughter",
      "Brother",
      "Sister",
      "Grandson",
      "Granddaughter",
    ],
    content: {
      eyebrow: "Anniversary Invitation",
      heroHeadline: "Still Going Strong",
      heroSubline: "Celebrate our anniversary with us — {date}",
      invitationLetter:
        "We warmly invite you to celebrate the wedding anniversary of {names} on {date}.{venue} Come raise a glass to all the years behind us and the ones ahead.",
      storyHeadline: "All These Years",
      thankYou: "Thank you for walking these years alongside us.",
      hashtagSuffix: "Anniversary",
    },
  },
  housewarming: {
    slug: "housewarming",
    label: "Housewarming",
    icon: "house",
    tagline: "New walls, first lamp, and a house full of people.",
    primaryNameLabel: "Family name",
    secondaryNameLabel: "Hosted by (optional)",
    secondaryOptional: true,
    joiner: "·",
    dateLabel: "Griha Pravesh date",
    eventsLabel: "Rituals",
    familyLabels: { bride: "Family", groom: "Hosts" },
    defaultEvents: ["Griha Pravesh", "Puja", "Lunch"],
    familyRelations: ["Father", "Mother", "Brother", "Sister", "Son", "Daughter"],
    content: {
      eyebrow: "Housewarming Invitation",
      heroHeadline: "We've Found Our Home",
      heroSubline: "Step into our new home with us — {date}",
      invitationLetter:
        "The {names} family invites you to the housewarming of our new home on {date}.{venue} Your blessings will make these new walls a home.",
      storyHeadline: "Our New Home",
      thankYou: "Thank you for blessing our new beginning.",
      hashtagSuffix: "Housewarming",
    },
  },
  "baby-shower": {
    slug: "baby-shower",
    label: "Baby Shower",
    icon: "baby",
    tagline: "Before the little one arrives, a day for the parents-to-be.",
    primaryNameLabel: "Mum-to-be's name",
    secondaryNameLabel: "Partner's name (optional)",
    secondaryOptional: true,
    joiner: "&",
    dateLabel: "Celebration date",
    eventsLabel: "Functions",
    familyLabels: { bride: "Mother-to-be's family", groom: "Partner's family" },
    defaultEvents: ["Godh Bharai", "Lunch & Games"],
    familyRelations: ["Father", "Mother", "Sister", "Brother", "Grandmother", "Aunt"],
    content: {
      eyebrow: "Baby Shower Invitation",
      heroHeadline: "A Little One Is On The Way",
      heroSubline: "Celebrate the baby shower with us — {date}",
      invitationLetter:
        "Our family invites you to the baby shower of {names} on {date}.{venue} Come bless the parents-to-be as they wait for their little one.",
      storyHeadline: "Waiting For You",
      thankYou: "Thank you for showering us with love before the big day.",
      hashtagSuffix: "BabyShower",
    },
  },
};

export const EVENT_CATEGORIES: EventCategory[] = EVENT_CATEGORY_SLUGS.map(
  (slug) => CATEGORIES[slug],
);

export const DEFAULT_EVENT_CATEGORY: EventCategorySlug = "wedding";

export function isEventCategorySlug(
  value: string | null | undefined,
): value is EventCategorySlug {
  return (
    Boolean(value) &&
    (EVENT_CATEGORY_SLUGS as readonly string[]).includes(value as string)
  );
}

/** The category for a slug; the wedding category for anything unrecognised. */
export function eventCategoryFor(slug: string | null | undefined): EventCategory {
  return CATEGORIES[isEventCategorySlug(slug) ? slug : DEFAULT_EVENT_CATEGORY];
}

/**
 * Both name slots joined the way this category prints them — "Aisha & Rohan"
 * for a wedding, just "Aarav" for a birthday with no host filled in.
 */
export function celebrantNames(
  category: EventCategory,
  primary: string,
  secondary: string | null | undefined,
): string {
  const first = primary.trim();
  const second = (secondary ?? "").trim();
  if (!second) return first;
  if (!first) return second;
  return `${first} ${category.joiner} ${second}`;
}

/** Fills the `{names}` / `{date}` / `{venue}` slots in a content string. */
export function fillContent(
  template: string,
  values: { names: string; date: string; venue?: string | null },
): string {
  return template
    .replace(/\{names\}/g, values.names)
    .replace(/\{date\}/g, values.date)
    .replace(/\{venue\}/g, values.venue ? ` We'll be at ${values.venue}.` : "");
}
