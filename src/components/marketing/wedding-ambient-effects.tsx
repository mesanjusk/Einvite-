"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const PETALS = [
  { left: "6%", delay: "-1.4s", duration: "8.2s", size: 13 },
  { left: "18%", delay: "-4.8s", duration: "9.4s", size: 10 },
  { left: "34%", delay: "-2.1s", duration: "7.8s", size: 12 },
  { left: "52%", delay: "-6.2s", duration: "10.2s", size: 11 },
  { left: "70%", delay: "-3.6s", duration: "8.9s", size: 14 },
  { left: "87%", delay: "-7.1s", duration: "9.8s", size: 10 },
];

const CONFETTI = [
  { left: "10%", delay: "-2.2s", duration: "9.6s", rotate: "18deg" },
  { left: "27%", delay: "-6.3s", duration: "11.2s", rotate: "-24deg" },
  { left: "45%", delay: "-3.8s", duration: "10.4s", rotate: "35deg" },
  { left: "63%", delay: "-8.1s", duration: "12s", rotate: "-12deg" },
  { left: "81%", delay: "-4.7s", duration: "10.8s", rotate: "28deg" },
];

const SPARKLES = [
  { left: "12%", top: "18%", delay: "-1.1s" },
  { left: "29%", top: "62%", delay: "-3.3s" },
  { left: "54%", top: "12%", delay: "-2.4s" },
  { left: "76%", top: "48%", delay: "-4.7s" },
  { left: "91%", top: "25%", delay: "-0.8s" },
];

type WeddingMusicStateDetail = {
  playing?: boolean;
  muted?: boolean;
};

export function WeddingAmbientEffects({
  variant = "browser",
  className,
  reactToMusic = false,
}: {
  variant?: "browser" | "viewer";
  className?: string;
  reactToMusic?: boolean;
}) {
  const [musicActive, setMusicActive] = useState(false);

  useEffect(() => {
    if (!reactToMusic) return;

    const onState = (event: Event) => {
      const detail = (event as CustomEvent<WeddingMusicStateDetail>).detail;
      setMusicActive(Boolean(detail?.playing && !detail?.muted));
    };

    window.addEventListener("wedding-music-state", onState);
    return () => window.removeEventListener("wedding-music-state", onState);
  }, [reactToMusic]);

  return (
    <div
      aria-hidden="true"
      data-ambient-variant={variant}
      data-music-active={musicActive ? "true" : "false"}
      className={cn(
        "wedding-ambient pointer-events-none overflow-hidden",
        variant === "viewer" ? "fixed inset-0 z-[6]" : "absolute inset-0 z-[1]",
        className,
      )}
    >
      <div className="wedding-ambient-glow wedding-ambient-glow-a" />
      <div className="wedding-ambient-glow wedding-ambient-glow-b" />

      {PETALS.map((petal, index) => (
        <span
          key={`petal-${index}`}
          className="wedding-ambient-petal"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size * 1.6,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        />
      ))}

      {CONFETTI.map((piece, index) => (
        <span
          key={`confetti-${index}`}
          className={`wedding-ambient-confetti wedding-ambient-confetti-${(index % 3) + 1}`}
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            rotate: piece.rotate,
          }}
        />
      ))}

      {SPARKLES.map((sparkle, index) => (
        <span
          key={`sparkle-${index}`}
          className="wedding-ambient-sparkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: sparkle.delay,
          }}
        >
          ✦
        </span>
      ))}

      {variant === "viewer" && (
        <div className="wedding-music-bloom">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
