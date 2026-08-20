import { describe, expect, it } from "vitest";

import { eventCategoryFor } from "./event-categories";
import {
  defaultStepsFor,
  fieldLabel,
  resolveEventCategory,
  resolveFieldRules,
  resolveSteps,
  type EventCategoryOverride,
} from "./event-category-config";

const emptyOverride: EventCategoryOverride = {
  isEnabled: null,
  label: null,
  tagline: null,
  primaryNameLabel: null,
  secondaryNameLabel: null,
  secondaryOptional: null,
  joiner: null,
  dateLabel: null,
  eventsLabel: null,
  familyBrideLabel: null,
  familyGroomLabel: null,
  defaultEvents: [],
  familyRelations: [],
  steps: [],
  fields: null,
};

describe("resolveEventCategory", () => {
  it("changes nothing when the row is empty", () => {
    const base = eventCategoryFor("wedding");
    const resolved = resolveEventCategory("wedding", emptyOverride);

    expect(resolved.primaryNameLabel).toBe(base.primaryNameLabel);
    expect(resolved.defaultEvents).toEqual(base.defaultEvents);
    expect(resolved.steps).toEqual(defaultStepsFor("wedding"));
  });

  it("is identical with no row at all", () => {
    expect(resolveEventCategory("birthday", null).label).toBe(
      eventCategoryFor("birthday").label,
    );
  });

  it("lays admin wording over the catalogue", () => {
    const resolved = resolveEventCategory("wedding", {
      ...emptyOverride,
      primaryNameLabel: "Dulhan",
      defaultEvents: ["Haldi", "Sangeet"],
    });

    expect(resolved.primaryNameLabel).toBe("Dulhan");
    expect(resolved.defaultEvents).toEqual(["Haldi", "Sangeet"]);
    // Untouched fields still come from the catalogue.
    expect(resolved.secondaryNameLabel).toBe(
      eventCategoryFor("wedding").secondaryNameLabel,
    );
  });

  it("treats a cleared box as 'use the built-in wording'", () => {
    // Blank has to mean undo, or an admin who empties a field to reset it
    // ends up with a form asking for "".
    const resolved = resolveEventCategory("wedding", {
      ...emptyOverride,
      primaryNameLabel: "   ",
    });

    expect(resolved.primaryNameLabel).toBe(
      eventCategoryFor("wedding").primaryNameLabel,
    );
  });
});

describe("resolveSteps", () => {
  it("gives the wedding a culture step and nobody else", () => {
    expect(defaultStepsFor("wedding")).toContain("culture");
    expect(defaultStepsFor("housewarming")).not.toContain("culture");
  });

  it("keeps the stored set, in wizard order", () => {
    expect(resolveSteps("wedding", ["design", "names", "culture"])).toEqual([
      "culture",
      "names",
      "design",
      "review",
    ]);
  });

  it("puts the locked steps back if a row is missing them", () => {
    // A wizard with no Names step has nothing to save, so the stored list
    // cannot take them away however it was written.
    expect(resolveSteps("birthday", ["photos"])).toEqual(["names", "photos", "review"]);
  });

  it("reads an empty list as 'no override', never as 'no steps'", () => {
    expect(resolveSteps("wedding", [])).toEqual(defaultStepsFor("wedding"));
    expect(resolveSteps("wedding", null)).toEqual(defaultStepsFor("wedding"));
  });
});

describe("resolveFieldRules", () => {
  const wedding = eventCategoryFor("wedding");
  const birthday = eventCategoryFor("birthday");

  it("requires the second name for a couple and not for a host", () => {
    expect(resolveFieldRules(wedding, null).secondaryName.required).toBe(true);
    expect(resolveFieldRules(birthday, null).secondaryName.required).toBe(false);
  });

  it("starts sub-caste switched off", () => {
    expect(resolveFieldRules(wedding, null).subCaste.enabled).toBe(false);
  });

  it("takes the admin's switches", () => {
    const rules = resolveFieldRules(wedding, {
      subCaste: { enabled: true, required: true },
      venueName: { enabled: false },
    });

    expect(rules.subCaste).toMatchObject({ enabled: true, required: true });
    expect(rules.venueName.enabled).toBe(false);
  });

  it("won't let a locked field be switched off", () => {
    // The record cannot be written without a name, so this isn't an
    // editorial choice however the row was edited.
    const rules = resolveFieldRules(wedding, {
      primaryName: { enabled: false },
      eventDate: { enabled: false },
    });

    expect(rules.primaryName.enabled).toBe(true);
    expect(rules.eventDate.enabled).toBe(true);
  });

  it("falls back to the built-in label", () => {
    const rules = resolveFieldRules(wedding, { caste: { label: "Community" } });

    expect(fieldLabel(rules, "caste", "Caste")).toBe("Community");
    expect(fieldLabel(rules, "venueName", "Venue name")).toBe("Venue name");
  });
});
