import { describe, expect, it } from "vitest";
import { independentSections, independentThemeOrder, type InvitationSection } from "./invitation-sections";
import { invitationSectionsSchema } from "./validations/invitation-sections";

const timeline: InvitationSection = { id: "events", type: "TIMELINE", visible: true, locked: false, order: 0 };
describe("independent ceremony sections", () => {
  it("migrates legacy events without dropping duplicate names or artwork inheritance", () => {
    const sections = independentSections([timeline], [{ id: "a", name: "Sangeet" }, { id: "b", name: "Sangeet" }, { id: "c", name: "Mehendi" }]);
    expect(sections.map((section) => section.eventId)).toEqual(["a", "b", "c"]);
    expect(new Set(sections.map((section) => section.type)).size).toBe(3);
    expect(sections.every((section) => section.inheritType === "TIMELINE")).toBe(true);
    expect(independentSections(sections, [{ id: "a", name: "Music night" }, { id: "b", name: "Sangeet" }, { id: "c", name: "Mehendi" }])).toEqual(sections);
  });
  it("does not duplicate ceremonies already configured independently", () => {
    const sections = independentSections([timeline, { ...timeline, id: "s", type: "SANGEET", order: 1 }], [{ id: "a", name: "Sangeet" }, { id: "b", name: "Haldi" }]);
    expect(sections.map((section) => section.eventId)).toEqual(["b", "a"]);
    expect(independentThemeOrder(["HERO", "TIMELINE", "VENUE"], ["Sangeet", "Mehendi", "Wedding"])).toEqual(["HERO", "SANGEET", "MEHENDI", "WEDDING", "VENUE"]);
  });
  it("validates section edits and rejects duplicate IDs or unknown section types", () => {
    expect(invitationSectionsSchema.safeParse([{ ...timeline, type: "PHERAS" }]).success).toBe(true);
    expect(invitationSectionsSchema.safeParse([{ ...timeline, type: "EVENT_family-dinner" }]).success).toBe(true);
    expect(invitationSectionsSchema.safeParse([timeline, timeline]).success).toBe(false);
    expect(invitationSectionsSchema.safeParse([{ ...timeline, type: "<script>" }]).success).toBe(false);
  });
});
