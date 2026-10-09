import { describe, expect, it } from "vitest";
import { instagramValidationEnabled } from "./instagram-validation";

describe("Instagram publication validation policy", () => {
  it("is paused by default while keeping the code available", () => {
    expect(instagramValidationEnabled(undefined)).toBe(false);
    expect(instagramValidationEnabled("false")).toBe(false);
    expect(instagramValidationEnabled("")).toBe(false);
  });

  it("only turns on for an explicit server-side opt-in", () => {
    expect(instagramValidationEnabled("true")).toBe(true);
    expect(instagramValidationEnabled("TRUE")).toBe(false);
    expect(instagramValidationEnabled("1")).toBe(false);
  });
});
