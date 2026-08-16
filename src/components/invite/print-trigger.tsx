"use client";

import { useEffect } from "react";

/**
 * Renders nothing — just opens the browser's print dialog once the page
 * (and its images) have actually loaded, so "Save as PDF" captures the
 * full invitation instead of a half-rendered page. Used by the
 * `?print=1` PDF-export flow: `/invite/[slug]?print=1`.
 */
export function PrintTrigger() {
  useEffect(() => {
    function triggerPrint() {
      setTimeout(() => window.print(), 500);
    }
    if (document.readyState === "complete") {
      triggerPrint();
    } else {
      window.addEventListener("load", triggerPrint, { once: true });
      return () => window.removeEventListener("load", triggerPrint);
    }
  }, []);

  return null;
}
