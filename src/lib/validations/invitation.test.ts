import { describe, expect, it } from "vitest";

import {
  invitationWizardSchema,
  rsvpSubmissionSchema,
  eventSchema,
  guestSchema,
} from "./invitation";

describe("eventSchema", () => {
  it("requires a name and date", () => {
    expect(eventSchema.safeParse({ name: "", date: "" }).success).toBe(false);
    expect(eventSchema.safeParse({ name: "Mehendi", date: "2026-12-10" }).success).toBe(
      true,
    );
  });

  it("rejects a malformed maps URL but allows an empty one", () => {
    expect(
      eventSchema.safeParse({ name: "Mehendi", date: "2026-12-10", googleMapsUrl: "nope" })
        .success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({ name: "Mehendi", date: "2026-12-10", googleMapsUrl: "" }).success,
    ).toBe(true);
  });
});

describe("invitationWizardSchema", () => {
  const base = {
    brideName: "Meenal",
    groomName: "Avinash",
    weddingDate: "2026-12-12",
    themeSlug: "royal",
  };

  it("accepts the minimum required fields and applies defaults", () => {
    const result = invitationWizardSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.events).toEqual([]);
      expect(result.data.useAiCopy).toBe(true);
    }
  });

  it("rejects a missing theme", () => {
    const result = invitationWizardSchema.safeParse({ ...base, themeSlug: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty bride or groom name", () => {
    expect(invitationWizardSchema.safeParse({ ...base, brideName: "" }).success).toBe(
      false,
    );
    expect(invitationWizardSchema.safeParse({ ...base, groomName: "" }).success).toBe(
      false,
    );
  });

  it("validates nested events", () => {
    const result = invitationWizardSchema.safeParse({
      ...base,
      events: [{ name: "Wedding", date: "2026-12-12" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid nested event", () => {
    const result = invitationWizardSchema.safeParse({
      ...base,
      events: [{ name: "", date: "" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("rsvpSubmissionSchema", () => {
  const base = {
    invitationId: "cabc123",
    guestName: "Rahul Verma",
    status: "ACCEPTED" as const,
  };

  it("defaults guestCount to 1 and coerces string input", () => {
    const result = rsvpSubmissionSchema.safeParse({ ...base, guestCount: "3" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.guestCount).toBe(3);

    const defaulted = rsvpSubmissionSchema.safeParse(base);
    expect(defaulted.success).toBe(true);
    if (defaulted.success) expect(defaulted.data.guestCount).toBe(1);
  });

  it("rejects a guest count above 20", () => {
    const result = rsvpSubmissionSchema.safeParse({ ...base, guestCount: 21 });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const result = rsvpSubmissionSchema.safeParse({ ...base, status: "UNSURE" });
    expect(result.success).toBe(false);
  });

  it("requires a guest name", () => {
    const result = rsvpSubmissionSchema.safeParse({ ...base, guestName: "" });
    expect(result.success).toBe(false);
  });
});

describe("guestSchema", () => {
  it("allows an empty email but rejects a malformed one", () => {
    expect(
      guestSchema.safeParse({ invitationId: "x", name: "Rahul", email: "" }).success,
    ).toBe(true);
    expect(
      guestSchema.safeParse({ invitationId: "x", name: "Rahul", email: "nope" }).success,
    ).toBe(false);
  });
});
