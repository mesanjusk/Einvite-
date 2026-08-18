import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { hashToken } from "@/lib/otp";
import { issueOwnerCookie } from "@/lib/guest-session";

// The "pre-logged" link: /e/<raw edit token>. Holding the token proves
// ownership — of the linked phone number (WhatsApp flow) or of the linked
// Instagram account (comment-to-DM flow) — so we set the long-lived owner
// cookie for this invitation and hand off to the guest management page.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const editTokenHash = hashToken(token);

  const [phoneLink, instagramLink] = await Promise.all([
    db.phoneLink.findUnique({ where: { editTokenHash } }),
    db.instagramLink.findUnique({ where: { editTokenHash } }),
  ]);

  const invitationId = phoneLink?.invitationId ?? instagramLink?.invitationId;
  if (!invitationId) {
    return NextResponse.redirect(new URL("/?editLink=invalid", request.url));
  }

  await issueOwnerCookie(invitationId, token);

  return NextResponse.redirect(new URL(`/manage/${invitationId}`, request.url));
}
