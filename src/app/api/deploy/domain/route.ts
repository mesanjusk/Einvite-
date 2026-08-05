import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addCustomDomain, isVercelConfigured } from "@/lib/vercel";

const bodySchema = z.object({
  invitationId: z.string(),
  domain: z.string().min(3),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isVercelConfigured()) {
    return NextResponse.json(
      {
        error:
          "Custom domains aren't configured yet. Add VERCEL_API_TOKEN and VERCEL_PROJECT_ID to .env.",
      },
      { status: 501 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const invitation = await db.invitation.findUnique({
    where: { id: parsed.data.invitationId },
  });
  if (!invitation || invitation.userId !== session.user.id) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  try {
    await addCustomDomain(parsed.data.domain);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add domain" },
      { status: 500 },
    );
  }

  await db.deployment.upsert({
    where: { invitationId: parsed.data.invitationId },
    update: { customDomain: parsed.data.domain, status: "PENDING" },
    create: {
      invitationId: parsed.data.invitationId,
      customDomain: parsed.data.domain,
      status: "PENDING",
    },
  });

  return NextResponse.json({ success: true });
}
