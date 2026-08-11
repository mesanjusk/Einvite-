"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

import { fadeUp } from "@/lib/animation-variants";

/**
 * Generic "reveal on scroll" wrapper — pass any Framer Motion variants
 * (fadeUp, fadeLeft, scaleIn, blurReveal, rotateIn…) from
 * `@/lib/animation-variants`. Defaults to fadeUp.
 */
export function Reveal({
  children,
  variants = fadeUp,
  className,
  once = true,
  margin = "-80px",
  delay = 0,
  style,
}: {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  once?: boolean;
  margin?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      transition={delay ? { delay } : undefined}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className,
  once = true,
  margin = "-80px",
}: {
  children: ReactNode;
  className?: string;
  once?: boolean;
  margin?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
