"use client";

import { useEffect } from "react";

/** Session-local attribution; never stores guest tokens, emails, or contacts. */
export function GrowthAttribution() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("via") === "story") {
        sessionStorage.setItem("sk_invite_acquisition", "story");
      } else if (params.get("utm_source")?.toLowerCase() === "instagram") {
        sessionStorage.setItem("sk_invite_acquisition", "instagram");
      }
    } catch {
      // Storage may be unavailable in privacy-oriented browsers.
    }
  }, []);
  return null;
}
