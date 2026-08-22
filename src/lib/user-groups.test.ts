import { describe, expect, it } from "vitest";

import {
  ADMIN_USER_GROUP,
  adminUserGroups,
  findGroupReference,
  isAdminGroup,
  looksLikeUuid,
} from "./user-groups";

describe("adminUserGroups", () => {
  it('defaults to "Admin User" alone', () => {
    expect(adminUserGroups(undefined)).toEqual([ADMIN_USER_GROUP]);
    expect(adminUserGroups("")).toEqual([ADMIN_USER_GROUP]);
    expect(adminUserGroups("  ,  ")).toEqual([ADMIN_USER_GROUP]);
  });

  it("takes a comma-separated override", () => {
    expect(adminUserGroups("Admin User, Office Admin")).toEqual([
      "Admin User",
      "Office Admin",
    ]);
  });
});

describe("isAdminGroup", () => {
  it("grants the admin group", () => {
    expect(isAdminGroup("Admin User")).toBe(true);
  });

  it("forgives spacing and case", () => {
    // The name is typed by hand in two systems; a trailing space should not
    // cost somebody their access.
    expect(isAdminGroup("  admin user  ")).toBe(true);
    expect(isAdminGroup("ADMIN  USER")).toBe(true);
  });

  it("does not grant every group with 'admin' in the name", () => {
    // The real collection has "Office Admin", which is not an admin group.
    // Substring matching here would hand the panel to a whole department.
    expect(isAdminGroup("Office Admin")).toBe(false);
    expect(isAdminGroup("Admin Support")).toBe(false);
    expect(isAdminGroup("Vendor Admin")).toBe(false);
  });

  it("refuses the other real groups", () => {
    for (const group of [
      "Office User",
      "Vendor",
      "Other Office",
      "Office Design",
      "Office Manage",
      "Office Marketing",
    ]) {
      expect(isAdminGroup(group), group).toBe(false);
    }
  });

  it("treats no group as not an admin", () => {
    expect(isAdminGroup(null)).toBe(false);
    expect(isAdminGroup(undefined)).toBe(false);
    expect(isAdminGroup("")).toBe(false);
  });

  it("honours a configured second admin group", () => {
    const allowed = ["Admin User", "Office Admin"];
    expect(isAdminGroup("Office Admin", allowed)).toBe(true);
    expect(isAdminGroup("Vendor", allowed)).toBe(false);
  });
});

describe("looksLikeUuid", () => {
  it("recognises the uuids the collection uses", () => {
    expect(looksLikeUuid("66a865ef-3984-4b8f-8e71-60a0e1b1a563")).toBe(true);
  });

  it("does not mistake a group name for one", () => {
    expect(looksLikeUuid("Admin User")).toBe(false);
    expect(looksLikeUuid("66bc9ac8cf6411fe4a69d4cc")).toBe(false); // an ObjectId
  });
});

describe("findGroupReference", () => {
  it("reads this app's own field first", () => {
    expect(
      findGroupReference({ userGroup: "Admin User", User_group: "Vendor" }),
    ).toEqual({
      value: "Admin User",
      field: "userGroup",
      kind: "name",
    });
  });

  it("falls back to the older app's field names", () => {
    // Records written by the Mongoose app name their group this way, and
    // should not have to be re-saved through this app to work.
    expect(findGroupReference({ User_group: "Admin User" })).toEqual({
      value: "Admin User",
      field: "User_group",
      kind: "name",
    });
    expect(findGroupReference({ user_group: "Vendor" })?.value).toBe("Vendor");
  });

  it("prefers any name over any uuid", () => {
    const found = findGroupReference({
      User_group_uuid: "66a865ef-3984-4b8f-8e71-60a0e1b1a563",
      User_group: "Admin User",
    });
    expect(found).toMatchObject({ value: "Admin User", kind: "name" });
  });

  it("reports a uuid so the caller knows to look it up", () => {
    expect(
      findGroupReference({ User_group_uuid: "66a865ef-3984-4b8f-8e71-60a0e1b1a563" }),
    ).toEqual({
      value: "66a865ef-3984-4b8f-8e71-60a0e1b1a563",
      field: "User_group_uuid",
      kind: "uuid",
    });
  });

  it("spots a uuid stored in a name field", () => {
    // The older app was not always consistent about which column it filled.
    expect(
      findGroupReference({ User_group: "66a865ef-3984-4b8f-8e71-60a0e1b1a563" }),
    ).toEqual({
      value: "66a865ef-3984-4b8f-8e71-60a0e1b1a563",
      field: "User_group",
      kind: "uuid",
    });
  });

  it("ignores blank and non-string values", () => {
    expect(findGroupReference({ userGroup: "   ", User_group: "" })).toBeNull();
    expect(findGroupReference({ userGroup: 42, User_group: null })).toBeNull();
    expect(findGroupReference({})).toBeNull();
    expect(findGroupReference(null)).toBeNull();
  });
});
