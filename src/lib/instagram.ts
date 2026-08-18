/**
 * Instagram Send API (Meta Graph API) — private replies to comments and DM
 * replies. When IG_ACCESS_TOKEN isn't configured — e.g. local dev — messages
 * are logged to the console instead of failing outright.
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
    `https://graph.facebook.com/v21.0/me/messages?access_token=${process.env.IG_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
