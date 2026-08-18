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

export function isInstagramSendConfigured() {
  return Boolean(process.env.IG_ACCESS_TOKEN);
}

export async function sendInstagramMessage(
  recipient: InstagramRecipient,
  text: string,
): Promise<{ delivered: boolean; devMode: boolean }> {
  if (!isInstagramSendConfigured()) {
    console.log(`[instagram:dev-mode] to=${JSON.stringify(recipient)}\n${text}`);
    return { delivered: false, devMode: true };
  }

  const response = await fetch(
    "https://graph.instagram.com/v21.0/me/messages",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient, message: { text } }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error(`Instagram send failed (${response.status}): ${errorText}`);
    return { delivered: false, devMode: false };
  }

  return { delivered: true, devMode: false };
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
        typeof data.is_user_follow_business === "boolean" ? data.is_user_follow_business : null,
      username: data.username,
    };
  } catch (error) {
    console.error("Instagram follow check threw", error);
    return { isFollower: null };
  }
}
