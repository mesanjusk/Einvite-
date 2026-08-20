import { describe, expect, it } from "vitest";

import {
  EVENT_CATEGORIES,
  celebrantNames,
  eventCategoryFor,
  fillContent,
  isEventCategorySlug,
} from "./event-categories";

describe("eventCategoryFor", () => {
  it("returns the category for a known slug", () => {
    expect(eventCategoryFor("birthday").label).toBe("Birthday");
    expect(eventCategoryFor("baby-shower").label).toBe("Baby Shower");
  });

  it("falls back to the wedding category for anything unrecognised", () => {
    expect(eventCategoryFor("housewarming-party").slug).toBe("wedding");
    expect(eventCategoryFor(null).slug).toBe("wedding");
    expect(eventCategoryFor(undefined).slug).toBe("wedding");
  });
});

describe("isEventCategorySlug", () => {
  it("accepts only the known slugs", () => {
    expect(isEventCategorySlug("naming")).toBe(true);
    expect(isEventCategorySlug("Naming")).toBe(false);
    expect(isEventCategorySlug("")).toBe(false);
    expect(isEventCategorySlug(null)).toBe(false);
  });
});

describe("celebrantNames", () => {
  it("joins both names with the category's joiner", () => {
    expect(celebrantNames(eventCategoryFor("wedding"), "Aisha", "Rohan")).toBe(
      "Aisha & Rohan",
    );
    expect(celebrantNames(eventCategoryFor("birthday"), "Aarav", "The Shahs")).toBe(
      "Aarav · The Shahs",
    );
  });

  it("drops the joiner when a name slot is empty", () => {
    const birthday = eventCategoryFor("birthday");
    expect(celebrantNames(birthday, "Aarav", "")).toBe("Aarav");
    expect(celebrantNames(birthday, "Aarav", null)).toBe("Aarav");
    expect(celebrantNames(birthday, "  Aarav  ", "   ")).toBe("Aarav");
    expect(celebrantNames(birthday, "", "The Shahs")).toBe("The Shahs");
  });
});

describe("fillContent", () => {
  const values = {
    names: "Aisha & Rohan",
    date: "12 December 2026",
    venue: "The Grand Palace",
  };

  it("fills every slot", () => {
    const filled = fillContent("{names} on {date}.{venue}", values);
    expect(filled).toBe(
      "Aisha & Rohan on 12 December 2026. We'll be at The Grand Palace.",
    );
  });

  it("leaves nothing behind when there is no venue", () => {
    const filled = fillContent("{names} on {date}.{venue}", { ...values, venue: null });
    expect(filled).toBe("Aisha & Rohan on 12 December 2026.");
    expect(filled).not.toContain("{");
  });
});

describe("the category catalogue", () => {
  it("covers every celebration with usable copy", () => {
    expect(EVENT_CATEGORIES).toHaveLength(8);
    for (const category of EVENT_CATEGORIES) {
      expect(category.defaultEvents.length).toBeGreaterThan(0);
      expect(category.familyRelations.length).toBeGreaterThan(1);
      expect(category.content.invitationLetter).toContain("{names}");
      expect(category.content.eyebrow).toBeTruthy();
      expect(category.content.thankYou).toBeTruthy();
    }
  });
});
