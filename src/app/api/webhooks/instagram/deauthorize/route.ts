/**
 * Meta's Deauthorize callback: fires when someone disconnects the app from
 * their Instagram account. Treated as a deletion request — once they have
 * cut us off, keeping their invitation and comment history is exactly the
 * data we told them we would not keep.
 */

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
    return new Response(null, { status: 400 });
  }

  try {
    const summary = await deleteInstagramUserData(payload.user_id);
    console.log("Instagram deauthorize — erased user data:", JSON.stringify(summary));
  } catch (error) {
    console.error("Failed to erase data on deauthorize", error);
    // Meta retries on a 5xx, which is what we want: the user asked to be
    // forgotten and a transient database failure must not end that quietly.
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 200 });
}
