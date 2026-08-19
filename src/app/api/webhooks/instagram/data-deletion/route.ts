/**
 * Meta's Data Deletion Request callback.
 *
 * Meta requires a JSON reply carrying a status URL and a confirmation code
 * the user can quote back. Deletion here is synchronous, so the code is
 * derived from the Instagram user id rather than tracking a pending job —
 * by the time this responds there is nothing left to track.
 */

import { createHash } from "node:crypto";

import { getAppUrl } from "@/lib/app-url";
import { parseSignedRequest } from "@/lib/meta-signed-request";
import { deleteInstagramUserData } from "@/lib/instagram-data-deletion";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const signedRequest = form?.get("signed_request");

  const payload = parseSignedRequest(
    typeof signedRequest === "string" ? signedRequest : null,
    process.env.META_APP_SECRET,
  );

  if (!payload?.user_id) {
    return Response.json({ error: "Invalid signed request" }, { status: 400 });
  }

  // Derived from the id rather than random so a user who asks twice is
  // quoted the same code, and hashed so the code does not leak the id.
  const confirmationCode = createHash("sha256")
    .update(`instagram:${payload.user_id}`)
    .digest("hex")
    .slice(0, 16);

  try {
    const summary = await deleteInstagramUserData(payload.user_id);
    console.log(
      `Instagram data deletion ${confirmationCode} — erased:`,
      JSON.stringify(summary),
    );
  } catch (error) {
    console.error("Failed to erase data on deletion request", error);
    return Response.json({ error: "Deletion failed" }, { status: 500 });
  }

  return Response.json({
    url: `${getAppUrl()}/data-deletion?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
