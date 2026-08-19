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
          <strong>DM us &ldquo;DELETE&rdquo; on Instagram.</strong> This is immediate
          and automatic — your data is erased within seconds and we reply to confirm.
        </li>
        <li>
          <strong>Disconnect the app</strong> from your Instagram settings. We treat
          that as a deletion request and erase your data straight away, without you
          asking twice.
        </li>
        <li>
          <strong>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </strong>{" "}
          with subject &ldquo;DELETE&rdquo; and your Instagram username, if you would
          rather not use Instagram. We action these within 7 business days.
        </li>
      </ol>

      <p>
        Deletion removes your Instagram user ID, your username, your stored follower
        status, every comment of yours we logged, the direct messages you sent us, and
        your invitation together with its access link, photos, events, and guest list.
        It cannot be undone — the invitation link stops working immediately. You are
        welcome to start again at any time by commenting on one of our posts.
      </p>
    </LegalPage>
  );
}
