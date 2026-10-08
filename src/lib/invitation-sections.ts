export const EVENT_SECTION_NAMES: Record<string, string> = { SANGEET: "Sangeet", MEHENDI: "Mehendi", HALDI: "Haldi", WEDDING: "Wedding", PHERAS: "Pheras", RECEPTION: "Reception" };
export function isEventSection(type: string) { return type in EVENT_SECTION_NAMES || /^EVENT_[a-z0-9-]+$/.test(type); }
export function eventSectionName(type: string) { return EVENT_SECTION_NAMES[type] ?? type.replace(/^EVENT_/, "").split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" "); }
export function eventSectionType(name: string) {
  const known = Object.entries(EVENT_SECTION_NAMES).find(([, label]) => label.toLowerCase() === name.trim().toLowerCase());
  return known?.[0] ?? `EVENT_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ceremony"}`;
}
export type InvitationSection = { id: string; type: string; visible: boolean; locked: boolean; order: number; title?: string; eventId?: string; inheritType?: string };
/** Legacy grouped event sections become independent entries without changing event data. */
export function independentSections<T extends InvitationSection>(sections: T[], events: Array<{ id: string; name: string }>): T[] {
  const explicit = new Set(sections.filter((section) => isEventSection(section.type)).map((section) => section.eventId ?? events.find((event) => event.name.toLowerCase() === (section.title ?? eventSectionName(section.type)).toLowerCase())?.id));
  const usedTypes = new Set(sections.filter((section) => section.type !== "TIMELINE").map((section) => section.type));
  return [...sections].sort((a, b) => a.order - b.order).flatMap((section) => {
    if (section.type === "TIMELINE" && events.length) return events.filter((event) => !explicit.has(event.id)).map((event) => { let type = eventSectionType(event.name); if (usedTypes.has(type)) type = `EVENT_${event.id}`; usedTypes.add(type); return { ...section, id: `${section.id}:${event.id}`, type, title: event.name, eventId: event.id, inheritType: "TIMELINE" }; });
    if (isEventSection(section.type) && !section.eventId) {
      const event = events.find((item) => item.name.toLowerCase() === (section.title ?? eventSectionName(section.type)).toLowerCase());
      return [{ ...section, ...(event && { eventId: event.id }) }];
    }
    return [section];
  }).map((section, order) => ({ ...section, order })) as T[];
}
export function independentThemeOrder(order: string[], names: string[]) {
  return Array.from(new Set(order.flatMap((type) => type === "TIMELINE" ? names.map(eventSectionType) : [type])));
}
export const SECTION_GROUPS = [
  { name: "Opening & invitation", types: ["ENVELOPE", "HERO", "COUNTDOWN"] },
  { name: "Events & ceremonies", types: Object.keys(EVENT_SECTION_NAMES) },
  { name: "Photos & story", types: ["GALLERY", "STORY"] },
  { name: "Venue & guest response", types: ["VENUE", "RSVP", "THANK_YOU"] },
];
