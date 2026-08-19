import { createHmac, timingSafeEqual } from "node:crypto";
import { after } from "next/server";

import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { generateToken, hashToken } from "@/lib/otp";
import { DEFAULT_SECTION_ORDER, uniqueSlug } from "@/lib/invitation-helpers";
import {
  fetchInstagramFollowStatus,
  renderInstagramTemplate,
  sendInstagramMessage,
} from "@/lib/instagram";
import { deleteInstagramUserData } from "@/lib/instagram-data-deletion";
import { selectDmRule } from "@/lib/instagram-dm-rules";
import { SUPPORT_EMAIL } from "@/config/legal";

const DM_DELETED_MESSAGE =
  "Done — your data is deleted. Your invitation, its link, your follower status, and your comment history are gone. Comment FREE any time to start fresh.";
const DM_DELETE_FAILED_MESSAGE = `Sorry, we couldn't delete your data just now. Please email ${SUPPORT_EMAIL} with subject DELETE and we'll do it by hand.`;
const DEFAULT_NOT_FOLLOWING_MESSAGE =
  "Please follow us first, then comment again to get your free invite link!";
// Only a positive follow result is cached. Someone told to follow first will
// follow and re-comment within seconds, so a cached "not following" would
// keep locking them out — negatives are always re-checked live.
const FOLLOWER_CACHE_MS = 60 * 60 * 1000;

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

