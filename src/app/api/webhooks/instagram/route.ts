import { createHmac, timingSafeEqual } from "node:crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response(null, { status: 403 });
}

function isValidSignature(rawBody: string, signature: string | null, appSecret: string) {
  if (!signature) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET;
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!appSecret || !isValidSignature(rawBody, signature, appSecret)) {
    return new Response(null, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  console.log("Instagram webhook event:", JSON.stringify(payload));

  // TODO: handle incoming comment/message and call the Instagram Send API to reply

  return new Response(null, { status: 200 });
}
