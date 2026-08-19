// Syncs prisma/schema.prisma to the database during the Vercel build.
//
// MongoDB has no migrations — `prisma db push` exists only to reconcile
// indexes, since collections and fields are created lazily on first write.
// Running it here means the unique constraints that enforce our business
// rules (one phone number owns one invitation; one Instagram account owns
// one invitation; a colourway slug is unique within its theme) exist without
// anyone having to run a command from a laptop.
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
const repairEnabled = process.env.DB_REPAIR_DUPLICATES === "1";

const log = (message) => console.log(`[db-sync] ${message}`);
const warn = (message) => console.warn(`[db-sync] WARNING: ${message}`);

// Every unique constraint in schema.prisma, as (collection, key fields).
// Prisma builds all of these in a single batch, so one pre-existing duplicate
// row anywhere in this list aborts the whole push and leaves every other
// index uncreated. Scanning the lot in one pass turns what would be a deploy
// per collision into a single report.
const UNIQUE_CONSTRAINTS = [
  { collection: "users", keys: ["email"] },
  { collection: "invitations", keys: ["slug"] },
  { collection: "themes", keys: ["slug"] },
  { collection: "templates", keys: ["slug"] },
  { collection: "video_templates", keys: ["slug"] },
  { collection: "theme_colorways", keys: ["themeId", "slug"] },
  { collection: "phone_links", keys: ["phone"] },
  { collection: "phone_links", keys: ["invitationId"] },
  { collection: "phone_links", keys: ["editTokenHash"] },
  { collection: "instagram_links", keys: ["igUserId"] },
  { collection: "instagram_links", keys: ["invitationId"] },
  { collection: "instagram_links", keys: ["editTokenHash"] },
  { collection: "instagram_automations", keys: ["mediaId"] },
  { collection: "instagram_leads", keys: ["igUserId", "automationId"] },
  { collection: "instagram_profiles", keys: ["igUserId"] },
  { collection: "deployments", keys: ["invitationId"] },
  { collection: "guests", keys: ["inviteToken"] },
  { collection: "rsvps", keys: ["guestId"] },
];

// Identifiers worth keeping out of a build log even though it is not public.
const SECRET_KEYS = new Set(["phone", "email", "editTokenHash", "inviteToken"]);

function maskValue(key, value) {
  if (value === null || value === undefined) return "(missing)";
  const text = String(value);
  if (!SECRET_KEYS.has(key)) return text;
  if (text.length <= 4) return "•".repeat(text.length);
  return `${text.slice(0, 2)}${"•".repeat(Math.max(text.length - 6, 3))}${text.slice(-4)}`;
}

function describeGroup(keys, groupId) {
  return keys.map((key) => `${key}=${maskValue(key, groupId?.[key])}`).join(", ");
}

function runPush() {
  const result = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
    encoding: "utf8",
    timeout: 120_000,
  });

  // Prisma writes progress to stderr even on success, so both streams are
  // echoed under the tag rather than judged by which one they arrived on.
  for (const stream of [result.stdout, result.stderr]) {
    if (stream?.trim()) for (const line of stream.trimEnd().split("\n")) log(line);
  }

  if (result.error) {
    return { ok: false, reason: `could not run prisma — ${result.error.message}` };
  }
  if (result.status !== 0) {
    return { ok: false, reason: `prisma db push exited with code ${result.status}` };
  }
  return { ok: true };
}

async function findDuplicates(prisma) {
  const found = [];

  for (const { collection, keys } of UNIQUE_CONSTRAINTS) {
    let batch;
    try {
      const response = await prisma.$runCommandRaw({
        aggregate: collection,
        pipeline: [
          {
            $group: {
              _id: Object.fromEntries(keys.map((k) => [k, `$${k}`])),
              ids: { $push: "$_id" },
            },
          },
          { $match: { "ids.1": { $exists: true } } },
          { $limit: 25 },
        ],
        cursor: {},
      });
      batch = response?.cursor?.firstBatch ?? [];
    } catch {
      // A collection that does not exist yet cannot hold duplicates.
      continue;
    }

    for (const group of batch) {
      found.push({
        collection,
        keys,
        label: describeGroup(keys, group._id),
        ids: group.ids.map((id) => id?.$oid ?? String(id)),
      });
    }
  }

  return found;
}

