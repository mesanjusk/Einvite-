/**
 * WhatsApp delivery via the Meta (WhatsApp Business) Cloud API. When the
 * credentials aren't configured — e.g. local dev — messages are logged to
 * the console instead of failing outright, so the publish flow stays
 * testable end to end without a live WhatsApp Business account.
 */

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ delivered: boolean; devMode: boolean }> {
  if (!isWhatsAppConfigured()) {
    console.log(`[whatsapp:dev-mode] to=${to}\n${body}`);
    return { delivered: false, devMode: true };
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace("+", ""),
        type: "text",
        text: { body, preview_url: true },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error(`WhatsApp send failed (${response.status}): ${errorText}`);
    return { delivered: false, devMode: false };
  }

  return { delivered: true, devMode: false };
}

export function editLinkMessage(brideName: string, groomName: string, liveUrl: string, editUrl: string) {
  return `Your invitation for ${brideName} & ${groomName} is live!\n\nShare it with guests: ${liveUrl}\n\nKeep this link to edit or update it any time: ${editUrl}`;
}
