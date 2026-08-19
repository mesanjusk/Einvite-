/**
 * Ceremony presets by tradition. Asking for religion first lets the wizard
 * open the events step already filled with the rituals that tradition
 * actually observes, instead of an empty "Add event" button.
 *
 * These are starting points, not rules — every name, date, and entry stays
 * editable, and couples routinely add or drop ceremonies. Regional and family
 * practice varies enormously within each tradition.
 */
export const RELIGIONS = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Jain",
  "Buddhist",
  "Other",
] as const;

export type Religion = (typeof RELIGIONS)[number];

const PRESETS: Record<Religion, string[]> = {
  Hindu: ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"],
  Muslim: ["Mehendi", "Nikah", "Walima"],
  Christian: ["Engagement", "Wedding Ceremony", "Reception"],
  Sikh: ["Mehendi", "Anand Karaj", "Reception"],
  Jain: ["Mehendi", "Sangeet", "Wedding", "Reception"],
  Buddhist: ["Wedding Ceremony", "Reception"],
  Other: ["Wedding", "Reception"],
};

export function isReligion(value: string | null | undefined): value is Religion {
  return Boolean(value) && (RELIGIONS as readonly string[]).includes(value as string);
}

/** Ceremony names to pre-fill for a tradition; empty for anything unrecognised. */
export function ceremonyNamesFor(religion: string | null | undefined): string[] {
  return isReligion(religion) ? PRESETS[religion] : [];
}
