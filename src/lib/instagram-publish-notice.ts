/**
 * The DM that goes out when an Instagram-claimed invitation is published.
 *
 * The flow hands over an *editor* link when someone taps through the follow
 * gate, because at that moment there is nothing else to hand over — the
 * invitation doesn't exist yet. The link their guests open only comes into
 * being when they press Publish, which is minutes or days later and is not a
 * reply to anything. So it is sent from here rather than from the webhook.
 *
 * Sent once, ever. Publishing is something people do repeatedly while
 * tweaking a date or swapping a photo, and a message on each of those would
 * turn a nice moment into a nuisance.
 */

import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { sendInstagramMessage } from "@/lib/instagram";
import { DEFAULT_FLOW_SETTINGS, buildPublishedStep } from "@/lib/instagram-flow";

/**
 * Tells the Instagram account behind this invitation that it is live.
 *
 * Never throws and never blocks publishing: whether a DM lands has nothing to
 * do with whether the invitation should go up, and Instagram refuses sends
 * outside a 24-hour window from the recipient's last message — so an
 * invitation finished days later simply can't be announced. That is logged
 * and dropped rather than retried or surfaced as a publish error.
 */
export async function notifyInstagramOwnerOfPublish(
  invitationId: string,
  slug: string,
): Promise<void> {
  try {
    const link = await db.instagramLink.findUnique({
      where: { invitationId },
      select: {
        id: true,
        igUserId: true,
        username: true,
        publishedNotifiedAt: true,
      },
    });

    // Not an Instagram invitation, or already announced.
    if (!link || link.publishedNotifiedAt) return;

    const settings = await db.instagramFlowSettings.findUnique({
      where: { key: "default" },
    });
    if (
      (settings?.notifyOnPublish ?? DEFAULT_FLOW_SETTINGS.notifyOnPublish) === false
    ) {
      return;
    }

    const step = buildPublishedStep(
      {
        ...DEFAULT_FLOW_SETTINGS,
        publishedMessage:
          settings?.publishedMessage || DEFAULT_FLOW_SETTINGS.publishedMessage,
      },
      {
        link: `${getAppUrl()}/invite/${slug}`,
        username: link.username,
      },
    );

    const { delivered } = await sendInstagramMessage({ id: link.igUserId }, step.text);

    // Stamped only on a delivered send, so a refusal inside the 24-hour rule
    // doesn't count as "announced" and lock out a later attempt.
    if (delivered) {
      await db.instagramLink.update({
        where: { id: link.id },
        data: { publishedNotifiedAt: new Date() },
      });
    } else {
      console.log(
        `[instagram-publish] not delivered for invitation=${invitationId} igUser=${link.igUserId} — outside the messaging window, or send rejected`,
      );
    }
  } catch (error) {
    console.error("Failed to announce a published invitation on Instagram", error);
  }
}
