/**
 * Who counts as an admin, decided by user group.
 *
 * The group names live in the `usergroups` collection the older app already
 * maintains — "Admin User", "Office Admin", "Office Design", "Vendor" and so
 * on. Admin access follows membership of that list rather than a boolean role
 * on the account, so the one place staff are organised is the same place
 * access comes from.
 *
 * Everything here is pure. The database side lives in `admin-guard.ts`.
 */

/** The group that grants admin. */
export const ADMIN_USER_GROUP = "Admin User";

/**
 * The eight groups the collection shipped with. Used only to keep the group
 * picker populated when the collection cannot be read (a fresh database, a
 * dropped connection) — never written, and never consulted for access.
 */
export const KNOWN_USER_GROUPS = [
  "Admin User",
  "Office Admin",
  "Office User",
  "Office Manage",
  "Office Design",
  "Office Marketing",
  "Other Office",
  "Vendor",
] as const;

/**
 * Group names that grant admin, from `ADMIN_USER_GROUPS` (comma-separated) or
 * just "Admin User".
 *
 * Note what is *not* here: "Office Admin" looks like an admin group and is
 * not one. Nothing is matched on the substring "admin" — a group called
 * "Admin Support" or "Vendor Admin" would otherwise quietly acquire the run
 * of the panel. Adding a second admin group is a deliberate act, done through
 * this variable.
 */
export function adminUserGroups(
  raw: string | undefined = process.env.ADMIN_USER_GROUPS,
): string[] {
  const configured = (raw ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : [ADMIN_USER_GROUP];
}

/**
 * Group names compare loosely on spacing and case — "admin user",
 * "Admin  User" and "ADMIN USER" are the same group. They are typed by hand
 * in two different systems, and a trailing space should not cost somebody
 * their access. Nothing looser than that: matching is still on the whole
 * name.
 */
function normalizeGroup(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isAdminGroup(
  group: string | null | undefined,
  allowed: string[] = adminUserGroups(),
): boolean {
  if (!group) return false;
  const normalized = normalizeGroup(group);
  return allowed.some((name) => normalizeGroup(name) === normalized);
}

/**
 * Field names a user's group may be stored under.
 *
 * `userGroup` is what this app writes. The rest are the shapes the older
 * Mongoose app used, kept because the two share a database and its records
 * were written before this field existed. Order is priority: the field this
 * app controls wins over anything inherited.
 */
export const GROUP_NAME_FIELDS = [
  "userGroup",
  "User_group",
  "user_group",
  "usergroup",
  "userGroupName",
  "group",
] as const;

/** The same, for records that reference a group by its uuid instead. */
export const GROUP_UUID_FIELDS = [
  "userGroupUuid",
  "User_group_uuid",
  "user_group_uuid",
  "usergroupuuid",
  "groupUuid",
] as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function looksLikeUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export type GroupReference = {
  /** The raw value found. */
  value: string;
  /** Which document field it came from — surfaced in the admin UI. */
  field: string;
  /** Whether it is a uuid needing a lookup, or already a name. */
  kind: "uuid" | "name";
};

function readString(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * The group a raw user document points at, whatever field it happens to use.
 *
 * A name found under any field beats a uuid found under any other: a name
 * needs no second query and no matching row in `usergroups` to be usable.
 * Returns null when the document names no group at all, which is a real
 * answer — an account with no group is not an admin.
 */
export function findGroupReference(
  record: Record<string, unknown> | null | undefined,
): GroupReference | null {
  if (!record) return null;

  for (const field of GROUP_NAME_FIELDS) {
    const value = readString(record, field);
    // A name field holding a uuid is still a uuid — the older app was not
    // always consistent about which column it filled.
    if (value) return { value, field, kind: looksLikeUuid(value) ? "uuid" : "name" };
  }

  for (const field of GROUP_UUID_FIELDS) {
    const value = readString(record, field);
    if (value) return { value, field, kind: looksLikeUuid(value) ? "uuid" : "name" };
  }

  return null;
}
