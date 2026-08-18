import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_ADDRESS, LEGAL_BRAND_NAME, SUPPORT_EMAIL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${LEGAL_BRAND_NAME}.`,
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact">
      <p>{LEGAL_BRAND_NAME}</p>

      <h2>Email</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>

      <h2>Address</h2>
      <p>{LEGAL_ADDRESS}</p>
    </LegalPage>
  );
}
