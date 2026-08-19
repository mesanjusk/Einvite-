// Syncs prisma/schema.prisma to the database during the Vercel build.
//
// MongoDB has no migrations — `prisma db push` exists only to reconcile
// indexes, since collections and fields are created lazily on first write.
// Running it here means the unique constraints that enforce our business
// rules (one Instagram account owns one invitation; a colourway slug is
// unique within its theme) exist without anyone having to run a command
// from a laptop.
//
// It only runs on production builds. A preview branch may carry an older
// schema, and pushing that to the shared database would drop indexes the
// production schema still relies on. Set DB_PUSH_ON_BUILD=1 to force it.

import { spawnSync } from "node:child_process";

const forced = process.env.DB_PUSH_ON_BUILD === "1";
const isProduction = process.env.VERCEL_ENV === "production";

if (!forced && !isProduction) {
  console.log(
    `[db-sync] skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}); set DB_PUSH_ON_BUILD=1 to force`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("[db-sync] DATABASE_URL is not set — cannot sync indexes");
  process.exit(1);
}

console.log("[db-sync] syncing indexes with prisma db push…");
const result = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
});

if (result.status !== 0) {
  console.error("[db-sync] prisma db push failed — see the output above");
  process.exit(result.status ?? 1);
}

console.log("[db-sync] done");
