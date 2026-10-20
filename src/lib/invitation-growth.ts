/**
 * Acquisition markers describe a channel, never the identity of a guest.
 * An invitation's private "to" token and edit link are NEVER propagated.
 */
export type AcquisitionSource = "instagram" | "story" | "guest_invite" | "direct";
export const INSTAGRAM_PROFILE = "https://www.instagram.com/sanju.sk.digital/";
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_SK_DIGITAL_WHATSAPP_NUMBER ?? "919372633633").replace(/\D/g, "");
export const PRINT_ENQUIRY_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello SK Digital, I would like to enquire about printed wedding invitations and matching stationery.",
)}`;

export function normalizeAcquisitionSource(value: unknown): AcquisitionSource {
  return value === "instagram" || value === "story" || value === "guest_invite"
    ? value
    : "direct";
}

export function invitationStoryUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  // Don't copy personalized guest tokens or private edit parameters into Stories.
  url.search = "";
  url.hash = "";
  url.searchParams.set("via", "story");
  return url.toString();
}
