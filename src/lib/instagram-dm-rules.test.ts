import { describe, expect, it } from "vitest";

import { selectDmRule, type DmRuleLike } from "./instagram-dm-rules";

function rule(overrides: Partial<DmRuleLike> & { label?: string } = {}) {
  return {
    label: "rule",
    matchType: "CONTAINS" as const,
    keyword: "free",
    priority: 0,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

describe("selectDmRule", () => {
  it("returns null when nothing matches, so the DM goes unanswered", () => {
    // The whole point of the rules: an unrelated message is left for a human
    // instead of getting the one canned reply every DM used to receive.
    expect(selectDmRule([rule()], "do you ship to Pune?")).toBeNull();
  });

  it("matches CONTAINS anywhere, case- and space-insensitively", () => {
    expect(selectDmRule([rule()], "  Please send me the FREE link ")).not.toBeNull();
  });

  it("matches EXACT only on the whole message", () => {
    const rules = [rule({ matchType: "EXACT" })];
    expect(selectDmRule(rules, " FREE ")).not.toBeNull();
    expect(selectDmRule(rules, "free link please")).toBeNull();
  });

  it("matches STARTS_WITH only at the front", () => {
    const rules = [rule({ matchType: "STARTS_WITH" })];
    expect(selectDmRule(rules, "free link please")).not.toBeNull();
    expect(selectDmRule(rules, "please send free link")).toBeNull();
  });

  it("treats ANY as a catch-all that needs no keyword", () => {
    expect(
      selectDmRule([rule({ matchType: "ANY", keyword: null })], "anything"),
    ).not.toBeNull();
  });

  it("never matches a keyword-less rule that isn't ANY", () => {
    // A blank keyword on a CONTAINS rule would otherwise match every message,
    // which is exactly the behaviour being replaced.
    expect(selectDmRule([rule({ keyword: "   " })], "hello")).toBeNull();
  });

  it("ignores paused rules", () => {
    expect(selectDmRule([rule({ isActive: false })], "free")).toBeNull();
  });

  it("prefers the highest priority, and the oldest rule on a tie", () => {
    const catchAll = rule({
      matchType: "ANY",
      keyword: null,
      priority: 0,
      label: "catch-all",
    });
    const specific = rule({ priority: 10, label: "free" });
    expect(selectDmRule([catchAll, specific], "free please")?.label).toBe("free");

    const older = rule({ matchType: "ANY", keyword: null, label: "older" });
    const newer = rule({
      matchType: "ANY",
      keyword: null,
      label: "newer",
      createdAt: new Date("2025-01-01"),
    });
    expect(selectDmRule([newer, older], "hi")?.label).toBe("older");
  });

  it("ignores a blank message", () => {
    expect(selectDmRule([rule({ matchType: "ANY", keyword: null })], "   ")).toBeNull();
  });

  it("does not mutate the rules it was given", () => {
    const rules = [
      rule({ label: "a", priority: 0 }),
      rule({ label: "b", priority: 5 }),
    ];
    selectDmRule(rules, "free");
    expect(rules.map((r) => r.label)).toEqual(["a", "b"]);
  });
});
