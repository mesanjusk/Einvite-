import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_ADDRESS, LEGAL_BRAND_NAME, SUPPORT_EMAIL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${LEGAL_BRAND_NAME}'s Instagram-powered free wedding invitation tool.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title={`Privacy Policy - ${LEGAL_BRAND_NAME}`} updated="Aug 18, 2026">
      <p>
        {LEGAL_BRAND_NAME} provides free wedding invitations — a shareable invitation
        website, a downloadable PDF, and a short video teaser.
      </p>

      <h2>Data We Collect from Instagram</h2>
      <p>
        When you comment the trigger word on one of our Instagram posts, we collect your
        Instagram username, Instagram user ID, and the text of that comment so we can
        reply with your access link.
      </p>
      <p>
        On posts where the offer is limited to followers, we also ask Instagram whether
        your account follows ours, and store that answer so we don&apos;t have to ask
        again on every comment.
      </p>

      <h2>How We Use Data</h2>
      <ol>
        <li>
          Create your invitation and send you a private link that signs you straight
          into it
        </li>
        <li>
          Prevent abuse — one invitation per Instagram account, which covers your
          website, PDF, and video
        </li>
        <li>Customer support via DM</li>
      </ol>

      <h2>Data Retention</h2>
      <p>
        Your access link stays valid so you can return and edit your invitation. Each
        time we send you the link, any previously sent link stops working. We keep your
        Instagram username, user ID, comment text, the direct messages you send us, and
        follower status for as long as your invitation exists, and delete them when you
        ask us to.
      </p>

      <p>
        <strong>
          We never see your password, read your private messages beyond the ones you
          send us, browse your follower list, or post anything on your behalf.
        </strong>
      </p>

      <h2>Your Rights</h2>
      <p>
        To delete your data, visit <a href="/data-deletion">/data-deletion</a> or email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with subject
        &ldquo;DELETE INSTAGRAM DATA&rdquo;
      </p>

      <h2>Contact</h2>
      <p>
        {LEGAL_BRAND_NAME}, {LEGAL_ADDRESS}
      </p>
    </LegalPage>
  );
}
