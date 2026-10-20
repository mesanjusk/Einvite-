import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED_ACTIONS = new Set([
  "REFERRAL_CLICK",
  "CLICK_INSTAGRAM",
  "PRINT_ENQUIRY",
  "STORY_SHARE",
]);

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host)
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (raw.length > 300) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  let data: { slug?: unknown; action?: unknown };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof data.slug !== "string" ||
      data.slug.length > 120 ||
      !/^[a-zA-Z0-9_-]+$/.test(data.slug) ||
      typeof data.action !== "string" ||
      !ALLOWED_ACTIONS.has(data.action))
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const invitation = await db.invitation.findUnique({
    where: { slug: data.slug },
    select: { id: true, status: true, isDemo: true },
  });
  if (!invitation || invitation.status !== "PUBLISHED" || invitation.isDemo)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await db.analyticsEvent.create({
      data: {
        invitationId: invitation.id,
        type: data.action as "REFERRAL_CLICK" | "CLICK_INSTAGRAM" | "PRINT_ENQUIRY" | "STORY_SHARE",
        path: `/invite/${data.slug}`,
      },
    });
  } catch (error) {
    console.error("[growth] Analytics write failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  return new NextResponse(null, { status: 204 });
}
