"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <motion.div
      className="no-print"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: 3,
        height: "100vh",
        background:
          "linear-gradient(180deg, var(--inv-accent), var(--inv-shimmer-highlight, #f0d080))",
        transformOrigin: "top",
        scaleY,
        zIndex: 9999,
      }}
    />
  );
}
