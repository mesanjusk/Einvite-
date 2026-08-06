"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useLocale } from "@/lib/i18n/locale-context";

function Flourish({ style }: { style: React.CSSProperties }) {
  return (
    <svg width="120" height="90" viewBox="0 0 120 90" style={{ position: "absolute", opacity: 0.35, ...style }}>
      <g fill="none" stroke="var(--inv-accent)" strokeWidth="1.5">
        <path d="M4 4 C 30 10, 40 30, 60 34" />
        <circle cx="60" cy="34" r="10" />
        <path d="M60 34 C 66 24, 78 20, 88 26" />
        <path d="M60 34 C 58 46, 66 54, 78 52" />
        <path d="M20 20 q6 -6 12 0 q -6 6 -12 0 Z" />
      </g>
    </svg>
  );
}

export function EnvelopeSection({
  initials,
  storageKey,
  onComplete,
}: {
  initials: string;
  storageKey: string;
  onComplete: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) {
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTap() {
    setOpened(true);
    setTimeout(() => {
      sessionStorage.setItem(storageKey, "true");
      onComplete();
    }, 1600);
  }

  return (
    <motion.div
      onClick={handleTap}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--inv-primary) 80%, white 8%) 0%, var(--inv-primary) 45%, color-mix(in srgb, var(--inv-primary) 70%, black 30%) 100%)",
      }}
    >
      <Flourish style={{ top: 24, left: 12 }} />
      <Flourish style={{ top: 24, right: 12, transform: "scaleX(-1)" }} />
      <Flourish style={{ bottom: 24, left: 12, transform: "scaleY(-1)" }} />
      <Flourish style={{ bottom: 24, right: 12, transform: "scale(-1,-1)" }} />

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{ fontFamily: "var(--inv-font-script)", color: "var(--inv-secondary)" }}
        className="mb-7 text-3xl"
      >
        {t.tapToReveal}
      </motion.p>

      <motion.div
        animate={opened ? { y: -60, scale: 1.15, opacity: 0 } : { y: [0, -6, 0] }}
        transition={
          opened
            ? { duration: 0.9, ease: "easeIn" }
            : { y: { repeat: Infinity, duration: 3.2, ease: "easeInOut" } }
        }
        className="relative flex size-[150px] items-center justify-center rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #fbf3e2, #eaddc0 70%, #d8c69f 100%)",
          boxShadow:
            "inset 0 2px 6px rgba(255,255,255,0.6), inset 0 -6px 14px rgba(90,60,20,0.35), 0 12px 24px rgba(0,0,0,0.35)",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 132 132" className="absolute">
          <circle cx="66" cy="66" r="58" fill="none" stroke="#b89a63" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
        </svg>
        <span
          style={{ fontFamily: "var(--inv-font-script)", color: "var(--inv-primary)" }}
          className="text-4xl"
        >
          {initials}
        </span>
      </motion.div>

      <motion.p
        animate={opened ? { opacity: 0 } : { opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        style={{ color: "var(--inv-accent)" }}
        className="mt-8 text-[11px] tracking-[0.35em]"
      >
        ✦
      </motion.p>
    </motion.div>
  );
}
