/**
 * Meta's `signed_request`, used by the deauthorize and data deletion
 * callbacks.
 *
 * The body is form-encoded with one field shaped `<signature>.<payload>`,
 * both base64url. The signature is HMAC-SHA256 of the *encoded* payload
 * string — not the decoded JSON — keyed with the app secret. Verifying it is
 * the only thing establishing that the request came from Meta rather than
 * from anyone who guessed the URL, which matters here because acting on it
 * deletes a user's invitation.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export type SignedRequestPayload = {
  user_id?: string;
  algorithm?: string;
  issued_at?: number;
};

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function parseSignedRequest(
  signedRequest: string | null | undefined,
  appSecret: string | undefined,
): SignedRequestPayload | null {
  if (!signedRequest || !appSecret) return null;

  const [encodedSignature, encodedPayload] = signedRequest.split(".");
  if (!encodedSignature || !encodedPayload) return null;

  const expected = createHmac("sha256", appSecret).update(encodedPayload).digest();
  const provided = base64UrlDecode(encodedSignature);

  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
    // Meta only ever signs these with HMAC-SHA256; anything else is either a
    // downgrade attempt or a format we have not been told how to verify.
    if (
      payload?.algorithm &&
      String(payload.algorithm).toUpperCase() !== "HMAC-SHA256"
    ) {
      return null;
    }
    return payload as SignedRequestPayload;
  } catch {
    return null;
  }
}
