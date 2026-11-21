import { describe, expect, it } from "vitest";

import { parseGuestCsv } from "@/lib/wedding-ops/csv";

describe("Wedding guest CSV import", () => {
  it("accepts Excel headers, quoted names and local Indian phone numbers", () => {
    const rows = parseGuestCsv(
      'Guest Name,Mobile,Group,Party Size,Events\n"Shah, Riya",9876543210,Bride side,3,"Haldi, Wedding"',
    );
    expect(rows).toEqual([expect.objectContaining({
      name: "Shah, Riya",
      phone: "+919876543210",
      group: "Bride side",
      expectedPartySize: 3,
      eventNames: "Haldi, Wedding",
    })]);
  });

  it("supports tab separated values and skips duplicate normalized numbers", () => {
    const rows = parseGuestCsv(
      "Name\tPhone\nA\t9876543210\nB\t+919876543210\nC\t9123456789",
    );
    expect(rows).toHaveLength(2);
  });

  it("rejects invalid numbers and missing names", () => {
    expect(() => parseGuestCsv("Name,Phone\nA,123")).toThrow("Invalid phone");
    expect(() => parseGuestCsv("Name,Phone\n,9876543210")).toThrow("name is missing");
  });

  it("rejects incomplete CSV files", () => {
    expect(() => parseGuestCsv("Phone\n9876543210")).toThrow("Name");
    expect(() => parseGuestCsv("Name,Phone")).toThrow("at least one guest");
  });
});
