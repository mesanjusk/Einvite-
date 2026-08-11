"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useLocale } from "@/lib/i18n/locale-context";

const OPEN_DURATION_MS = 2500;
const RAY_COUNT = 14;
const RAY_ANGLES = Array.from({ length: RAY_COUNT }, (_, i) => (360 / RAY_COUNT) * i);

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
    if (opened) return;
    setOpened(true);
    setTimeout(() => {
      sessionStorage.setItem(storageKey, "true");
      onComplete();
    }, OPEN_DURATION_MS);
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
        perspective: 1000,
      }}
    >
      <Flourish style={{ top: 24, left: 12 }} />
      <Flourish style={{ top: 24, right: 12, transform: "scaleX(-1)" }} />
      <Flourish style={{ bottom: 24, left: 12, transform: "scaleY(-1)" }} />
      <Flourish style={{ bottom: 24, right: 12, transform: "scale(-1,-1)" }} />

      {/* Warm light spilling out once the flap lifts, like peering inside the envelope. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={opened ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.9, delay: opened ? 0.15 : 0 }}
        style={{
          background:
            "radial-gradient(60% 45% at 50% 38%, color-mix(in srgb, var(--inv-secondary) 90%, white 10%) 0%, transparent 70%)",
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={opened ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
        transition={{ delay: opened ? 0 : 0.4, duration: 0.5 }}
        style={{ fontFamily: "var(--inv-font-script)", color: "var(--inv-secondary)" }}
        className="mb-7 text-3xl"
      >
        {t.tapToReveal}
      </motion.p>

      {/* A burst of light and sparks pours out once the flap lifts, like a small magic-portal moment. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute size-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #fff 0%, var(--inv-secondary, #fbf3e2) 40%, transparent 72%)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={opened ? { scale: [0, 3.4, 4.6], opacity: [0, 1, 0] } : { scale: 0, opacity: 0 }}
          transition={{ duration: 1.3, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute size-64 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, var(--inv-secondary, #fbf3e2) 10deg, transparent 22deg, transparent 70deg, var(--inv-accent) 80deg, transparent 92deg, transparent 150deg, var(--inv-secondary, #fbf3e2) 160deg, transparent 172deg, transparent 230deg, var(--inv-accent) 240deg, transparent 252deg, transparent 310deg, var(--inv-secondary, #fbf3e2) 320deg, transparent 332deg)",
            filter: "blur(3px)",
            mixBlendMode: "screen",
          }}
          initial={{ scale: 0.2, opacity: 0, rotate: 0 }}
          animate={
            opened
              ? { scale: [0.2, 1.15, 1.4], opacity: [0, 0.9, 0], rotate: 200 }
              : { scale: 0.2, opacity: 0 }
          }
          transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
        />
        {RAY_ANGLES.map((angle) => (
          <motion.span
            key={angle}
            className="absolute h-16 w-[3px] rounded-full"
            style={{
              background:
                "linear-gradient(to top, transparent, var(--inv-secondary, #fbf3e2), transparent)",
              rotate: angle,
              transformOrigin: "center 80px",
            }}
            initial={{ opacity: 0, scaleY: 0.3 }}
            animate={
              opened
                ? { opacity: [0, 1, 0], scaleY: [0.3, 1.4, 0.6] }
                : { opacity: 0, scaleY: 0.3 }
            }
            transition={{ duration: 0.9, delay: 0.4 + (angle / 360) * 0.25, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* The envelope flap: hinges open from the top, like a real envelope. */}
      <motion.div
        className="absolute top-[calc(50%-150px)] h-[150px] w-[210px] origin-top"
        style={{
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--inv-primary) 88%, white 12%), var(--inv-primary))",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          transformStyle: "preserve-3d",
        }}
        animate={opened ? { rotateX: -170 } : { rotateX: 0 }}
        transition={{ duration: 0.8, ease: [0.45, 0, 0.2, 1] }}
      />

      <motion.div
        animate={
          opened
            ? { y: -70, scale: 1.2, opacity: 0 }
            : { y: [0, -6, 0] }
        }
        transition={
          opened
            ? { duration: 1, delay: 0.5, ease: "easeIn" }
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
