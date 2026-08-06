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

export async function GET(request: NextRequest) {
  const expected = process.env.SEED_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "SEED_SECRET is not configured on this deployment." },
      { status: 503 },
    );
  }

  const provided = request.nextUrl.searchParams.get("secret") ?? "";
  if (!secretMatches(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSeed(db);
  return NextResponse.json({ success: true, seeded: result });
}