// Which row survives. A link pointing at a published invitation is the one
// the couple is actually using, so it outranks a half-finished draft no
// matter which was created first; the newest row wins any remaining tie,
// since MongoDB ObjectIds lead with a creation timestamp.
async function chooseSurvivor(prisma, collection, ids) {
  if (collection === "phone_links" || collection === "instagram_links") {
    const links = await prisma.$runCommandRaw({
      find: collection,
      filter: { _id: { $in: ids.map((id) => ({ $oid: id })) } },
      projection: { invitationId: 1 },
    });

    const rows = links?.cursor?.firstBatch ?? [];
    const invitationIds = rows.map((row) => row.invitationId?.$oid).filter(Boolean);
    const published = await prisma.invitation.findMany({
      where: { id: { in: invitationIds }, status: "PUBLISHED" },
      select: { id: true },
    });

    const publishedIds = new Set(published.map((invitation) => invitation.id));
    const keeper = rows.find((row) => publishedIds.has(row.invitationId?.$oid));
    if (keeper) return keeper._id?.$oid ?? String(keeper._id);
  }

  return [...ids].sort().at(-1);
}

async function repair(prisma, duplicates) {
  let deleted = 0;

  for (const duplicate of duplicates) {
    const survivor = await chooseSurvivor(prisma, duplicate.collection, duplicate.ids);
    const doomed = duplicate.ids.filter((id) => id !== survivor);
    if (doomed.length === 0) continue;

    log(`repairing ${duplicate.collection} (${duplicate.label}) — keeping ${survivor}`);
    for (const id of doomed) log(`  deleting ${duplicate.collection} row ${id}`);

    await prisma.$runCommandRaw({
      delete: duplicate.collection,
      deletes: doomed.map((id) => ({ q: { _id: { $oid: id } }, limit: 1 })),
    });
    deleted += doomed.length;
  }

  return deleted;
}

async function main() {
  if (!forced && !isProduction) {
    log(
      `skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}); set DB_PUSH_ON_BUILD=1 to force`,
    );
    return;
  }

  if (!process.env.DATABASE_URL) {
    warn("DATABASE_URL is not set in the build environment — indexes are NOT synced");
    return;
  }

  log("syncing indexes with prisma db push…");
  if (runPush().ok) {
    log("done — indexes are in sync");
    return;
  }

  warn("push failed — scanning for rows that violate a unique constraint");

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const duplicates = await findDuplicates(prisma);

    if (duplicates.length === 0) {
      warn("no duplicate rows found — the push failed for some other reason (see above)");
      return;
    }

    log(`found ${duplicates.length} group(s) of rows that collide on a unique constraint:`);
    for (const duplicate of duplicates) {
      log(`  ${duplicate.collection}: ${duplicate.label} — ${duplicate.ids.length} rows`);
      for (const id of duplicate.ids) log(`    ${id}`);
    }

    if (!repairEnabled) {
      warn("indexes are NOT synced. These rows must go before the index can build.");
      warn("Set DB_REPAIR_DUPLICATES=1 in Vercel and redeploy to delete the extras,");
      warn("keeping the row attached to the published invitation in each group.");
      return;
    }

    const deleted = await repair(prisma, duplicates);
    log(`deleted ${deleted} duplicate row(s) — retrying the push`);

    if (runPush().ok) {
      log("done — indexes are in sync. Remove DB_REPAIR_DUPLICATES from Vercel now.");
    } else {
      warn("push still failing after the repair — see the prisma output above");
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Nothing here is worth failing a build over, including a bug in this script.
main()
  .catch((error) => warn(`index sync crashed — ${error?.stack ?? error}`))
  .finally(() => process.exit(0));
