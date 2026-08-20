/**
 * The Instagram button flow: comment the keyword, tap a button, follow, get
 * the link.
 *
 * The plain comment automation hands the link straight back in the private
 * reply, which forces the follow check to happen at comment time — the one
 * moment Instagram usually *can't* answer it, because someone who has only
 * ever commented has no conversation with the account and
 * `is_user_follow_business` comes back unresolved (see instagram-follow-gate).
 *
 * This flow moves the check to a tap. Every step is a message the person
 * sends us, so by the time the gate is evaluated there is a conversation,
 * the status resolves for real, and "followers only" means something:
 *
 *   1. keyword  → opener with one button ("Send me the access")
 *   2. tap      → follows? link. doesn't? "Visit profile" + "I'm following ✅"
 *   3. tap      → checked again, live. follows? link. still not? asked again.
 *
 * Everything here is pure — the wording, the buttons, and which step a tap
 * or a typed reply means — so the whole flow is testable without a database,
 * a Meta payload, or a token. The webhook route does the sending and the
 * bookkeeping.
 */

import type { InstagramButton } from "@/lib/instagram";
import { renderInstagramTemplate } from "@/lib/instagram";

/** The two taps the flow reacts to. */
export type FlowTap = "CTA" | "FOLLOWING";

export type FlowStep = { text: string; buttons: InstagramButton[] };

/**
 * The wording, as an admin edits it. Mirrors InstagramFlowSettings, minus the
 * bookkeeping columns, so the builders can be handed either the stored row or
 * the defaults below.
 */
export type FlowSettings = {
  openerMessage: string;
  openerButtonLabel: string;
  requireFollow: boolean;
  followMessage: string;
  followButtonLabel: string;
  stillNotFollowingMessage: string;
  profileUrl: string | null;
  profileButtonLabel: string;
  linkMessage: string;
  duplicateMessage: string;
  notifyOnPublish: boolean;
  publishedMessage: string;
};

/**
 * What the flow says before anyone opens the settings form. A reel switched
 * to the button flow works immediately with these; the form only exists to
 * change them.
 */
export const DEFAULT_FLOW_SETTINGS: FlowSettings = {
  openerMessage:
    "Tap the button below and I'll send your free wedding invitation website 👇",
  openerButtonLabel: "Send me the link",
  requireFollow: true,
  followMessage:
    "Looks like you aren't following yet. Hit follow so the system can send your link 🛠️",
  followButtonLabel: "I'm following ✅",
  stillNotFollowingMessage:
    "Instagram still shows you as not following. Follow from the profile, give it a few seconds, then tap again 🙏",
  profileUrl: null,
  profileButtonLabel: "Visit profile",
  linkMessage:
    "Here's your free wedding invitation 💍 Open it, add your names, photos and functions, and publish it when it's ready:\n{{link}}",
  duplicateMessage:
    "You already have your invitation — same link, still yours to edit:\n{{link}}",
  notifyOnPublish: true,
  publishedMessage:
    "Your invitation is live 🎉 This is the link to share with your family and friends:\n{{link}}",
};

// Namespaced so a payload of ours is never confused with one from anything
// else Meta sends through the same field.
const PAYLOAD_PREFIX = "ig_flow";

/**
 * The payload a button carries back to us.
 *
 * The reel is encoded into it rather than looked up later: the tap arrives as
 * a DM, which knows nothing about where it started, and the claim has to
 * attribute to the reel that earned it.
 */
export function encodeFlowPayload(tap: FlowTap, automationId?: string | null) {
  return automationId
    ? `${PAYLOAD_PREFIX}:${tap}:${automationId}`
    : `${PAYLOAD_PREFIX}:${tap}`;
}

export function decodeFlowPayload(
  payload: string | undefined | null,
): { tap: FlowTap; automationId?: string } | null {
  if (!payload) return null;

  const [prefix, tap, automationId] = payload.split(":");
  if (prefix !== PAYLOAD_PREFIX) return null;
  if (tap !== "CTA" && tap !== "FOLLOWING") return null;

  return { tap, automationId: automationId || undefined };
}