function isValidSignature(
  rawBody: string,
  signature: string | null,
  appSecret: string,
) {
  if (!signature) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

function editLinkFor(rawToken: string) {
  return `${getAppUrl()}/e/${rawToken}`;
}

/**
 * The Instagram account's invitation and its pre-logged link.
 *
 * One Instagram account owns exactly one invitation, so a commenter who
 * already has one is handed that same invitation again rather than a second
 * one — this is where "one website, one PDF, one video per Instagram user"
 * is actually enforced. The edit token is rotated on every issue so an old
 * DM stops working once a newer link has been sent.
 *
 * Returns the raw token (only ever known here and in the DM) plus whether
 * this was an existing claim, so the caller can pick the right reply.
 */
async function issueInvitationLink(
  igUserId: string,
  username?: string,
): Promise<{ link: string; alreadyClaimed: boolean }> {
  const rawToken = generateToken();
  const editTokenHash = hashToken(rawToken);

  const existing = await db.instagramLink.findUnique({ where: { igUserId } });
  if (existing) {
    await db.instagramLink.update({
      where: { id: existing.id },
      data: { editTokenHash, username: username ?? existing.username },
    });
    return { link: editLinkFor(rawToken), alreadyClaimed: true };
  }

  const slug = await uniqueSlug(`invite-${Date.now()}`);
  const invitation = await db.invitation.create({
    data: {
      slug,
      brideName: "",
      groomName: "",
      weddingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      sectionConfig: DEFAULT_SECTION_ORDER.map((type, order) => ({
        id: type,
        type,
        visible: true,
        locked: false,
        order,
      })),
    },
  });

  await db.instagramLink.create({
    data: { igUserId, username, invitationId: invitation.id, editTokenHash },
  });

  return { link: editLinkFor(rawToken), alreadyClaimed: false };
}

/**
 * Follower status for a commenter, reading the cache first and only calling
 * Instagram when there's no fresh positive result. Returns null when the
 * status can't be determined — callers fail open on that rather than
 * blocking someone the API simply couldn't resolve.
 */
async function resolveFollowStatus(
  igUserId: string,
  username?: string,
): Promise<boolean | null> {
  const cached = await db.instagramProfile.findUnique({ where: { igUserId } });
  if (
    cached?.isFollower &&
    Date.now() - cached.checkedAt.getTime() < FOLLOWER_CACHE_MS
  ) {
    return true;
  }

  const { isFollower, username: fetchedUsername } =
    await fetchInstagramFollowStatus(igUserId);
  if (isFollower === null) return null;

  await db.instagramProfile.upsert({
    where: { igUserId },
    create: {
      igUserId,
      username: fetchedUsername ?? username,
      isFollower,
      checkedAt: new Date(),
    },
    update: {
      username: fetchedUsername ?? username,
      isFollower,
      checkedAt: new Date(),
    },
  });

  return isFollower;
}

async function handleCommentChange(
  change: {
    field?: string;
    value?: Record<string, unknown>;
  },
  // The Instagram business account the event belongs to — entry.id in the
  // payload. Needed to recognise our own comments.
  businessAccountId?: string,
) {
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

  // Our own comments come back through the same webhook — replying to one
  // would issue the business account an invitation and burn its own slot,
  // and there is no one to DM. Recognised without extra config: the account
  // that owns the event and the comment's author are the same id.
  if (igUserId && businessAccountId && igUserId === businessAccountId) return;

  const logBase = { mediaId, commentId, igUserId, username, commentText: text };

  try {
    // Meta re-delivers a webhook it thinks we missed, and a second delivery
    // of the same comment would send the commenter a second DM. The comment
    // log doubles as the record of what has already been handled: one row
    // for this comment id means this event is a repeat, whatever its outcome.
    const alreadyHandled = await db.instagramCommentLog.findFirst({
      where: { commentId },
      select: { id: true },
    });
    if (alreadyHandled) return;

    const automation = await db.instagramAutomation.findUnique({ where: { mediaId } });

    // Automation is opt-in per reel: a comment on a reel with no rule (or a
    // paused one) is recorded for the dashboard but never replied to.
    if (!automation) {
      await db.instagramCommentLog.create({
        data: { ...logBase, outcome: "NO_AUTOMATION" },
      });
      return;
    }
    if (!automation.isActive) {
      await db.instagramCommentLog.create({
        data: {
          ...logBase,
          automationId: automation.id,
          outcome: "AUTOMATION_INACTIVE",
        },
      });
      return;
    }

    const matched = text
      .trim()
      .toLowerCase()
      .includes(automation.triggerWord.trim().toLowerCase());
    if (!matched) {
      await db.instagramCommentLog.create({
        data: {
          ...logBase,
          automationId: automation.id,
          outcome: "TRIGGER_NOT_MATCHED",
        },
      });
      return;
    }

    // Optional follow gate. Fails open: an unresolvable check sends the link
    // rather than turning away someone who may well be a follower.
    if (automation.requireFollow && igUserId) {
      const isFollower = await resolveFollowStatus(igUserId, username);
      if (isFollower === false) {
        const followText = renderInstagramTemplate(
          automation.notFollowingMessage || DEFAULT_NOT_FOLLOWING_MESSAGE,
          { link: "", username: username ?? "" },
        );
        const { delivered } = await sendInstagramMessage(
          { comment_id: commentId },
          followText,
        );
        await db.instagramCommentLog.create({
          data: {
            ...logBase,
            automationId: automation.id,
            outcome: delivered ? "NOT_FOLLOWING" : "SEND_FAILED",
            replyText: followText,
            error: delivered ? null : "Send API rejected the follow-first reply",
          },
        });
        return;
      }
    }

    // Without a commenter ID there's no identity to bind an invitation to, so
    // there's nothing safe to send — recording it is all that's left.
    if (!igUserId) {
      await db.instagramCommentLog.create({
        data: {
          ...logBase,
          automationId: automation.id,
          outcome: "SEND_FAILED",
          error: "Comment carried no sender ID",
        },
      });
      return;
    }

    // One invitation per Instagram account: a returning commenter is handed
    // their existing invitation again, on any reel, rather than a second one.
    const { link, alreadyClaimed } = await issueInvitationLink(igUserId, username);
    const replyText = renderInstagramTemplate(
      alreadyClaimed ? automation.duplicateMessage : automation.replyMessage,
      { link, username: username ?? "" },
    );
    const { delivered } = await sendInstagramMessage(
      { comment_id: commentId },
      replyText,
    );

    // The lead row records which reel drove this claim, so a returning user
    // commenting on a new reel still attributes to that reel. Written only on
    // a delivered send, so a failed one doesn't log a link nobody received.
    if (delivered) {
      await db.instagramLead.upsert({
        where: { igUserId_automationId: { igUserId, automationId: automation.id } },
        create: { igUserId, automationId: automation.id, commentId, link },
        update: { commentId, link },
      });
    }

    await db.instagramCommentLog.create({
      data: {
        ...logBase,
        automationId: automation.id,
        outcome: delivered
          ? alreadyClaimed
            ? "DUPLICATE_SKIPPED"
            : "REPLY_SENT"
          : "SEND_FAILED",
        replyText,
        error: delivered ? null : "Send API rejected the reply",
      },
    });
  } catch (error) {
    console.error("Failed to handle Instagram comment event", error);
  }
}

/**
 * A best-effort @username for a DM sender, for the dashboard and for
 * {{username}} in a reply. The messaging webhook carries only an ID, so this
 * reads what earlier comment and follow-check traffic already stored rather
 * than spending an API call on every message.
 */
async function knownUsernameFor(igUserId: string): Promise<string | undefined> {
  const [profile, link] = await Promise.all([
    db.instagramProfile.findUnique({
      where: { igUserId },
      select: { username: true },
    }),
    db.instagramLink.findUnique({ where: { igUserId }, select: { username: true } }),
  ]);
  return profile?.username ?? link?.username ?? undefined;
}

async function handleMessagingEvent(event: {
  sender?: { id?: string };
  message?: { mid?: string; is_echo?: boolean; text?: string };
}) {
  const senderId = event.sender?.id;
  // Only genuine inbound text messages get a reply. The same messaging array
  // also carries read receipts, message edits, reactions, and echoes of our
  // own sends — replying to those is both wrong and rejected by Meta with
  // "This message is sent outside of allowed window".
  if (!senderId || event.message?.is_echo || !event.message?.text) return;

  const text = event.message.text;
  const messageId = event.message.mid;

  try {
    // Meta re-delivers a webhook it thinks we missed. The message log doubles
    // as the record of what has already been handled, exactly as the comment
    // log does: one row for this mid means this event is a repeat.
    if (messageId) {
      const alreadyHandled = await db.instagramMessageLog.findFirst({
        where: { messageId },
        select: { id: true },
      });
      if (alreadyHandled) return;
    }

    const username = await knownUsernameFor(senderId);
    const logBase = { messageId, igUserId: senderId, username, messageText: text };

    // /data-deletion tells people they can DM "DELETE" to have their data
    // erased, so that word has to actually erase it rather than fall through
    // to a rule. Matched on the whole trimmed message: someone writing
    // "don't delete my invite" is not making a deletion request. Hard-wired
    // rather than admin-editable — it is a promise made in the privacy
    // policy, not a campaign reply.
    if (text.trim().toLowerCase() === "delete") {
      try {
        const summary = await deleteInstagramUserData(senderId);
        console.log(
          "Instagram DELETE request — erased user data:",
          JSON.stringify(summary),
        );
        await sendInstagramMessage({ id: senderId }, DM_DELETED_MESSAGE);
        // Written after the erase, so it records the request rather than
        // being swept away by it.
        await db.instagramMessageLog.create({
          data: { ...logBase, outcome: "DATA_DELETED", replyText: DM_DELETED_MESSAGE },
        });
      } catch (error) {
        console.error("Failed to erase data on DELETE request", error);
        await sendInstagramMessage({ id: senderId }, DM_DELETE_FAILED_MESSAGE);
        await db.instagramMessageLog.create({
          data: {
            ...logBase,
            outcome: "DATA_DELETE_FAILED",
            replyText: DM_DELETE_FAILED_MESSAGE,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
      return;
    }

    // DM replies are opt-in per rule, the same way comment replies are opt-in
    // per reel. A message nothing matches is recorded for the dashboard and
    // left for a human — the account no longer answers every DM with one
    // canned line. An admin who does want that back adds an ANY rule.
    const rules = await db.instagramDmRule.findMany({ where: { isActive: true } });
    const rule = selectDmRule(rules, text);

    if (!rule) {
      await db.instagramMessageLog.create({
        data: { ...logBase, outcome: "NO_RULE_MATCHED" },
      });
      return;
    }

    // Only a rule that issues a link touches the invitation tables; a plain
    // informational reply must not create an invitation for someone who
    // asked about opening hours.
    let link = "";
    let alreadyClaimed = false;
    if (rule.issueLink) {
      ({ link, alreadyClaimed } = await issueInvitationLink(senderId, username));
    }

    const template =
      alreadyClaimed && rule.duplicateMessage
        ? rule.duplicateMessage
        : rule.replyMessage;
    const replyText = renderInstagramTemplate(template, {
      link,
      username: username ?? "",
    });
    const { delivered } = await sendInstagramMessage({ id: senderId }, replyText);

    await db.instagramMessageLog.create({
      data: {
        ...logBase,
        ruleId: rule.id,
        outcome: delivered
          ? alreadyClaimed && rule.duplicateMessage
            ? "DUPLICATE_REPLY_SENT"
            : "REPLY_SENT"
          : "SEND_FAILED",
        replyText,
        error: delivered ? null : "Send API rejected the reply",
      },
    });
  } catch (error) {
    console.error("Failed to handle Instagram messaging event", error);
  }
}

async function processWebhookPayload(payload: {
  entry?: Array<{
    id?: string;
    changes?: Array<{ field?: string; value?: Record<string, unknown> }>;
    messaging?: Array<{
      sender?: { id?: string };
      message?: { mid?: string; is_echo?: boolean; text?: string };
    }>;
  }>;
}) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      await handleCommentChange(change, entry.id);
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
