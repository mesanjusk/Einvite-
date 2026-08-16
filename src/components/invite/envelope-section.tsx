"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/lib/i18n/locale-context";

const OPEN_DURATION_MS = 2800;
// How long after tap the coded burst gets to play on its own before we
// consider swapping in the preloaded video, so the flap-open + first
// flash always shows instantly regardless of network speed.
const VIDEO_HANDOFF_DELAY_MS = 600;
// Safety net: if the video's "ended" event never fires (stalled
// connection, codec hiccup), don't leave the guest stuck on it.
const VIDEO_MAX_MS = 8000;
const RAY_COUNT = 14;
const RAY_ANGLES = Array.from({ length: RAY_COUNT }, (_, i) => (360 / RAY_COUNT) * i);
const SPARK_COUNT = 20;
const SPARKS = Array.from({ length: SPARK_COUNT }, (_, i) => ({
  angle: (360 / SPARK_COUNT) * i + (i % 2 === 0 ? 6 : -6),
  distance: 90 + ((i * 37) % 60),
  delay: 0.45 + ((i * 13) % 40) / 100,
}));

// A faint repeating floral motif across the whole envelope face — the
// reference shows an all-over embossed damask texture, not just corner
// flourishes. Encoded as an inline SVG tile so it needs no extra asset.
const EMBOSS_TILE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <g fill="none" stroke="white" stroke-width="1.4" opacity="0.5">
        <path d="M60 26c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14z" />
        <path d="M60 4v22M60 94v22M4 60h22M94 60h22" />
        <path d="M22 22c6 6 6 16 0 22M98 22c-6 6-6 16 0 22M22 98c6-6 6-16 0-22M98 98c-6-6-6-16 0-22" />
      </g>
    </svg>`,
  );

function EmbossPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url("${EMBOSS_TILE}")`,
        backgroundSize: "120px 120px",
        backgroundRepeat: "repeat",
        opacity: 0.05,
        mixBlendMode: "overlay",
      }}
    />
  );
}

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
  videoUrl,
  onComplete,
}: {
  initials: string;
  /** Optional short muted clip (theme-level) layered over the coded burst
   * once it's preloaded — never blocks the reveal if it isn't ready in time. */
  videoUrl?: string | null;
  onComplete: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (!videoUrl) return;
    videoRef.current?.load();
  }, [videoUrl]);

  function handleTap() {
    if (opened) return;
    setOpened(true);

    const video = videoRef.current;
    const videoLikelyReady = Boolean(videoUrl && video && video.readyState >= 3);

    if (!videoLikelyReady) {
      setTimeout(onComplete, OPEN_DURATION_MS);
      return;
    }

    setTimeout(() => {
      if (!video) {
        onComplete();
        return;
      }
      setShowVideo(true);
      video.currentTime = 0;
      video.play().catch(() => {
        setShowVideo(false);
        onComplete();
      });

      let finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        clearTimeout(safety);
        onComplete();
      }
      const safety = setTimeout(finish, VIDEO_MAX_MS);
      video.addEventListener("ended", finish, { once: true });
    }, VIDEO_HANDOFF_DELAY_MS);
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
      <EmbossPattern />
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
        {/* A second, counter-rotating ring layered behind the first — the interference
            between the two spinning conic gradients reads like a blooming flower,
            echoing the reference animation's swirl-into-rose moment. */}
        <motion.div
          className="absolute size-72 rounded-full"
          style={{
            background:
              "conic-gradient(from 40deg, transparent 0deg, var(--inv-accent) 14deg, transparent 30deg, transparent 100deg, var(--inv-secondary, #fbf3e2) 112deg, transparent 128deg, transparent 190deg, var(--inv-accent) 202deg, transparent 218deg, transparent 280deg, var(--inv-secondary, #fbf3e2) 292deg, transparent 308deg)",
            filter: "blur(4px)",
            mixBlendMode: "screen",
          }}
          initial={{ scale: 0.15, opacity: 0, rotate: 0 }}
          animate={
            opened
              ? { scale: [0.15, 1.3, 1.7], opacity: [0, 0.75, 0], rotate: -260 }
              : { scale: 0.15, opacity: 0 }
          }
          transition={{ duration: 1.7, delay: 0.5, ease: "easeOut" }}
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
        {/* A shower of sparks spiraling outward as the ring spins up — small
            glints instead of one big flash, matching the granular sparkle
            trail in the reference. */}
        {SPARKS.map((spark, i) => {
          const rad = (spark.angle * Math.PI) / 180;
          return (
            <motion.span
              key={i}
              className="absolute size-1.5 rounded-full"
              style={{ background: "var(--inv-secondary, #fbf3e2)", boxShadow: "0 0 6px 1px var(--inv-secondary, #fbf3e2)" }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={
                opened
                  ? {
                      x: [0, Math.cos(rad) * spark.distance],
                      y: [0, Math.sin(rad) * spark.distance],
                      opacity: [0, 1, 0],
                      scale: [0.4, 1, 0.6],
                    }
                  : { x: 0, y: 0, opacity: 0 }
              }
              transition={{ duration: 1.1, delay: spark.delay, ease: "easeOut" }}
            />
          );
        })}
      </div>

      {/* A soft white-gold dissolve, right before the invitation content takes over —
          mirrors the burst fading through white in the reference animation. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 42%, #fffaf0 0%, #fbf3e2 55%, transparent 100%)" }}
        initial={{ opacity: 0 }}
        animate={opened ? { opacity: [0, 0, 1] } : { opacity: 0 }}
        transition={{ duration: OPEN_DURATION_MS / 1000, times: [0, 0.72, 1], ease: "easeIn" }}
      />

      {/* The envelope flap: hinges open from the top, like a real envelope.
          Built as a CSS border-triangle rather than clip-path — Chromium has
          a long-standing bug where clip-path silently freezes 3D transforms
          on the clipped element, which made the flap visually static here. */}
      <motion.div
        className="absolute top-[calc(50%-150px)] size-0 origin-top"
        style={{
          borderLeft: "105px solid transparent",
          borderRight: "105px solid transparent",
          borderTop: "150px solid var(--inv-primary)",
          filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.25))",
          backfaceVisibility: "hidden",
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
        initial={{ opacity: 0, y: 10 }}
        animate={opened ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
        transition={{ delay: opened ? 0 : 0.4, duration: 0.5 }}
        style={{ fontFamily: "var(--inv-font-script)", color: "var(--inv-secondary)" }}
        className="mt-7 text-3xl"
      >
        {t.tapToReveal}
      </motion.p>

      <motion.p
        animate={opened ? { opacity: 0 } : { opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        style={{ color: "var(--inv-accent)" }}
        className="mt-8 text-[11px] tracking-[0.35em]"
      >
        ✦
      </motion.p>

      {videoUrl && (
        <motion.video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 size-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: showVideo ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ pointerEvents: "none" }}
        />
      )}
    </motion.div>
  );
}
