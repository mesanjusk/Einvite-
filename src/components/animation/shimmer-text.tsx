"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Gold gradient shimmer text — used for couple names / key headings.
 * Reads --inv-primary / --inv-accent from the invite theme CSS vars.
 * Renders inline (a <span>) — wrap it in your own heading tag, e.g.
 * `<h1><ShimmerText>{brideName}</ShimmerText></h1>`.
 */
export function ShimmerText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--inv-primary), var(--inv-accent), var(--inv-shimmer-highlight, #ffe8a0), var(--inv-accent), var(--inv-primary))",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        display: "inline-block",
      }}
      animate={{ backgroundPosition: ["0% center", "200% center"] }}
      transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
