import { isEventSection } from "./invitation-sections";
export type ThemeCoreContentField =
  | "eyebrow"
  | "heroHeadline"
  | "heroSubline"
  | "invitationLetter"
  | "storyHeadline"
  | "thankYou";

export type ThemeElementDefinition = {
  key: string;
  section: string;
  label: string;
  coreField?: ThemeCoreContentField;
  dynamic?: boolean;
  fallbackText?: string;
};

export const THEME_ELEMENT_DEFINITIONS: ThemeElementDefinition[] = [
  { key: "HERO.eyebrow", section: "HERO", label: "Blessing / eyebrow", coreField: "eyebrow" },
  { key: "HERO.heroHeadline", section: "HERO", label: "Hero headline", coreField: "heroHeadline" },
  { key: "HERO.heroSubline", section: "HERO", label: "Hero subline", coreField: "heroSubline" },
  { key: "HERO.invitationLetter", section: "HERO", label: "Invitation paragraph", coreField: "invitationLetter" },
  { key: "HERO.primaryName", section: "HERO", label: "Primary name", dynamic: true },
  { key: "HERO.joiner", section: "HERO", label: "Name joiner", fallbackText: "&" },
  { key: "HERO.secondaryName", section: "HERO", label: "Secondary name", dynamic: true },

  { key: "COUNTDOWN.saveTheDate", section: "COUNTDOWN", label: "Save the Date heading", fallbackText: "Save the Date" },
  { key: "COUNTDOWN.scratchInstruction", section: "COUNTDOWN", label: "Scratch instruction", fallbackText: "Scratch below to reveal our wedding date" },
  { key: "COUNTDOWN.quote", section: "COUNTDOWN", label: "Countdown quote", fallbackText: "Counting down to forever" },
  { key: "COUNTDOWN.heading", section: "COUNTDOWN", label: "Wedding heading", fallbackText: "The Wedding" },
  { key: "COUNTDOWN.date", section: "COUNTDOWN", label: "Wedding date", dynamic: true },

  { key: "TIMELINE.date", section: "TIMELINE", label: "Function date", dynamic: true },
  { key: "TIMELINE.name", section: "TIMELINE", label: "Function name", dynamic: true },
  { key: "TIMELINE.time", section: "TIMELINE", label: "Event time", dynamic: true },
  { key: "TIMELINE.venueName", section: "TIMELINE", label: "Event venue", dynamic: true },
  { key: "TIMELINE.tagline", section: "TIMELINE", label: "Function tagline", dynamic: true },

  { key: "GALLERY.eyebrow", section: "GALLERY", label: "Gallery eyebrow", fallbackText: "Our Story" },
  { key: "GALLERY.storyHeadline", section: "GALLERY", label: "Story heading", coreField: "storyHeadline" },

  { key: "VENUE.eyebrow", section: "VENUE", label: "Venue eyebrow", fallbackText: "Venue" },
  { key: "VENUE.name", section: "VENUE", label: "Venue name", dynamic: true },
  { key: "VENUE.address", section: "VENUE", label: "Venue address", dynamic: true },

  { key: "RSVP.eyebrow", section: "RSVP", label: "RSVP eyebrow", fallbackText: "RSVP" },
  { key: "RSVP.heading", section: "RSVP", label: "RSVP heading", fallbackText: "Will you join us?" },

  { key: "THANK_YOU.heading", section: "THANK_YOU", label: "Thank-you heading", fallbackText: "Thank You" },
  { key: "THANK_YOU.names", section: "THANK_YOU", label: "Couple names", dynamic: true },
  { key: "THANK_YOU.message", section: "THANK_YOU", label: "Thank-you message", coreField: "thankYou" },
];

export function elementsForSection(section: string) {
  if (isEventSection(section)) return THEME_ELEMENT_DEFINITIONS.filter((item) => item.section === "TIMELINE").map((item) => ({ ...item, section, key: item.key.replace("TIMELINE.", `${section}.`) }));
  const normalized = section === "STORY" ? "GALLERY" : section;
  return THEME_ELEMENT_DEFINITIONS.filter((item) => item.section === normalized);
}

export function definitionForElement(key: string) {
  return elementsForSection(key.split(".")[0]).find((item) => item.key === key);
}
