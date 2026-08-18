import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_BRAND_NAME, SUPPORT_EMAIL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Data Deletion Request",
  description: `How to request deletion of your Instagram data from ${LEGAL_BRAND_NAME}.`,
};

export default function DataDeletionPage() {
  return (
    <LegalPage title="Data Deletion Request">
      <p>To delete your Instagram data from {LEGAL_BRAND_NAME}:</p>

      <ol>
        <li>
          <strong>Option 1:</strong> Email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with subject &ldquo;DELETE&rdquo;
          and your Instagram username
        </li>
        <li>
          <strong>Option 2:</strong> DM us &ldquo;DELETE&rdquo; on Instagram
        </li>
      </ol>

      <p>
        We will delete your Instagram user ID, username, stored follower status, comment
        records, and your invitation with its access link within 7 business days, and confirm
        via reply.
      </p>
    </LegalPage>
  );
}
