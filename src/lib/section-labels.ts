/**
 * User-facing names for invitation sections.
 *
 * Internal section keys stay stable because they are stored in existing
 * invitations/themes. Only visible labels use Indian celebration language.
 */
export const SECTION_DISPLAY_NAMES: Record<string, string> = {
  ENVELOPE: "Shubh Aarambh",
  HERO: "Mangal Aamantran",
  COUNTDOWN: "Shubh Muhurat",
  STORY: "Hamari Kahani",
  TIMELINE: "Rasmein & Utsav",
  GALLERY: "Yaadon Ki Jhalkiyan",
  VENUE: "Shubh Sthal",
  RSVP: "Aapki Upasthiti",
  REGISTRY: "Shagun",
  INSTAGRAM: "Utsav Updates",
  THANK_YOU: "Aabhar",
};

export function sectionDisplayName(section: string) {
  return SECTION_DISPLAY_NAMES[section] ?? section;
}
