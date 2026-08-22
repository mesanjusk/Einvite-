import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

/**
 * Middleware answers one question — is anyone signed in? — and leaves the
 * rest to the layouts.
 *
 * It used to turn away non-admins from `/admin` as well, and that check was
 * the reason a genuine admin could be locked out of their own panel. This
 * runs on the Edge runtime with no database, so the only thing it can read is
 * the role stamped into the session cookie, and that role is written once at
 * sign-in (`auth.config.ts`) into a token that lasts a year (`auth.ts`).
 * Promote an account to ADMIN in the database and the cookie still says USER,
 * so the redirect fired before any page code could look at the record.
 *
 * Nothing is lost by dropping it: every `/admin` route renders under
 * `app/admin/layout.tsx`, which turns non-admins away after reading the
 * record, and every admin server action and API route calls `getAdmin()` for
 * itself. Those checks are both fresher and harder to route around than a
 * cookie inspection.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  if (!req.auth?.user) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
