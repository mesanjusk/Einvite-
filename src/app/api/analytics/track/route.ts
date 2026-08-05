import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const bodySchema = z.object({
  invitationId: z.string(),
  type: z.enum(["SHARE", "CLICK_MAPS", "CLICK_REGISTRY", "CLICK_INSTAGRAM"]),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db.analyticsEvent.create({
    data: { invitationId: parsed.data.invitationId, type: parsed.data.type },
  });

  return NextResponse.json({ success: true });
}
