import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { generateInvitationCopy } from "@/lib/ai/generate-copy";

const bodySchema = z.object({
  brideName: z.string().min(1),
  groomName: z.string().min(1),
  weddingDateDisplay: z.string().min(1),
  venueName: z.string().optional(),
  language: z.string().optional(),
  customMessage: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const copy = await generateInvitationCopy(parsed.data);
  return NextResponse.json(copy);
}
