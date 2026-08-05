import { describe, expect, it } from "vitest";

import { slugify, randomSuffix } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Meenal Avinash")).toBe("meenal-avinash");
  });

  it("strips punctuation", () => {
    expect(slugify("Priya & Rahul's Wedding!")).toBe("priya-rahuls-wedding");
  });

  it("collapses repeated whitespace and hyphens", () => {
    expect(slugify("A   B  --  C")).toBe("a-b-c");
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  padded  ")).toBe("padded");
  });
});

describe("randomSuffix", () => {
  it("defaults to a 5-character alphanumeric string", () => {
    const suffix = randomSuffix();
    expect(suffix).toMatch(/^[a-z0-9]{1,5}$/);
  });

  it("respects a custom length as an upper bound", () => {
    const suffix = randomSuffix(8);
    expect(suffix.length).toBeLessThanOrEqual(8);
  });
});
