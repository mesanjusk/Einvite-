/**
 * Instagram Send API — private replies to comments and DM replies. When
 * IG_ACCESS_TOKEN isn't configured — e.g. local dev — messages are logged to
 * the console instead of failing outright.
 *
 * Uses graph.instagram.com (not graph.facebook.com): this app is set up with
 * the "Instagram API with Instagram Login" product, whose IGAA-prefixed
 * Instagram-scoped tokens are only accepted by the Instagram host. Sending
 * one to graph.facebook.com fails with "Cannot parse access token" (code 190).
 */

type InstagramRecipient = { comment_id: string } | { id: string };

/**
 * Fills an admin-written reply in. Shared by comment automations and DM
 * rules so a placeholder means the same thing wherever it is typed.
 */
export function renderInstagramTemplate(
  template: string,
  vars: { link: string; username: string },
) {
  return template
    .replaceAll("{{link}}", vars.link)
    .replaceAll("{{username}}", vars.username);
}

export function isInstagramSendConfigured() {
  return Boolean(process.env.IG_ACCESS_TOKEN);
}

export type InstagramSendResult = { delivered: boolean; devMode: boolean };

async function postMessage(
  recipient: InstagramRecipient,
  message: Record<string, unknown>,
): Promise<InstagramSendResult> {
  const response = await fetch("https://graph.instagram.com/v21.0/me/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient, message }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error(`Instagram send failed (${response.status}): ${errorText}`);
    return { delivered: false, devMode: false };
  }

  return { delivered: true, devMode: false };
}

export async function sendInstagramMessage(
  recipient: InstagramRecipient,
  text: string,
): Promise<InstagramSendResult> {
  if (!isInstagramSendConfigured()) {
    console.log(`[instagram:dev-mode] to=${JSON.stringify(recipient)}\n${text}`);
    return { delivered: false, devMode: true };
  }

  return postMessage(recipient, { text });
}

/**
 * A tappable button under a message.
 *
 * `postback` is a button we handle ourselves: tapping it sends us `payload`
 * and echoes `title` back into the thread as if the person had typed it.
 * `url` just opens a link and tells us nothing, so it is only ever used for
 * somewhere we don't need to react to — the profile, or the invite itself.
 */
export type InstagramButton =
  | { type: "postback"; title: string; payload: string }
  | { type: "url"; title: string; url: string };

// Instagram's own caps: a quick reply title, a generic template's title, and
// the number of buttons one template element may carry.
const QUICK_REPLY_TITLE_LIMIT = 20;
const TEMPLATE_TITLE_LIMIT = 80;
const TEMPLATE_BUTTON_LIMIT = 3;
// The card's own title when the message is too long to *be* the title. Only
// ever seen right under the full text, which is sent as its own message.
const TEMPLATE_PROMPT = "Tap below 👇";

/**
 * A message with buttons under it.
 *
 * Two shapes, because Instagram gives buttons two different homes and
 * neither does both jobs:
 *
 * - Quick replies ride along with an ordinary text message, so the wording
 *   can be as long as it likes, and a tap comes back to us as a message with
 *   a payload. They cannot open a link.
 * - A generic template can carry link buttons, but its title is capped at 80
 *   characters, so a longer message is sent first in its own bubble and the
 *   card underneath carries only the buttons.
 *
 * So: link buttons mean a template, everything else stays a quick reply.
 */
export async function sendInstagramButtons(
  recipient: InstagramRecipient,
  text: string,
  buttons: InstagramButton[],
): Promise<InstagramSendResult> {
  if (buttons.length === 0) return sendInstagramMessage(recipient, text);

  if (!isInstagramSendConfigured()) {
    const labels = buttons.map((b) => `[${b.title}]`).join(" ");
    console.log(
      `[instagram:dev-mode] to=${JSON.stringify(recipient)}\n${text}\n${labels}`,
    );
    return { delivered: false, devMode: true };
  }

  if (buttons.every((button) => button.type === "postback")) {
    return postMessage(recipient, {
      text,
      quick_replies: buttons.map((button) => ({
        content_type: "text",
        title: button.title.slice(0, QUICK_REPLY_TITLE_LIMIT),
        payload: button.payload,
      })),
    });
  }

  const fitsAsTitle = text.length <= TEMPLATE_TITLE_LIMIT;
  let prefaceSent = false;
  if (!fitsAsTitle) {
    const preface = await sendInstagramMessage(recipient, text);
    // Sending the card after a message that never arrived would leave bare
    // buttons with nothing explaining them, so the failure stops here.
    if (!preface.delivered) return preface;
    prefaceSent = true;
  }

  const card = await postMessage(recipient, {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [
          {
            title: fitsAsTitle ? text : TEMPLATE_PROMPT,
            buttons: buttons
              .slice(0, TEMPLATE_BUTTON_LIMIT)
              .map((button) =>
                button.type === "url"
                  ? { type: "web_url", url: button.url, title: button.title }
                  : { type: "postback", title: button.title, payload: button.payload },
              ),
          },
        ],
      },
    },
  });

  // A card that Instagram rejects — Generic Templates are unreliable on IG
  // DMs, and a `web_url` button is a common trigger — must never look like
  // "nothing was sent". The caller's fallback for an undelivered result is to
  // resend the same text in plain form, and the text already went out as the
  // preface: doing that again would hand the person the identical message
  // twice, word for word. So once the preface has landed, the card's own
  // fate no longer decides the verdict — only whether the buttons made it.
  if (!card.delivered && prefaceSent) {
    console.error("Instagram button card rejected after its preface text sent");
    return { delivered: true, devMode: false };
  }

  return card;
}

