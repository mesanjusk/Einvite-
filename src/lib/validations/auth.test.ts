import { describe, expect, it } from "vitest";

import { signUpSchema, signInSchema, magicLinkSchema } from "./auth";

describe("signUpSchema", () => {
  it("accepts a valid signup", () => {
    const result = signUpSchema.safeParse({
      name: "Priya Sharma",
      email: "priya@example.com",
      password: "SuperSecret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password missing an uppercase letter", () => {
    const result = signUpSchema.safeParse({
      name: "Priya Sharma",
      email: "priya@example.com",
      password: "supersecret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password missing a number", () => {
    const result = signUpSchema.safeParse({
      name: "Priya Sharma",
      email: "priya@example.com",
      password: "SuperSecretPass",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      name: "Priya Sharma",
      email: "priya@example.com",
      password: "Sup3rS",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      name: "Priya Sharma",
      email: "not-an-email",
      password: "SuperSecret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a one-character name", () => {
    const result = signUpSchema.safeParse({
      name: "P",
      email: "priya@example.com",
      password: "SuperSecret123",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts any non-empty password", () => {
    const result = signInSchema.safeParse({
      email: "priya@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({
      email: "priya@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("magicLinkSchema", () => {
  it("rejects a malformed email", () => {
    const result = magicLinkSchema.safeParse({ email: "nope" });
    expect(result.success).toBe(false);
  });
});
