import { describe, expect, it } from "vitest";
import { themeEventSections } from "./event-sections";
import { themeDecorAssetsSchema } from "./validations/admin";

describe("separate event sections", () => {
  it("retains backward compatibility and an explicitly empty event list", () => {
    expect(themeEventSections({})).toBeNull();
    expect(themeEventSections({ eventSections: [] })).toEqual([]);
  });
  it("keeps custom names and their order", () => {
    expect(themeEventSections({ eventSections: ["Sangeet", "Mehendi", "Pheras", "Our special ceremony"] })).toEqual(["Sangeet", "Mehendi", "Pheras", "Our special ceremony"]);
  });
  it("persists shapes and removes blank event editing lines", () => {
    const parsed = themeDecorAssetsSchema.parse({ eventSections: ["Sangeet", "", " Pheras "], sectionStyles: { COUNTDOWN: { scratchShape: "heart" } } });
    expect(parsed.eventSections).toEqual(["Sangeet", "Pheras"]);
    expect(parsed.sectionStyles.COUNTDOWN.scratchShape).toBe("heart");
    expect(themeDecorAssetsSchema.safeParse({ sectionStyles: { COUNTDOWN: { scratchShape: "bad" } } }).success).toBe(false);
  });
});
