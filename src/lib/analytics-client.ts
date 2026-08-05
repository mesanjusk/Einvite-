"use client";

export function trackInviteEvent(
  invitationId: string,
  type: "SHARE" | "CLICK_MAPS" | "CLICK_REGISTRY" | "CLICK_INSTAGRAM",
) {
  const body = JSON.stringify({ invitationId, type });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/track",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
