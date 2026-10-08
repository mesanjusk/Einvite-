"use client";
import { useEffect, useRef } from "react";
import { contentCorrection } from "@/lib/content-bounds";
export function useContentBounds(revision: unknown) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = root.current; if (!frame) return;
    let raf = 0; let disposed = false;
    const layers = Array.from(frame.querySelectorAll<HTMLElement>("[data-inv-content-group], [data-theme-element]")).filter((node) => !node.parentElement?.closest("[data-theme-element]"));
    function fit() {
      if (!frame) return;
      const bounds = frame.getBoundingClientRect(); const scale = bounds.width / (frame.clientWidth || 1);
      if (!scale || !bounds.width) return;
      for (const node of layers) { node.style.setProperty("--inv-safe-x", "0px"); node.style.setProperty("--inv-safe-y", "0px"); }
      for (const node of layers.filter((layer) => layer.hasAttribute("data-inv-content-group"))) {
        node.style.setProperty("--inv-safe-scale", "1");
        const natural = node.getBoundingClientRect();
        node.style.setProperty("--inv-safe-scale", String(Math.min(1, (bounds.height - 16 * scale) / (natural.height || 1))));
      }
      // Move groups first, then individual layers; nested ThemeText is measured once.
      for (const node of layers) {
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const correction = contentCorrection(bounds, rect, 8 * scale);
        const parent = node.parentElement;
        const effectiveScale = node.hasAttribute("data-inv-content-group") ? scale : parent && parent.offsetWidth ? parent.getBoundingClientRect().width / parent.offsetWidth : scale;
        node.style.setProperty("--inv-safe-x", `${correction.x / (effectiveScale || scale)}px`);
        node.style.setProperty("--inv-safe-y", `${correction.y / (effectiveScale || scale)}px`);
      }
    }
    const schedule = () => { if (disposed) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); };
    const observer = new ResizeObserver(schedule); observer.observe(frame); for (const node of layers) observer.observe(node);
    schedule(); void document.fonts?.ready.then(schedule);
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); };
  }, [revision]);
  return root;
}
