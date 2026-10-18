"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Keep the customer's invitation experience at phone width on every screen. */
export function CustomerSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const marketingPages = new Set([
    "/",
    "/themes",
    "/contact",
    "/privacy",
    "/terms",
    "/data-deletion",
  ]);
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    marketingPages.has(pathname)
  ) {
    return children;
  }
  return <div className="customer-surface">{children}</div>;
}
