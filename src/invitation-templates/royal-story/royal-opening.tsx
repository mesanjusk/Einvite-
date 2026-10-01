"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import type { InviteData } from "@/components/invite/types";

const OPENING_FALLBACK_MS = 2400;
const INTRO_MAX_MS = 7000;

export function RoyalOpening({
  invite,
  onComplete,
}: {
  invite: InviteData;
  onComplete: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!invite.revealVideoUrl && !invite.revealVideoWebmUrl) return;
    videoRef.current?.load();
  }, [invite.revealVideoUrl, invite.revealVideoWebmUrl]);

  function open() {
    if (started) return;
    setStarted(true);

    const video = videoRef.current;
    const hasVideo = Boolean(
      (invite.revealVideoUrl || invite.revealVideoWebmUrl) &&
        video &&
        video.readyState >= 3,
    );

    if (!hasVideo) {
      window.setTimeout(onComplete, OPENING_FALLBACK_MS);
      return;
    }

    window.setTimeout(() => {
      if (!video) {
        onComplete();
        return;
      }

      setShowVideo(true);
      video.currentTime = 0;

      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;
        window.clearTimeout(safety);
        onComplete();
      };
      const safety = window.setTimeout(finish, INTRO_MAX_MS);

      video.addEventListener("ended", finish, { once: true });
      video.play().catch(() => {
        setShowVideo(false);
        finish();
      });
    }, 420);
  }

  const initials =
    (invite.brideName[0] ?? "") + (invite.groomName[0] ?? "");

  return (
    <motion.div
      onClick={open}
      exit={{ opacity: 0, scale: 1.025 }}
      transition={{ duration: 0.55 }}
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 25%, #7a1f35 0%, #3d0716 58%, #170308 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #f3d58a 0 1px, transparent 1.4px), radial-gradient(circle at 70% 65%, #f3d58a 0 1px, transparent 1.4px)",
          backgroundSize: "42px 42px, 56px 56px",
        }}
      />

      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 border-r border-[#c99b47]/25"
        style={{
          background:
            "linear-gradient(90deg, #360713 0%, #5d1022 80%, #671326 100%)",
          transformOrigin: "left center",
        }}
        animate={started ? { x: "-102%", rotateY: -14 } : { x: 0 }}
        transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 border-l border-[#c99b47]/25"
        style={{
          background:
            "linear-gradient(270deg, #360713 0%, #5d1022 80%, #671326 100%)",
          transformOrigin: "right center",
        }}
        animate={started ? { x: "102%", rotateY: 14 } : { x: 0 }}
        transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="relative z-10 grid size-40 place-items-center rounded-full border-[3px] border-[#e0bd72] shadow-[0_20px_60px_rgba(0,0,0,.45)]"
        style={{
          background:
            "radial-gradient(circle at 35% 28%, #d9b66f, #9f6d2d 58%, #674116)",
        }}
        animate={
          started
            ? {
                scale: [1, 1.12, 0.75],
                rotate: [0, -4, 10],
                opacity: [1, 1, 0],
              }
            : { y: [0, -7, 0] }
        }
        transition={
          started
            ? { duration: 1.05, ease: "easeInOut" }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <div className="grid size-32 place-items-center rounded-full border border-[#4a210b]/45">
          <span
            className="text-5xl text-[#3f1120]"
            style={{ fontFamily: "var(--inv-font-script)" }}
          >
            {initials || "✦"}
          </span>
        </div>
      </motion.div>

      {!started && (
        <div className="absolute bottom-[18%] z-10 text-center text-[#f4deb1]">
          <p className="text-[10px] font-semibold tracking-[0.35em] uppercase">
            A celebration awaits
          </p>
          <p
            className="mt-3 text-3xl"
            style={{ fontFamily: "var(--inv-font-script)" }}
          >
            Tap the seal to begin
          </p>
        </div>
      )}

      {(invite.revealVideoUrl || invite.revealVideoWebmUrl) && (
        <motion.video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster={invite.revealVideoPosterUrl ?? undefined}
          className="absolute inset-0 size-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: showVideo ? 1 : 0 }}
          transition={{ duration: 0.35 }}
          style={{ pointerEvents: "none" }}
        >
          {invite.revealVideoWebmUrl && (
            <source src={invite.revealVideoWebmUrl} type="video/webm" />
          )}
          {invite.revealVideoUrl && (
            <source src={invite.revealVideoUrl} type="video/mp4" />
          )}
        </motion.video>
      )}
    </motion.div>
  );
}
