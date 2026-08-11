import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { hashToken } from "@/lib/otp";
import { issueOwnerCookie } from "@/lib/guest-session";

// The "pre-logged" WhatsApp link: /e/<raw edit token>. Visiting it proves
// ownership of the linked phone number, so we set the long-lived owner
// cookie for this invitation and hand off to the guest management page.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const editTokenHash = hashToken(token);

  const phoneLink = await db.phoneLink.findUnique({ where: { editTokenHash } });
  if (!phoneLink) {
    return NextResponse.redirect(new URL("/?editLink=invalid", request.url));
  }

  await issueOwnerCookie(phoneLink.invitationId, token);

  return NextResponse.redirect(new URL(`/manage/${phoneLink.invitationId}`, request.url));
}
