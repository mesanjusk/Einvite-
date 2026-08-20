import { createHmac, timingSafeEqual } from "node:crypto";
import { after } from "next/server";

import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { generateToken, hashToken } from "@/lib/otp";
import { DEFAULT_SECTION_ORDER, uniqueSlug } from "@/lib/invitation-helpers";
import {
  renderInstagramTemplate,
  sendInstagramButtons,
  sendInstagramMessage,
} from "@/lib/instagram";
import { checkFollowStatusLive } from "@/lib/instagram-follow-status";
import {
  DEFAULT_FLOW_SETTINGS,
  buildFollowStep,
  buildLinkStep,
  buildOpenerStep,
  decodeFlowPayload,
  matchFlowTextReply,
  toPlainText,
  type FlowSettings,
  type FlowStep,
  type FlowTap,
} from "@/lib/instagram-flow";
import { deleteInstagramUserData } from "@/lib/instagram-data-deletion";
import { selectDmRule } from "@/lib/instagram-dm-rules";
import { decideLinkGate, type FollowGateDecision } from "@/lib/instagram-follow-gate";
import { SUPPORT_EMAIL } from "@/config/legal";

const DM_DELETED_MESSAGE =
  "Done — your data is deleted. Your invitation, its link, your follower status, and your comment history are gone. Comment FREE any time to start fresh.";
const DM_DELETE_FAILED_MESSAGE = `Sorry, we couldn't delete your data just now. Please email ${SUPPORT_EMAIL} with subject DELETE and we'll do it by hand.`;
// Worded to fit both a confirmed non-follower and one we simply couldn't
// verify: "make sure you're following" is true either way, and the second
// comment is what lets the check resolve.
const DEFAULT_NOT_FOLLOWING_MESSAGE =
  "Please make sure you're following us, then comment again to get your free invite link!";
// The DM equivalent. "Send it again" rather than "comment again": they are
// already in the thread, and the second message is what lets the check
// resolve for someone Instagram wouldn't answer for the first time.
const DEFAULT_DM_NOT_FOLLOWING_MESSAGE =
  "Almost there — follow us first, then send that again and your free invite link is yours!";

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
 * The button flow's wording, the stored row falling back to the defaults
 * field by field so a half-filled settings row can't leave a step blank.
 *
 * `isActive` false is the account-wide off switch: every reel and rule that
 * opts into the flow goes back to plain replies without anyone having to
 * un-tick them one at a time.
 */
async function loadFlowSettings(): Promise<{
  settings: FlowSettings;
  isActive: boolean;
}> {
  const row = await db.instagramFlowSettings.findUnique({ where: { key: "default" } });
  if (!row) return { settings: DEFAULT_FLOW_SETTINGS, isActive: true };

  return {
    isActive: row.isActive,
    settings: {
      openerMessage: row.openerMessage || DEFAULT_FLOW_SETTINGS.openerMessage,
      openerButtonLabel:
        row.openerButtonLabel || DEFAULT_FLOW_SETTINGS.openerButtonLabel,
      requireFollow: row.requireFollow,
      followMessage: row.followMessage || DEFAULT_FLOW_SETTINGS.followMessage,
      followButtonLabel:
        row.followButtonLabel || DEFAULT_FLOW_SETTINGS.followButtonLabel,
      stillNotFollowingMessage:
        row.stillNotFollowingMessage || DEFAULT_FLOW_SETTINGS.stillNotFollowingMessage,
      profileUrl: row.profileUrl,
      profileButtonLabel:
        row.profileButtonLabel || DEFAULT_FLOW_SETTINGS.profileButtonLabel,
      linkMessage: row.linkMessage || DEFAULT_FLOW_SETTINGS.linkMessage,
      duplicateMessage: row.duplicateMessage || DEFAULT_FLOW_SETTINGS.duplicateMessage,
      notifyOnPublish: row.notifyOnPublish ?? DEFAULT_FLOW_SETTINGS.notifyOnPublish,
      publishedMessage: row.publishedMessage || DEFAULT_FLOW_SETTINGS.publishedMessage,
    },
  };
}

/**
 * The account-wide followers-only rule.
 *
 * Read on every path that issues a link, and on by default — including when
 * no settings row exists at all, so a fresh install gates rather than leaks.
 * Deliberately independent of the flow's own `isActive`: switching the button
 * flow off is a decision about how the link is *delivered*, never about who
 * is allowed one.
 */
async function accountRequiresFollow(): Promise<boolean> {
  const { settings } = await loadFlowSettings();
  return settings.requireFollow;
}

/**
 * Sends one step, and falls back to text if the buttons don't land.
 *
 * Buttons aren't accepted on every surface — a private reply to a comment in
 * particular is a thread Instagram is fussier about — and a rejected send
 * would otherwise leave someone holding a message with no way onward. The
 * fallback spells the buttons out as words to reply with, which
 * `matchFlowTextReply` then reads as taps.
 */
