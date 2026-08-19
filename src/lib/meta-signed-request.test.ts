import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { parseSignedRequest } from "./meta-signed-request";

const APP_SECRET = "test-app-secret";

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: object, secret = APP_SECRET) {
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest();
  return `${base64Url(signature)}.${encodedPayload}`;
}

describe("parseSignedRequest", () => {
  it("returns the payload when the signature matches", () => {
    const signed = sign({ user_id: "17841400000000000", algorithm: "HMAC-SHA256" });

    expect(parseSignedRequest(signed, APP_SECRET)?.user_id).toBe("17841400000000000");
  });

  it("rejects a payload signed with a different secret", () => {
    const signed = sign({ user_id: "17841400000000000" }, "not-the-app-secret");

    expect(parseSignedRequest(signed, APP_SECRET)).toBeNull();
  });

  // The signature covers the encoded payload, so editing the payload without
  // re-signing must not slip a different user id past the check.
  it("rejects a payload tampered with after signing", () => {
    const signed = sign({ user_id: "17841400000000000" });
    const [signature] = signed.split(".");
    const forged = `${signature}.${base64Url(JSON.stringify({ user_id: "999" }))}`;

    expect(parseSignedRequest(forged, APP_SECRET)).toBeNull();
  });

  it("rejects an algorithm other than HMAC-SHA256", () => {
    const signed = sign({ user_id: "17841400000000000", algorithm: "none" });

    expect(parseSignedRequest(signed, APP_SECRET)).toBeNull();
  });

  it("returns null for malformed, empty, or unconfigured input", () => {
    expect(parseSignedRequest("no-dot-separator", APP_SECRET)).toBeNull();
    expect(parseSignedRequest("", APP_SECRET)).toBeNull();
    expect(parseSignedRequest(null, APP_SECRET)).toBeNull();
    expect(parseSignedRequest(sign({ user_id: "1" }), undefined)).toBeNull();
  });
});
