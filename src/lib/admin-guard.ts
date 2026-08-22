import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * The one place that answers "is the caller an admin, right now?".
 *
 * The role is re-read from the record rather than trusted from the session.
 * Sessions here last a year (see `auth.ts`), so a token minted before a
 * demotion would otherwise keep admin rights for as long as the browser keeps
 * the cookie. One indexed lookup per admin request is a fair price for a
 * revocation that actually revokes.
 *
 * Deactivation counts as "not an admin" too: an account switched off should
 * lose the reports the same moment it loses everything else.
 */
export type AdminIdentity = { id: string; email: string; name: string | null };

export async function getAdmin(): Promise<AdminIdentity | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;

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
