import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findUnique = vi.fn();
const findRaw = vi.fn();
const groupFindFirst = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: (args: unknown) => findUnique(args),
      findRaw: (args: unknown) => findRaw(args),
    },
    userGroup: { findFirst: (args: unknown) => groupFindFirst(args) },
  },
}));

const { getAccessProfile, getAdmin, isAdmin } = await import("./admin-guard");

const ADMIN_UUID = "66a865ef-3984-4b8f-8e71-60a0e1b1a563";

/** A user row as the typed query returns it. */
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "u1",
    email: "owner@example.com",
    name: "Owner",
    role: "USER" as const,
    isActive: true,
    userGroup: null,
    userGroupUuid: null,
    ...overrides,
  };
}

beforeEach(() => {
  auth.mockReset();
  findUnique.mockReset();
  findRaw.mockReset();
  groupFindFirst.mockReset();

  auth.mockResolvedValue({ user: { id: "u1", role: "USER" } });
  // No legacy fields on the document unless a test says otherwise.
  findRaw.mockResolvedValue([{ _id: "u1" }]);
  groupFindFirst.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAdmin — group is what grants access", () => {
  it('grants an account in the "Admin User" group', async () => {
    findUnique.mockResolvedValue(row({ userGroup: "Admin User" }));

    expect(await getAdmin()).toEqual({
      id: "u1",
      email: "owner@example.com",
      name: "Owner",
    });
  });

  it("refuses the other groups, including Office Admin", async () => {
    for (const group of ["Office Admin", "Office User", "Vendor", "Office Design"]) {
      findUnique.mockResolvedValue(row({ userGroup: group }));
      expect(await getAdmin(), group).toBeNull();
    }
  });

  it("refuses an account with no group at all", async () => {
    findUnique.mockResolvedValue(row());

    expect(await getAdmin()).toBeNull();
  });

  it("grants regardless of what the session token claims", async () => {
    // The session's role is written once at sign-in and lasts a year. The
    // record has to win, or a promotion looks like it never took.
    auth.mockResolvedValue({ user: { id: "u1", role: "USER" } });
    findUnique.mockResolvedValue(row({ userGroup: "Admin User" }));
    expect(await getAdmin()).not.toBeNull();

    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    findUnique.mockResolvedValue(row({ userGroup: "Vendor" }));
    expect(await getAdmin()).toBeNull();
  });
});

describe("getAdmin — records written by the older app", () => {
  it("reads a group from the legacy User_group field", async () => {
    findUnique.mockResolvedValue(row());
    findRaw.mockResolvedValue([{ _id: "u1", User_group: "Admin User" }]);

    const profile = await getAccessProfile();
    expect(profile?.isAdmin).toBe(true);
    expect(profile?.groupField).toBe("User_group");
  });

  it("resolves a group referenced by uuid", async () => {
    findUnique.mockResolvedValue(row({ userGroupUuid: ADMIN_UUID }));
    groupFindFirst.mockResolvedValue({ name: "Admin User" });

    expect(await getAdmin()).not.toBeNull();
    expect(groupFindFirst).toHaveBeenCalledWith({
      where: { uuid: ADMIN_UUID },
      select: { name: true },
    });
  });

  it("refuses when a uuid matches no group row", async () => {
    findUnique.mockResolvedValue(row({ userGroupUuid: ADMIN_UUID }));
    groupFindFirst.mockResolvedValue(null);

    expect(await getAdmin()).toBeNull();
  });

  it("does not read the raw document when the typed field is set", async () => {
    findUnique.mockResolvedValue(row({ userGroup: "Admin User" }));

    await getAdmin();
    expect(findRaw).not.toHaveBeenCalled();
  });

  it("survives a raw read that throws", async () => {
    // An unreadable document means "no group", not a 500 on every page.
    findUnique.mockResolvedValue(row());
    findRaw.mockRejectedValue(new Error("no such command"));

    expect(await getAdmin()).toBeNull();
  });
});

describe("getAdmin — the legacy role column", () => {
  it("still grants admin on its own, so nobody is locked out mid-migration", async () => {
    findUnique.mockResolvedValue(row({ role: "ADMIN" }));

    const profile = await getAccessProfile();
    expect(profile?.isAdmin).toBe(true);
    expect(profile?.viaLegacyRole).toBe(true);
  });

  it("stops granting once ADMIN_LEGACY_ROLE is off", async () => {
    vi.stubEnv("ADMIN_LEGACY_ROLE", "off");
    findUnique.mockResolvedValue(row({ role: "ADMIN" }));

    expect(await getAdmin()).toBeNull();
  });

  it("is not flagged as legacy when the group grants it anyway", async () => {
    findUnique.mockResolvedValue(row({ role: "ADMIN", userGroup: "Admin User" }));

    expect((await getAccessProfile())?.viaLegacyRole).toBe(false);
  });
});

describe("getAdmin — deactivation and absence", () => {
  it("refuses a deactivated account whatever its group", async () => {
    findUnique.mockResolvedValue(row({ userGroup: "Admin User", isActive: false }));

    const profile = await getAccessProfile();
    expect(profile?.isActive).toBe(false);
    expect(profile?.isAdmin).toBe(false);
  });

  it("treats a missing isActive as active", async () => {
    // Documents written before the column existed are not deactivated.
    findUnique.mockResolvedValue(row({ userGroup: "Admin User", isActive: null }));

    expect(await getAdmin()).not.toBeNull();
  });

  it("refuses when nobody is signed in", async () => {
    auth.mockResolvedValue(null);

    expect(await getAccessProfile()).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("refuses when the session's user has no record", async () => {
    findUnique.mockResolvedValue(null);

    expect(await getAdmin()).toBeNull();
  });

  it("isAdmin is the same decision as a boolean", async () => {
    findUnique.mockResolvedValue(row({ userGroup: "Admin User" }));
    expect(await isAdmin()).toBe(true);

    findUnique.mockResolvedValue(row({ userGroup: "Vendor" }));
    expect(await isAdmin()).toBe(false);
  });
});
