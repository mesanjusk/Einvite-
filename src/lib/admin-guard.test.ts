import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findUnique = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: (args: unknown) => findUnique(args) } },
}));

const { getAdmin, isAdmin } = await import("./admin-guard");

const RECORD = {
  id: "u1",
  email: "owner@example.com",
  name: "Owner",
  role: "ADMIN" as const,
  isActive: true,
};

beforeEach(() => {
  auth.mockReset();
  findUnique.mockReset();
});

/** A signed-in session whose token claims `role`. */
function session(role: "USER" | "ADMIN", id = "u1") {
  auth.mockResolvedValue({ user: { id, role } });
}

describe("getAdmin", () => {
  it("grants on the record even when the session token still says USER", async () => {
    // The case that locked a real admin out of their own panel: the role is
    // stamped into the token at sign-in and the session lasts a year, so an
    // account promoted in the database carries a stale USER token until it
    // signs out. The record has to win, or the promotion looks like it never
    // took.
    session("USER");
    findUnique.mockResolvedValue(RECORD);

    expect(await getAdmin()).toEqual({
      id: "u1",
      email: "owner@example.com",
      name: "Owner",
    });
  });

  it("refuses on the record even when the session token still says ADMIN", async () => {
    // The mirror image: a token minted before a demotion must not keep
    // admin rights for the rest of the year.
    session("ADMIN");
    findUnique.mockResolvedValue({ ...RECORD, role: "USER" });

    expect(await getAdmin()).toBeNull();
  });

  it("refuses a deactivated admin", async () => {
    session("ADMIN");
    findUnique.mockResolvedValue({ ...RECORD, isActive: false });

    expect(await getAdmin()).toBeNull();
  });

  it("treats a missing isActive as active", async () => {
    // Documents written before the column existed have no value for it, and
    // they are not deactivated accounts.
    session("ADMIN");
    findUnique.mockResolvedValue({ ...RECORD, isActive: null });

    expect(await getAdmin()).not.toBeNull();
  });

  it("refuses when nobody is signed in", async () => {
    auth.mockResolvedValue(null);

    expect(await getAdmin()).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("refuses when the session's user no longer has a record", async () => {
    session("ADMIN");
    findUnique.mockResolvedValue(null);

    expect(await getAdmin()).toBeNull();
  });

  it("isAdmin is the same decision as a boolean", async () => {
    session("USER");
    findUnique.mockResolvedValue(RECORD);
    expect(await isAdmin()).toBe(true);

    findUnique.mockResolvedValue({ ...RECORD, role: "USER" });
    expect(await isAdmin()).toBe(false);
  });
});
