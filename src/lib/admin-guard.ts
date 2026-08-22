import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * The one place that answers "is the caller an admin, right now?".
 *
 * The session supplies only *who* is asking. Whether they are an admin comes
 * from their record, every time — the role stamped into the session is not
 * consulted at all.
 *
 * That is deliberate in both directions, and getting only one of them right
 * is what made this worth centralising. Sessions here last a year (see
 * `auth.ts`) and the role is written into the token only at sign-in
 * (`auth.config.ts`), so a token outlives any change to the record:
 *
 *   - Demotion: a token minted while they were an admin would keep admin
 *     rights until the cookie expired.
 *   - Promotion: an account switched to ADMIN in the database stays locked
 *     out until it signs out and back in — which looks exactly like the
 *     change never took.
 *
 * One indexed lookup per admin request buys both. Deactivation counts as
 * "not an admin" too: an account switched off loses the reports the same
 * moment it loses everything else.
 */
export type AdminIdentity = { id: string; email: string; name: string | null };

export async function getAdmin(): Promise<AdminIdentity | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user || user.role !== "ADMIN" || user.isActive === false) return null;

  return { id: user.id, email: user.email, name: user.name };
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdmin()) !== null;
}
