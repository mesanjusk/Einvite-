"use client";

/** Best-effort click counter. Never blocks navigation or asks for guest details. */
export function trackInvitationGrowth(slug: string, action: "REFERRAL_CLICK" | "CLICK_INSTAGRAM" | "PRINT_ENQUIRY" | "STORY_SHARE") {
  if (!slug || typeof window === "undefined") return;
  try {
    void fetch("/api/growth/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, action }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // An analytics outage must never block access to an invitation.
  }
}
