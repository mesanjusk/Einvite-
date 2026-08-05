import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env to send emails (magic links, RSVP notifications).",
    );
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "AI Wedding Invitation Studio <onboarding@resend.dev>";
