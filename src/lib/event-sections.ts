export const EVENT_SECTION_PRESETS = ["Sangeet", "Mehendi", "Haldi", "Wedding", "Pheras", "Reception"] as const;

/** Theme defaults apply only to new drafts; existing invitation events stay intact. */
export function themeEventSections(decor: unknown): string[] | null {
  if (!decor || typeof decor !== "object" || !("eventSections" in decor)) return null;
  const value = (decor as { eventSections?: unknown }).eventSections;
  if (!Array.isArray(value)) return null;
  return value.filter((name): name is string => typeof name === "string" && !!name.trim()).map((name) => name.trim().slice(0, 100)).slice(0, 20);
}