/**
 * Whether an Instagram user follows the connected business account.
 *
 * There is no general "does user X follow account Y" lookup — the only
 * source is the messaging User Profile endpoint's is_user_follow_business
 * field, which Instagram only resolves for users it considers reachable
 * (typically those with an existing conversation). A commenter who has
 * never messaged the account often can't be resolved at all, which is why
 * `unknown` is a distinct result from `false` and callers are expected to
 * fail open on it.
 */
export async function fetchInstagramFollowStatus(
  igUserId: string,
): Promise<{ isFollower: boolean | null; username?: string }> {
  if (!isInstagramSendConfigured()) {
    console.log(`[instagram:dev-mode] follow-check skipped for ${igUserId}`);
    return { isFollower: null };
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${igUserId}?fields=username,is_user_follow_business`,
      { headers: { Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}` } },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`Instagram follow check failed (${response.status}): ${errorText}`);
      return { isFollower: null };
    }

    const data = (await response.json()) as {
      username?: string;
      is_user_follow_business?: boolean;
    };

    return {
      isFollower:
        typeof data.is_user_follow_business === "boolean"
          ? data.is_user_follow_business
          : null,
      username: data.username,
    };
  } catch (error) {
    console.error("Instagram follow check threw", error);
    return { isFollower: null };
  }
}

/**
 * A post or reel on the connected account, as the admin dashboard shows it.
 *
 * Media IDs arrive from webhooks as bare numbers like 18112141504901807,
 * which say nothing about which reel they are. Resolving them here is what
 * turns "an unautomated media ID" in the dashboard into a thumbnail, a
 * caption and a link an admin can actually recognise before writing a rule.
 */
export type InstagramMedia = {
  id: string;
  caption?: string;
  mediaType?: string;
  mediaProductType?: string;
  permalink?: string;
  thumbnailUrl?: string;
  timestamp?: string;
  commentsCount?: number;
};

const MEDIA_FIELDS =
  "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,comments_count";

// Thumbnails and captions change rarely and are read on every dashboard
// render, so they are cached rather than re-fetched per page view. Instagram
// CDN URLs are signed and expire in a few hours, well outside this window.
const MEDIA_CACHE_SECONDS = 15 * 60;

type RawMedia = {
  id?: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
};

function toMedia(raw: RawMedia): InstagramMedia | null {
  if (!raw.id) return null;
  return {
    id: raw.id,
    caption: raw.caption,
    mediaType: raw.media_type,
    mediaProductType: raw.media_product_type,
    // Videos and reels carry their still in thumbnail_url; media_url is the
    // video file itself, which is useless as an <img> source.
    thumbnailUrl:
      raw.thumbnail_url ?? (raw.media_type === "IMAGE" ? raw.media_url : undefined),
    permalink: raw.permalink,
    timestamp: raw.timestamp,
    commentsCount: raw.comments_count,
  };
}

/**
 * One media by ID. Returns null when the token is missing, the ID belongs to
 * another account, or Instagram simply can't resolve it — callers treat that
 * as "can't be identified" and still show the raw ID.
 */
export async function fetchInstagramMedia(
  mediaId: string,
): Promise<InstagramMedia | null> {
  if (!isInstagramSendConfigured()) return null;

  try {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${mediaId}?fields=${MEDIA_FIELDS}`,
      {
        headers: { Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}` },
        next: { revalidate: MEDIA_CACHE_SECONDS },
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`Instagram media lookup failed (${response.status}): ${errorText}`);
      return null;
    }

    return toMedia((await response.json()) as RawMedia);
  } catch (error) {
    console.error("Instagram media lookup threw", error);
    return null;
  }
}

/**
 * The account's most recent posts and reels, so an admin can pick the reel to
 * automate from thumbnails instead of hunting for an ID.
 */
export async function fetchRecentInstagramMedia(limit = 12): Promise<InstagramMedia[]> {
  if (!isInstagramSendConfigured()) return [];

  try {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/me/media?fields=${MEDIA_FIELDS}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}` },
        next: { revalidate: MEDIA_CACHE_SECONDS },
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`Instagram media list failed (${response.status}): ${errorText}`);
      return [];
    }

    const data = (await response.json()) as { data?: RawMedia[] };
    return (data.data ?? [])
      .map(toMedia)
      .filter((m): m is InstagramMedia => m !== null);
  } catch (error) {
    console.error("Instagram media list threw", error);
    return [];
  }
}