async function sendFlowStep(
  recipient: { comment_id: string } | { id: string },
  step: FlowStep,
) {
  const result = await sendInstagramButtons(recipient, step.text, step.buttons);
  if (result.delivered || result.devMode) return result;

  return sendInstagramMessage(recipient, toPlainText(step));
}

async function setFlowState(
  igUserId: string,
  step: "AWAITING_TAP" | "AWAITING_FOLLOW" | "COMPLETED",
  vars: { username?: string; automationId?: string | null },
) {
  // A step never carries an automation of its own once the flow has left the
  // comment behind, so an absent id keeps whichever reel started this rather
  // than blanking the attribution.
  const automation = vars.automationId ? { automationId: vars.automationId } : {};
  await db.instagramFlowState.upsert({
    where: { igUserId },
    create: { igUserId, step, username: vars.username, ...automation },
    update: { step, username: vars.username, ...automation },
  });
}

// Payload ids are ours, but a malformed one would still reach Mongo as a
// query and throw on a non-ObjectId string.
function isObjectId(value: string | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{24}$/i.test(value);
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

    // The button flow takes over from here: instead of handing the link back
    // in the private reply, the reel answers with a tappable opener and the
    // link is issued in DMs once the follow check passes on a tap. Its own
    // gate replaces the one below — checking at comment time is exactly what
    // this flow exists to stop (see instagram-flow).
    if (automation.useButtonFlow && igUserId) {
      const { settings, isActive: flowActive } = await loadFlowSettings();

      if (flowActive) {
        const step = buildOpenerStep(settings, {
          username,
          automationId: automation.id,
        });
        const { delivered } = await sendFlowStep({ comment_id: commentId }, step);

        if (delivered) {
          await setFlowState(igUserId, "AWAITING_TAP", {
            username,
            automationId: automation.id,
          });
        }

        await db.instagramCommentLog.create({
          data: {
            ...logBase,
            automationId: automation.id,
            outcome: delivered ? "FLOW_STARTED" : "SEND_FAILED",
            replyText: step.text,
            error: delivered ? null : "Send API rejected the flow opener",
          },
        });
        return;
      }
    }

    // The follow gate. Fails *closed* (see decideFollowGate): a status
    // Instagram won't resolve — its usual answer for someone who has never
    // messaged the account — asks them to follow and comment again instead
    // of handing over the link, which is what "followers only" has to mean
    // to be worth anything. The reply is a private reply to the comment, so
    // it opens a conversation and the next comment resolves for real.
    //
    // The account-wide rule decides; this reel's own switch can only tighten
    // it. A reel left unticked no longer means "links for everyone".
    const accountFollowersOnly = await accountRequiresFollow();
    const reelRequiresFollow = automation.requireFollow ?? false;
    if ((accountFollowersOnly || reelRequiresFollow) && igUserId) {
      const isFollower = await checkFollowStatusLive(igUserId, username);
      const decision = decideLinkGate({
        accountFollowersOnly,
        ruleRequiresFollow: reelRequiresFollow,
        isFollower,
      });

      if (decision !== "ALLOW") {
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
            // Logged apart from a confirmed non-follower so the dashboard
            // shows when the gate is turning people away on an unresolved
            // check rather than on a real "doesn't follow us".
            outcome: delivered
              ? decision === "UNVERIFIED"
                ? "FOLLOW_UNVERIFIED"
                : "NOT_FOLLOWING"
              : "SEND_FAILED",
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

    // Which of this reel's two replies to send is a *per-reel* question, and
    // the lead row is the per-reel record of a claim. Asking the invitation
    // instead — "does this person have a link at all?" — got it wrong for
    // every returning commenter: the invitation is one per Instagram account
    // (see issueInvitationLink), so from their second reel onwards everyone
    // took the duplicate branch and no reel's own reply was ever sent again.
    const claimedThisReel = await db.instagramLead.findUnique({
      where: { igUserId_automationId: { igUserId, automationId: automation.id } },
      select: { id: true },
    });
    const alreadyClaimed = claimedThisReel !== null;

    // One invitation per Instagram account: a returning commenter is handed
    // their existing invitation again, on any reel, rather than a second one.
    const { link } = await issueInvitationLink(igUserId, username);
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

/**
 * A tap on one of the flow's buttons.
 *
 * Both taps run the same gate, because both are asking the same question —
 * "can this person have the link yet?" — and the answer can change between
 * them, which is the entire point of the second one. The check is live here
 * rather than at comment time: the tap itself is a message, so Instagram has
 * a conversation to resolve `is_user_follow_business` against.
 */
async function handleFlowTap({
  senderId,
  username,
  tap,
  automationId,
  sourceId,
  logBase,
}: {
  senderId: string;
  username?: string;
  tap: FlowTap;
  automationId?: string;
  // The message id of the tap, recorded as what drove the claim in place of
  // the comment id an ordinary lead carries.
  sourceId?: string;
  logBase: {
    messageId?: string;
    igUserId: string;
    username?: string;
    messageText: string;
  };
}) {
  const { settings, isActive } = await loadFlowSettings();

  // Switched off between the opener and the tap: nothing to say that the
  // admin hasn't already decided to stop saying.
  if (!isActive) {
    await db.instagramMessageLog.create({
      data: { ...logBase, outcome: "NO_RULE_MATCHED" },
    });
    return;
  }

  const isFollower = settings.requireFollow
    ? await checkFollowStatusLive(senderId, username)
    : true;
  const decision = decideLinkGate({
    accountFollowersOnly: settings.requireFollow,
    isFollower,
  });

  if (decision !== "ALLOW") {
    // The retry wording is for someone who has already told us they follow
    // and been contradicted — same buttons, since tapping again is still the
    // way through once Instagram catches up.
    const step = buildFollowStep(settings, {
      username,
      automationId,
      retry: tap === "FOLLOWING",
    });
    const { delivered } = await sendFlowStep({ id: senderId }, step);

    if (delivered) {
      await setFlowState(senderId, "AWAITING_FOLLOW", { username, automationId });
    }

    await db.instagramMessageLog.create({
      data: {
        ...logBase,
        outcome: delivered
          ? tap === "FOLLOWING"
            ? "FLOW_STILL_NOT_FOLLOWING"
            : "FLOW_FOLLOW_PROMPTED"
          : "SEND_FAILED",
        replyText: step.text,
        error: delivered ? null : "Send API rejected the follow prompt",
      },
    });
    return;
  }

  const { link, alreadyClaimed } = await issueInvitationLink(senderId, username);
  const step = buildLinkStep(settings, { link, username, alreadyClaimed });
  const { delivered } = await sendFlowStep({ id: senderId }, step);

  if (delivered) {
    // The reel that started the flow still gets the credit, three taps later.
    // It may have been deleted in between, so its existence is checked rather
    // than assumed — a lead row pointing at nothing would break the cascade.
    if (isObjectId(automationId)) {
      const automation = await db.instagramAutomation.findUnique({
        where: { id: automationId },
        select: { id: true },
      });
      if (automation) {
        await db.instagramLead.upsert({
          where: {
            igUserId_automationId: { igUserId: senderId, automationId: automation.id },
          },
          create: {
            igUserId: senderId,
            automationId: automation.id,
            commentId: sourceId ?? "",
            link,
          },
          update: { link },
        });
      }
    }

    await setFlowState(senderId, "COMPLETED", { username, automationId });
  }

  await db.instagramMessageLog.create({
    data: {
      ...logBase,
      outcome: delivered ? "FLOW_LINK_SENT" : "SEND_FAILED",
      replyText: step.text,
      error: delivered ? null : "Send API rejected the flow link",
    },
  });
}

/**
 * What a DM gets instead of the link when the gate holds it back.
 *
 * Where the button flow is on, this is its step 2 — the same "follow first"
 * message, carrying the buttons that lead back through the gate. That matters
 * more than the wording: a plain line of text is a dead end, while "I'm
 * following ✅" re-runs the check and delivers the link the moment it comes
 * back positive. Only with the flow off does it fall back to flat text.
 */
async function sendFollowGateReply({
  senderId,
  username,
  decision,
  ruleId,
  fallbackText,
  logBase,
}: {
  senderId: string;
  username?: string;
  decision: FollowGateDecision;
  ruleId?: string;
  fallbackText?: string | null;
  logBase: {
    messageId?: string;
    igUserId: string;
    username?: string;
    messageText: string;
  };
}) {
  const { settings, isActive } = await loadFlowSettings();

  const step = isActive ? buildFollowStep(settings, { username }) : null;
  const text =
    step?.text ??
    renderInstagramTemplate(fallbackText || DEFAULT_DM_NOT_FOLLOWING_MESSAGE, {
      link: "",
      username: username ?? "",
    });

  const { delivered } = step
    ? await sendFlowStep({ id: senderId }, step)
    : await sendInstagramMessage({ id: senderId }, text);

  // Parked at the gate, so a tap on the button lands as the flow's second
  // step rather than as a stray message.
  if (delivered && step) {
    await setFlowState(senderId, "AWAITING_FOLLOW", { username });
  }

  await db.instagramMessageLog.create({
    data: {
      ...logBase,
      ruleId,
      // Split so the dashboard shows whether the gate is turning people away
      // on a real "doesn't follow us" or on a check Instagram wouldn't answer.
      outcome: delivered
        ? decision === "UNVERIFIED"
          ? "FOLLOW_UNVERIFIED"
          : "NOT_FOLLOWING"
        : "SEND_FAILED",
      replyText: text,
      error: delivered ? null : "Send API rejected the follow-first reply",
    },
  });
}

async function handleMessagingEvent(event: MessagingEvent) {
  const senderId = event.sender?.id;
  // Echoes of our own sends are never a reply to us — answering one is both
  // wrong and rejected by Meta with "This message is sent outside of allowed
  // window".
  if (!senderId || event.message?.is_echo) return;

  // A tap arrives one of two ways: a quick reply comes back as a message
  // carrying its payload alongside the title it echoed into the thread, and a
  // template button comes back as a postback with no message at all. Either
  // way the payload is what says which button it was.
  const payload = event.message?.quick_reply?.payload ?? event.postback?.payload;
  // The postback's title is what the person sees themselves tap, so it reads
  // as their message in the log.
  const text = event.message?.text ?? event.postback?.title ?? "";
  const messageId = event.message?.mid ?? event.postback?.mid;

  // Everything else in the messaging array — read receipts, reactions,
  // message edits — carries neither, and is not something to answer.
  if (!text && !payload) return;

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

    // A tap is answered by the flow, whatever the DM rules say — the button
    // was ours and its payload names the step it belongs to.
    const tapped = decodeFlowPayload(payload);
    if (tapped) {
      await handleFlowTap({
        senderId,
        username,
        tap: tapped.tap,
        automationId: tapped.automationId,
        sourceId: messageId,
        logBase,
      });
      return;
    }

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

    // Someone mid-flow who types the button's words instead of tapping it
    // means the same thing, and gets the same answer. Only mid-flow: outside
    // one, "I'm following" is just a message for the rules to handle.
    const flowState = await db.instagramFlowState.findUnique({
      where: { igUserId: senderId },
    });
    if (flowState && flowState.step !== "COMPLETED") {
      const { settings, isActive } = await loadFlowSettings();
      const typedTap = isActive ? matchFlowTextReply(text, settings) : null;

      if (typedTap) {
        await handleFlowTap({
          senderId,
          username,
          tap: typedTap,
          automationId: flowState.automationId ?? undefined,
          sourceId: messageId,
          logBase,
        });
        return;
      }
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

    // A rule can start the flow instead of answering: the keyword gets the
    // same opener a reel comment does, so "DM me FREE" and "comment FREE"
    // lead to the same three taps rather than two different experiences.
    if (rule.startFlow) {
      const { settings, isActive } = await loadFlowSettings();

      if (isActive) {
        const step = buildOpenerStep(settings, { username });
        const { delivered } = await sendFlowStep({ id: senderId }, step);

        if (delivered) await setFlowState(senderId, "AWAITING_TAP", { username });

        await db.instagramMessageLog.create({
          data: {
            ...logBase,
            ruleId: rule.id,
            outcome: delivered ? "FLOW_STARTED" : "SEND_FAILED",
            replyText: step.text,
            error: delivered ? null : "Send API rejected the flow opener",
          },
        });
        return;
      }
    }

    // Only a rule that issues a link touches the invitation tables; a plain
    // informational reply must not create an invitation for someone who
    // asked about opening hours.
    //
    // A link-issuing rule goes through the same gate a reel does. It used to
    // go through none at all, which is how non-followers kept getting links
    // no matter how carefully the reels were gated: DM the keyword, get a
    // link. Nothing is issued until the check comes back positive.
    if (rule.issueLink) {
      const accountFollowersOnly = await accountRequiresFollow();
      const decision = decideLinkGate({
        accountFollowersOnly,
        // Missing on a rule written before the field existed, and missing
        // has to mean gated — those are exactly the rules that were handing
        // links to anyone who asked.
        ruleRequiresFollow: rule.requireFollow ?? true,
        isFollower:
          accountFollowersOnly || (rule.requireFollow ?? true)
            ? await checkFollowStatusLive(senderId, username)
            : true,
      });

      if (decision !== "ALLOW") {
        await sendFollowGateReply({
          senderId,
          username,
          decision,
          ruleId: rule.id,
          fallbackText: rule.notFollowingMessage,
          logBase,
        });
        return;
      }
    }

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

/**
 * One entry in a messaging webhook. `postback` is the flow's other half:
 * a template button reports itself here rather than as a message.
 */
type MessagingEvent = {
  sender?: { id?: string };
  message?: {
    mid?: string;
    is_echo?: boolean;
    text?: string;
    quick_reply?: { payload?: string };
  };
  postback?: { mid?: string; title?: string; payload?: string };
};

async function processWebhookPayload(payload: {
  entry?: Array<{
    id?: string;
    changes?: Array<{ field?: string; value?: Record<string, unknown> }>;
    messaging?: MessagingEvent[];
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
