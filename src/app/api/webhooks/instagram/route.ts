import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { after } from "next/server";

import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { sendInstagramMessage } from "@/lib/instagram";

const FREE_TRIGGER_WORD = "free";
const DM_HELP_MESSAGE = "Comment FREE on our latest post to get your invite link!";

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

// TODO: wire this to the real invitation/editor access link generation once
// it supports a URL-token flow openable from a DM on a different device.
// createDraftInvitationAction (src/lib/actions/guest-invitation.ts) is the
// closest existing analog, but it authorizes via a browser cookie set on
// the creating request, which doesn't exist when the link is opened later
// from Instagram — so it isn't reusable here as-is.
function generatePlaceholderLink() {
  return `${getAppUrl()}/create?ref=${randomUUID()}`;
}

async function handleCommentChange(change: { field?: string; value?: Record<string, unknown> }) {
  if (change.field !== "comments") return;

  const value = change.value ?? {};
  const commentId = typeof value.id === "string" ? value.id : undefined;
  const text = typeof value.text === "string" ? value.text : "";
  const from = value.from as { id?: string } | undefined;
  const igUserId = typeof from?.id === "string" ? from.id : undefined;

  if (!commentId || !text.trim().toLowerCase().includes(FREE_TRIGGER_WORD)) return;

  try {
    if (igUserId) {
      const existingLead = await db.instagramLead.findUnique({ where: { igUserId } });
      if (existingLead) {
        await sendInstagramMessage(
          { comment_id: commentId },
          "You already have a link! Check your DMs for your invite link.",
        );
        return;
      }
    }

    const link = generatePlaceholderLink();
    await sendInstagramMessage(
      { comment_id: commentId },
      `Here's your free wedding invitation link: ${link}`,
    );

    if (igUserId) {
      await db.instagramLead.create({ data: { igUserId, commentId, link } });
    }
  } catch (error) {
    console.error("Failed to handle Instagram comment event", error);
  }
}

async function handleMessagingEvent(event: { sender?: { id?: string }; message?: { is_echo?: boolean } }) {
  const senderId = event.sender?.id;
  if (!senderId || event.message?.is_echo) return;

  try {
    await sendInstagramMessage({ id: senderId }, DM_HELP_MESSAGE);
  } catch (error) {
    console.error("Failed to handle Instagram messaging event", error);
  }
}

async function processWebhookPayload(payload: {
  entry?: Array<{
    changes?: Array<{ field?: string; value?: Record<string, unknown> }>;
    messaging?: Array<{ sender?: { id?: string }; message?: { is_echo?: boolean } }>;
  }>;
}) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      await handleCommentChange(change);
    }
    for (const event of entry.messaging ?? []) {
      await handleMessagingEvent(event);
    }
  }
}

export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET;
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  // TEMPORARY DEBUG LOGGING — remove once real vs. dashboard-Test-button
  // deliveries can be told apart. Logs only the payload content (never the
  // secret or signature), so this is safe to appear in Vercel's logs.
  console.log("[instagram-webhook:debug] rawBody:", rawBody.slice(0, 300));

  if (!appSecret || !isValidSignature(rawBody, signature, appSecret)) {
    return new Response(null, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  console.log("Instagram webhook event:", JSON.stringify(payload));

  after(() => processWebhookPayload(payload));

  return new Response(null, { status: 200 });
}
