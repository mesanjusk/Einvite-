import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "sk-digital-invites",
      platform: process.env.VERCEL ? "vercel" : process.env.RENDER ? "render" : "node",
      commit:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.RENDER_GIT_COMMIT ??
        null,
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}
