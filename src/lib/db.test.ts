import { afterEach, describe, expect, it, vi } from "vitest";

describe("db (unconfigured DATABASE_URL)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not throw on import when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(import("./db")).resolves.toBeDefined();
  });

  it("rejects (rather than throws synchronously) when a query is awaited", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { db } = await import("./db");

    await expect(db.theme.findMany()).rejects.toThrow(/DATABASE_URL is not set/);
  });

  it("is catchable via a .catch() chain, not just try/catch", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { db } = await import("./db");

    const result = await db.invitation.findMany().catch(() => "fallback");
    expect(result).toBe("fallback");
  });

  it("rejects direct client methods too, not just model delegates", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { db } = await import("./db");

    await expect(db.$connect()).rejects.toThrow(/DATABASE_URL is not set/);
  });
});
