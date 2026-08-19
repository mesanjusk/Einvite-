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
//
// A failed push never fails the build. Indexes are a hardening step, not a
// precondition for the app to run — every query works without them, they
// only stop two concurrent writes from both winning. Blocking a deploy on
// a database that happens to be unreachable from a build container would
// trade a small correctness gap for total inability to ship. The failure is
// logged loudly instead; search the build log for "[db-sync]".

import { spawnSync } from "node:child_process";

const forced = process.env.DB_PUSH_ON_BUILD === "1";
const isProduction = process.env.VERCEL_ENV === "production";

function warn(message) {
  console.warn(`[db-sync] WARNING: ${message}`);
  console.warn(
    "[db-sync] indexes are NOT synced — run `npx prisma db push` when you can",
  );
}

if (!forced && !isProduction) {
  console.log(
    `[db-sync] skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}); set DB_PUSH_ON_BUILD=1 to force`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  warn("DATABASE_URL is not set in the build environment");
  process.exit(0);
}

console.log("[db-sync] syncing indexes with prisma db push…");

const result = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  encoding: "utf8",
  timeout: 120_000,
});

// Prisma writes progress to stderr even on success, so both streams are
// echoed under the tag rather than judged by which one they arrived on.
for (const stream of [result.stdout, result.stderr]) {
  if (stream?.trim()) {
    for (const line of stream.trimEnd().split("\n")) console.log(`[db-sync] ${line}`);
  }
}

if (result.error) {
  warn(`could not run prisma — ${result.error.message}`);
} else if (result.status !== 0) {
  warn(`prisma db push exited with code ${result.status}`);
} else {
  console.log("[db-sync] done — indexes are in sync");
}

process.exit(0);
