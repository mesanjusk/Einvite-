"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Variants, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Video } from "lucide-react";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { PetalField } from "@/components/animation/petal-field";
import { fadeUp, scaleIn, rotateIn, blurReveal } from "@/lib/animation-variants";
import { useLocale } from "@/lib/i18n/locale-context";
import type { InviteMedia } from "./types";

const ANIMATION_MAP: Record<string, Variants> = {
  fade: fadeUp,
  slide: fadeUp,
  zoom: scaleIn,
  flip: rotateIn,
  blur: blurReveal,
};

// A brief pulse once the last photo has scrolled into view — mirrors the
// "loading…" beat between sections that reads as content catching up, then
// settles before the next section reveals.
const LOADING_PULSE: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: [0, 1, 1, 0],
    transition: { duration: 1.2, times: [0, 0.2, 0.75, 1], ease: "easeInOut" },
  },
};

const STACK_LIMIT = 8;
// Alternating tilt for each card in the pile, so it reads as a tossed stack of prints rather than a rigid grid.
const ROTATIONS = [-4, 3, -3, 5, -2, 4, -5, 2];

export function GallerySection({
  media,
  storyHeadline,
  coverPhoto,
  animation = "fade",
}: {
  media: InviteMedia[];
  storyHeadline: string;
  coverPhoto: string | null;
  animation?: string;
}) {
  const { t } = useLocale();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const stackItems: InviteMedia[] = coverPhoto
    ? [{ id: "cover", url: coverPhoto, caption: null }, ...media]
    : media;
  if (stackItems.length === 0) return null;

  const visibleItems = stackItems.slice(0, STACK_LIMIT);
  const overflowCount = stackItems.length - visibleItems.length;
  const variants = ANIMATION_MAP[animation] ?? fadeUp;

  function openAt(index: number) {
    setActiveIndex(index);
  }

  function step(delta: number) {
    setActiveIndex((current) => {
      if (current === null) return current;
      const next = (current + delta + stackItems.length) % stackItems.length;
      return next;
    });
  }

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.x < -60) step(1);
    else if (info.offset.x > 60) step(-1);
  }

  return (
    <section
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-7 py-16 text-center"
      style={{ background: "var(--inv-background)" }}
    >
      <PetalField count={12} seed={31} />

      <RevealGroup className="relative z-[2] w-full">
        <Reveal variants={fadeUp}>
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "var(--inv-accent)" }}>
            {t.ourStory}
          </p>
        </Reveal>
        <Reveal variants={fadeUp}>
          <h2
            className="mt-1.5 mb-3 text-[48px]"
            style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
          >
            {storyHeadline}
          </h2>
        </Reveal>

        {/* A tossed pile of polaroids: each one scroll-reveals stacked on the last, with a bounce on tap. */}
        <div className="mx-auto flex w-[78%] max-w-[280px] flex-col items-center">
          {visibleItems.map((item, i) => (
            <Reveal
              key={item.id}
              variants={variants}
              delay={i * 0.1}
              className="relative w-full"
              // Each card overlaps the one before it (but not by too much — enough gap keeps
              // each card's scroll-into-view trigger point separate, so they reveal one at a
              // time rather than all firing together).
              style={i === 0 ? undefined : { marginTop: "-58%" }}
            >
              <motion.button
                type="button"
                onClick={() => openAt(i)}
                whileTap={{ scale: 0.94, rotate: 0 }}
                whileHover={{ scale: 1.02 }}
                animate={{ rotate: ROTATIONS[i % ROTATIONS.length] }}
                style={{ zIndex: i, transformOrigin: "center" }}
                className="relative block w-full cursor-pointer touch-manipulation rounded p-2.5 pb-7"
                aria-label="View photo"
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded"
                  style={{ background: "#fff", boxShadow: "0 14px 30px rgba(0,0,0,0.22)" }}
                />
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
                  {item.type === "VIDEO" ? (
                    <>
                      <video
                        src={item.url}
                        muted
                        loop
                        autoPlay
                        playsInline
                        preload="metadata"
                        className="size-full object-cover"
                      />
                      <Video className="absolute top-2 right-2 size-4 text-white drop-shadow" />
                    </>
                  ) : (
                    <Image src={item.url} alt="" fill className="object-cover" unoptimized />
                  )}
                </div>
              </motion.button>
            </Reveal>
          ))}

          {overflowCount > 0 && (
            <Reveal
              variants={fadeUp}
              delay={visibleItems.length * 0.1}
              className="relative w-full"
              style={{ marginTop: "-58%" }}
            >
              <button
                type="button"
                onClick={() => openAt(STACK_LIMIT)}
                style={{ zIndex: visibleItems.length }}
                className="relative flex aspect-[4/5] w-full items-center justify-center rounded p-2.5 text-sm font-medium"
                aria-label={`View ${overflowCount} more photos`}
              >
                <div
                  className="absolute inset-0 rounded"
                  style={{ background: "#fff", boxShadow: "0 14px 30px rgba(0,0,0,0.22)" }}
                />
                <span className="relative" style={{ color: "var(--inv-primary)" }}>
                  +{overflowCount} more
                </span>
              </button>
            </Reveal>
          )}
        </div>

        <Reveal
          variants={LOADING_PULSE}
          delay={(overflowCount > 0 ? visibleItems.length + 1 : visibleItems.length) * 0.1 + 0.2}
          className="mt-6 flex items-center justify-center gap-2"
        >
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full"
                style={{ background: "var(--inv-accent)" }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </span>
          <span
            className="text-[11px] tracking-[0.2em] uppercase"
            style={{ color: "var(--inv-accent)" }}
          >
            {t.loadingMore}
          </span>
        </Reveal>
      </RevealGroup>

      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIndex(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-6"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeIndex}
                drag={stackItems.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className="relative aspect-[4/5] w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {stackItems[activeIndex]?.type === "VIDEO" ? (
                  <video
                    src={stackItems[activeIndex]?.url}
                    muted
                    loop
                    autoPlay
                    playsInline
                    controls
                    className="pointer-events-auto size-full rounded-lg object-cover"
                  />
                ) : (
                  <Image
                    src={stackItems[activeIndex]?.url}
                    alt=""
                    fill
                    className="pointer-events-none rounded-lg object-cover"
                    unoptimized
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {stackItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="Previous photo"
                  className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white sm:left-6"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="Next photo"
                  className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white sm:right-6"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Close"
              className="absolute top-6 right-6 flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X className="size-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
