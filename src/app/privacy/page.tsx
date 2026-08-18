import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_BRAND_NAME, SUPPORT_EMAIL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${LEGAL_BRAND_NAME}'s Instagram-powered free wedding invitation tool.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title={`Privacy Policy - ${LEGAL_BRAND_NAME}`} updated="Aug 18, 2026">
      <p>{LEGAL_BRAND_NAME} provides free wedding invitation videos.</p>

      <h2>Data We Collect from Instagram</h2>
      <p>
        When you comment &ldquo;FREE&rdquo; on our Instagram post, we collect your Instagram
        username, IG User ID, and comment text to send you a DM with your access link.
      </p>

      <h2>How We Use Data</h2>
      <ol>
        <li>Generate your unique auto-login link for the video editor</li>
        <li>Prevent abuse — limit 1 link per Instagram account</li>
        <li>Customer support via DM</li>
      </ol>

      <h2>Data Retention</h2>
      <p>Links expire in 48 hours. IG data is deleted from our database after 30 days.</p>

      <p>
        <strong>We do NOT access your password, followers, or post on your behalf.</strong>
      </p>

      <h2>Your Rights</h2>
      <p>
        To delete your data, visit{" "}
        <a href="/data-deletion">/data-deletion</a> or email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with subject &ldquo;DELETE
        INSTAGRAM DATA&rdquo;
      </p>

      <h2>Contact</h2>
      <p>{LEGAL_BRAND_NAME}, Chandrapur, Maharashtra, India</p>
    </LegalPage>
  );
}
