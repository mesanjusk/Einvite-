import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the Auth.js config — no Prisma adapter, no bcrypt.
 * Used directly by middleware.ts (Edge runtime). The full config in
 * auth.ts spreads this and adds the database-backed pieces for
 * everywhere else (Node runtime: route handlers, server actions, RSCs).
 */
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "USER" | "ADMIN" }).role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
