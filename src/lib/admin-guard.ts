import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  findGroupReference,
  isAdminGroup,
  type GroupReference,
} from "@/lib/user-groups";

/**
 * The one place that answers "is the caller an admin, right now?".
 *
 * Admin follows the user's **group** — membership of "Admin User" in the
 * `usergroups` collection — not a boolean on the account. The session
 * supplies only *who* is asking; what they may do is read from their record
 * on every request.
 *
 * Reading it every time is deliberate, in both directions. The role is
 * written into the session token once, at sign-in (`auth.config.ts`), and
 * sessions last a year (`auth.ts`), so a token outlives any change to the
 * record: a demotion would keep working until the cookie expired, and a
 * promotion would look like it never took until the user signed out. One
 * indexed lookup per admin request buys both.
 *
 * Deactivation outranks the group: an account switched off is not an admin,
 * whatever group it is in.
 */

export type AccessProfile = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  /** Resolved group name, or null when the account belongs to none. */
  group: string | null;
  /** Which document field the group came from — shown in the admin UI. */
  groupField: string | null;
  isAdmin: boolean;
  /**
   * True when admin came from the legacy `role` column rather than a group.
   * Surfaced so the users screen can point at accounts still to be moved
   * across; see `grantsAdminByLegacyRole` below for why the column is still
   * honoured at all.
   */
  viaLegacyRole: boolean;
};

export type AdminIdentity = { id: string; email: string; name: string | null };

/**
 * Whether `role: ADMIN` still grants admin on its own.
 *
 * It does, because switching the rule over is not instantaneous: until every
 * account has a group, dropping the column would lock out whoever had not
 * been migrated yet — including, quite possibly, the only person able to
 * assign the groups. Assigning a group writes `role` to match (see
 * `updateUserGroupAction`), so the two stay in step, and this can be turned
 * off with `ADMIN_LEGACY_ROLE=off` once the users screen shows no account
 * relying on it.
 */
function grantsAdminByLegacyRole(): boolean {
  return process.env.ADMIN_LEGACY_ROLE !== "off";
}

/**
 * The group named on a user's document, resolved to a name.
 *
 * The typed `userGroup` column is checked first. Failing that, the raw
 * document is read: this database is shared with an older app whose user
 * records name their group under their own field, and those accounts should
 * not have to be re-saved through this app before they can sign in as admins.
 * A uuid found either way is looked up in `usergroups`.
 */
async function resolveGroup(
  userId: string,
  typedGroup: string | null,
  typedUuid: string | null,
): Promise<{ group: string | null; field: string | null }> {
  if (typedGroup) return { group: typedGroup, field: "userGroup" };

  let reference: GroupReference | null = typedUuid
    ? { value: typedUuid, field: "userGroupUuid", kind: "uuid" }
    : null;

  if (!reference) {
    // `findRaw` rather than a typed query: the field is not in this schema,
    // so Prisma would not return it. Failure here is not fatal — an account
    // with no resolvable group is simply not an admin.
    try {
      const raw = (await db.user.findRaw({
        filter: { _id: { $oid: userId } },
        options: { limit: 1 },
      })) as unknown;
      const record = Array.isArray(raw) ? (raw[0] as Record<string, unknown>) : null;
      reference = findGroupReference(record);
    } catch {
      return { group: null, field: null };
    }
  }

  if (!reference) return { group: null, field: null };
  if (reference.kind === "name")
    return { group: reference.value, field: reference.field };

  const match = await db.userGroup
    .findFirst({ where: { uuid: reference.value }, select: { name: true } })
    .catch(() => null);
  return { group: match?.name ?? null, field: reference.field };
}

/** Everything access decisions need about the signed-in user, or null. */
export async function getAccessProfile(): Promise<AccessProfile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      userGroup: true,
      userGroupUuid: true,
    },
  });
  if (!user) return null;

  const { group, field } = await resolveGroup(
    user.id,
    user.userGroup,
    user.userGroupUuid,
  );

  const byGroup = isAdminGroup(group);
  const byRole = user.role === "ADMIN" && grantsAdminByLegacyRole();
  // Missing `isActive` means a document written before the column existed,
  // which is an active account rather than a deactivated one.
  const isActive = user.isActive !== false;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isActive,
    group,
    groupField: field,
    isAdmin: isActive && (byGroup || byRole),
    viaLegacyRole: byRole && !byGroup,
  };
}

export async function getAdmin(): Promise<AdminIdentity | null> {
  const profile = await getAccessProfile();
  if (!profile?.isAdmin) return null;
  return { id: profile.id, email: profile.email, name: profile.name };
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdmin()) !== null;
}
