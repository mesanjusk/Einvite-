import { timingSafeEqual } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { runSeed } from "@/lib/run-seed";

function secretMatches(provided: string, expected: string) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// No auth is required for the normal path: this only ever writes when the
// theme collection is empty, so the first visitor seeds the database and
// every visitor after that gets a no-op. SEED_SECRET is an optional escape
// hatch for deliberately re-running the seed later (e.g. after editing
// src/lib/seed-data.ts) once the database is no longer empty.
export async function GET(request: NextRequest) {
  const existingThemes = await db.theme.count();

  if (existingThemes > 0) {
    const secret = process.env.SEED_SECRET;
    const provided = request.nextUrl.searchParams.get("secret") ?? "";
    const forced = Boolean(secret) && secretMatches(provided, secret!);

    if (!forced) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Database already has themes — nothing to do.",
      });
    }
  }

  const result = await runSeed(db);
  return NextResponse.json({ success: true, seeded: result });
}