/** Step 1 — the opener, sent in answer to the keyword. */
export function buildOpenerStep(
  settings: FlowSettings,
  vars: { username?: string | null; automationId?: string | null },
): FlowStep {
  return {
    text: renderInstagramTemplate(settings.openerMessage, {
      link: "",
      username: vars.username ?? "",
    }),
    buttons: [
      {
        type: "postback",
        title: settings.openerButtonLabel,
        payload: encodeFlowPayload("CTA", vars.automationId),
      },
    ],
  };
}

/**
 * Step 2 — the follow gate.
 *
 * `retry` is the second time round, after they said they were following and
 * the check disagreed. Same buttons, different wording: the answer is still
 * "tap it again", so taking the button away would strand them.
 */
export function buildFollowStep(
  settings: FlowSettings,
  vars: {
    username?: string | null;
    automationId?: string | null;
    retry?: boolean;
  },
): FlowStep {
  const buttons: InstagramButton[] = [];

  // The profile link is optional: without it the flow still works, it just
  // asks people to find the account themselves.
  if (settings.profileUrl?.trim()) {
    buttons.push({
      type: "url",
      title: settings.profileButtonLabel,
      url: settings.profileUrl.trim(),
    });
  }

  buttons.push({
    type: "postback",
    title: settings.followButtonLabel,
    payload: encodeFlowPayload("FOLLOWING", vars.automationId),
  });

  return {
    text: renderInstagramTemplate(
      vars.retry ? settings.stillNotFollowingMessage : settings.followMessage,
      { link: "", username: vars.username ?? "" },
    ),
    buttons,
  };
}

/**
 * Step 3 — the editor link, once the gate is passed.
 *
 * One message, no buttons, and both of those are deliberate. A link button
 * makes Instagram render the message as a card, and a card's text is capped
 * at 80 characters, so anything longer is split into two bubbles — a wall of
 * text followed by a lone button. For a message whose whole content *is* a
 * link people are going to tap or copy, one plain bubble reads better than
 * two.
 *
 * What it sends is the editor, not the invitation: at this point there is no
 * published page to send. The public link follows later, on the tap of
 * Publish (see buildPublishedStep).
 */
export function buildLinkStep(
  settings: FlowSettings,
  vars: { link: string; username?: string | null; alreadyClaimed?: boolean },
): FlowStep {
  return {
    text: renderInstagramTemplate(
      vars.alreadyClaimed ? settings.duplicateMessage : settings.linkMessage,
      { link: vars.link, username: vars.username ?? "" },
    ),
    buttons: [],
  };
}

/**
 * Step 4 — the invitation itself, sent when they publish it.
 *
 * The one message the flow doesn't send in reply to anything: it is triggered
 * by the couple hitting Publish, minutes or days after the conversation went
 * quiet. Same single-bubble reasoning as above.
 */
export function buildPublishedStep(
  settings: FlowSettings,
  vars: { link: string; username?: string | null },
): FlowStep {
  return {
    text: renderInstagramTemplate(settings.publishedMessage, {
      link: vars.link,
      username: vars.username ?? "",
    }),
    buttons: [],
  };
}

/**
 * The same step written out for a thread where the buttons didn't render.
 *
 * Private replies to comments don't always carry quick replies, and a send
 * that Instagram rejects would otherwise leave the person holding a message
 * with no way forward. The button titles become something to type instead,
 * which `matchFlowTextReply` then understands.
 */
export function toPlainText(step: FlowStep) {
  const typeable = step.buttons.filter((button) => button.type === "postback");
  if (typeable.length === 0) return step.text;

  const options = typeable.map((button) => `“${button.title}”`).join(" or ");
  return `${step.text}\n\nReply ${options} to continue.`;
}

function normalise(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      // Labels carry emoji ("I'm following ✅") that nobody retypes, and the
      // apostrophe arrives as either ' or ’ depending on the keyboard.
      .replace(/[’']/g, "'")
      .replace(/[^a-z0-9' ]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * A typed message read as a tap.
 *
 * Tapping a quick reply echoes its title into the thread, so this also
 * covers the case where the echo reaches us without its payload — and the
 * case where someone simply types what the button says.
 */
export function matchFlowTextReply(
  text: string,
  settings: FlowSettings,
): FlowTap | null {
  const message = normalise(text);
  if (!message) return null;

  if (message === normalise(settings.openerButtonLabel)) return "CTA";
  if (message === normalise(settings.followButtonLabel)) return "FOLLOWING";
  return null;
}
