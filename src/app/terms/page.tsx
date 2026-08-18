import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_BRAND_NAME } from "@/config/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${LEGAL_BRAND_NAME}'s free wedding invitation tool.`,
};

export default function TermsPage() {
  return (
    <LegalPage title={`Terms of Service - ${LEGAL_BRAND_NAME}`}>
      <p>By using our free tool via Instagram comment, you agree to:</p>
      <ol>
        <li>1 free video per Instagram account</li>
        <li>Links expire in 48 hours</li>
        <li>Do not share your personal link publicly</li>
        <li>We may discontinue the free service anytime</li>
      </ol>

      <p>We are not affiliated with Instagram. Instagram is a trademark of Meta.</p>
    </LegalPage>
  );
}
