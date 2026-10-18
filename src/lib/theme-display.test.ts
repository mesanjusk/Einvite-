import { describe, expect, it } from "vitest";

import {
  availableEventCategorySlugs,
  displayThemeName,
  displayThemeStyle,
} from "@/lib/theme-display";

describe("public theme labels", () => {
  it("gives legacy duplicate invitation titles distinct readable labels", () => {
    expect(displayThemeName("Traditionalinvitation", "traditionalinvitation")).toBe(
      "Traditional Invitation · Botanical",
    );
    expect(displayThemeName("Traditional Invitation", "traditional-invitation")).toBe(
      "Traditional Invitation · Palace",
    );
  });

  it("formats stored style slugs for people", () => {
    expect(displayThemeStyle("classic")).toBe("Classic");
    expect(displayThemeStyle("modern-minimal")).toBe("Modern Minimal");
  });

  it("returns only celebration categories backed by published themes", () => {
    expect(
      availableEventCategorySlugs([
        { eventCategory: "wedding", eventCategories: ["engagement", "not-a-category"] },
        { eventCategory: "birthday", eventCategories: [] },
      ]),
    ).toEqual(["wedding", "engagement", "birthday"]);
  });
});
