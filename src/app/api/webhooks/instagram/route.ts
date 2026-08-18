import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { after } from "next/server";

import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { sendInstagramMessage } from "@/lib/instagram";

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

function renderTemplate(template: string, vars: { link: string; username: string }) {
  return template
    .replaceAll("{{link}}", vars.link)
    .replaceAll("{{username}}", vars.username);
}

async function handleCommentChange(change: { field?: string; value?: Record<string, unknown> }) {
  if (change.field !== "comments") return;

  const value = change.value ?? {};
  const commentId = typeof value.id === "string" ? value.id : undefined;
  const text = typeof value.text === "string" ? value.text : "";
  const from = value.from as { id?: string; username?: string } | undefined;
  const igUserId = typeof from?.id === "string" ? from.id : undefined;
  const username = typeof from?.username === "string" ? from.username : undefined;
  const media = value.media as { id?: string } | undefined;
  const mediaId = typeof media?.id === "string" ? media.id : undefined;

  if (!commentId || !mediaId) return;

  const logBase = { mediaId, commentId, igUserId, username, commentText: text };

  try {
    const automation = await db.instagramAutomation.findUnique({ where: { mediaId } });

    // Automation is opt-in per reel: a comment on a reel with no rule (or a
    // paused one) is recorded for the dashboard but never replied to.
    if (!automation) {
      await db.instagramCommentLog.create({ data: { ...logBase, outcome: "NO_AUTOMATION" } });
      return;
    }
    if (!automation.isActive) {
      await db.instagramCommentLog.create({
        data: { ...logBase, automationId: automation.id, outcome: "AUTOMATION_INACTIVE" },
      });
      return;
    }

    const matched = text.trim().toLowerCase().includes(automation.triggerWord.trim().toLowerCase());
    if (!matched) {
      await db.instagramCommentLog.create({
        data: { ...logBase, automationId: automation.id, outcome: "TRIGGER_NOT_MATCHED" },
      });
      return;
    }

    // One link per account per reel — claiming on one reel leaves the others
    // still claimable.
    if (igUserId) {
      const existingLead = await db.instagramLead.findUnique({
        where: { igUserId_automationId: { igUserId, automationId: automation.id } },
      });
      if (existingLead) {
        const duplicateText = renderTemplate(automation.duplicateMessage, {
          link: existingLead.link,
          username: username ?? "",
        });
        const { delivered } = await sendInstagramMessage(
          { comment_id: commentId },
          duplicateText,
        );
        await db.instagramCommentLog.create({
          data: {
            ...logBase,
            automationId: automation.id,
            outcome: delivered ? "DUPLICATE_SKIPPED" : "SEND_FAILED",
            replyText: duplicateText,
            error: delivered ? null : "Send API rejected the duplicate reply",
          },
        });
        return;
      }
    }

    const link = generatePlaceholderLink();
    const replyText = renderTemplate(automation.replyMessage, {
      link,
      username: username ?? "",
    });
    const { delivered } = await sendInstagramMessage({ comment_id: commentId }, replyText);

    // Only record the lead once the link actually reached them — otherwise a
    // failed send would still burn their one free link, leaving them stuck on
    // "you already have a link" for a link they never received.
    if (igUserId && delivered) {
      await db.instagramLead.create({
        data: { igUserId, automationId: automation.id, commentId, link },
      });
    }

    await db.instagramCommentLog.create({
      data: {
        ...logBase,
        automationId: automation.id,
        outcome: delivered ? "REPLY_SENT" : "SEND_FAILED",
        replyText,
        error: delivered ? null : "Send API rejected the reply",
      },
    });
  } catch (error) {
    console.error("Failed to handle Instagram comment event", error);
  }
}

async function handleMessagingEvent(event: {
  sender?: { id?: string };
  message?: { is_echo?: boolean; text?: string };
}) {
  const senderId = event.sender?.id;
  // Only genuine inbound text messages get a reply. The same messaging array
  // also carries read receipts, message edits, reactions, and echoes of our
  // own sends — replying to those is both wrong and rejected by Meta with
  // "This message is sent outside of allowed window".
  if (!senderId || event.message?.is_echo || !event.message?.text) return;

  try {
    await sendInstagramMessage({ id: senderId }, DM_HELP_MESSAGE);
  } catch (error) {
    console.error("Failed to handle Instagram messaging event", error);
  }
}

async function processWebhookPayload(payload: {
  entry?: Array<{
    changes?: Array<{ field?: string; value?: Record<string, unknown> }>;
    messaging?: Array<{
      sender?: { id?: string };
      message?: { is_echo?: boolean; text?: string };
    }>;
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

  if (!appSecret || !isValidSignature(rawBody, signature, appSecret)) {
    return new Response(null, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  console.log("Instagram webhook event:", JSON.stringify(payload));

  after(() => processWebhookPayload(payload));

  return new Response(null, { status: 200 });
}
