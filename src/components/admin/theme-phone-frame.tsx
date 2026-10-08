"use client";

import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";

/** Keep the entire 390 × 780 phone visible; scale the design, never its layout. */
export function ThemePhoneFrame({ children, style, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  const region = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const element = region.current;
    if (!element) return;
    const fit = () => setScale(Math.max(0.1, Math.min(1, element.clientWidth / 390, element.clientHeight / 780)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={region} className="relative min-h-0 w-full flex-1 overflow-hidden" aria-label="Fit mobile preview to screen">
    <div {...props} data-theme-phone-frame className={`theme-phone-viewport absolute left-1/2 top-1/2 h-[780px] w-[390px] origin-center overflow-x-hidden overflow-y-auto rounded-[28px] border-[5px] border-violet-950 bg-white shadow-xl ${className}`} style={{ ...style, "--theme-preview-height": "770px", transform: `translate(-50%, -50%) scale(${scale})` } as CSSProperties}>{children}</div>
  </div>;
}
