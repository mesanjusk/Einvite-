"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X } from "lucide-react";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { PetalField } from "@/components/animation/petal-field";
import {
  fadeUp,
  fadeLeft,
  fadeRight,
  scaleIn,
  rotateIn,
  blurReveal,
} from "@/lib/animation-variants";
import { useLocale } from "@/lib/i18n/locale-context";
import type { InviteMedia } from "./types";

const ANIMATION_MAP: Record<string, Variants> = {
  fade: fadeUp,
  slide: fadeLeft,
  zoom: scaleIn,
  flip: rotateIn,
  blur: blurReveal,
};

function variantFor(animation: string, index: number): Variants {
  if (animation === "slide") return index % 2 === 0 ? fadeLeft : fadeRight;
  return ANIMATION_MAP[animation] ?? fadeUp;
}

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
  const photo = coverPhoto ?? media[0]?.url;
  if (!photo) return null;

  const gridPhotos = media.slice(1, 7);

  return (
    <section
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-7 py-12 text-center"
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
            className="mt-1.5 mb-8 text-[48px]"
            style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
          >
            {storyHeadline}
          </h2>
        </Reveal>

        <Reveal variants={variantFor(animation, 0)} className="relative mx-auto w-[78%] max-w-[280px]">
          <button
            type="button"
            onClick={() => setActiveIndex(0)}
            className="relative block w-full cursor-zoom-in"
          >
            <div
              className="absolute inset-0 rotate-4 rounded"
              style={{ background: "#fff", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
            />
            <div
              className="relative -rotate-3 rounded p-2.5 pb-7"
              style={{ background: "#fff", boxShadow: "0 14px 30px rgba(0,0,0,0.2)" }}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
                <Image src={photo} alt="The couple" fill className="object-cover" unoptimized />
              </div>
            </div>
          </button>
        </Reveal>

        {gridPhotos.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-2">
            {gridPhotos.map((item, i) => (
              <Reveal key={item.id} variants={variantFor(animation, i + 1)} delay={i * 0.06}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i + 1)}
                  className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-md"
                >
                  <Image
                    src={item.url}
                    alt={item.caption ?? ""}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    unoptimized
                  />
                </button>
              </Reveal>
            ))}
          </div>
        )}
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
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="relative aspect-[4/5] w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={activeIndex === 0 ? photo : gridPhotos[activeIndex - 1]?.url}
                alt=""
                fill
                className="rounded-lg object-cover"
                unoptimized
              />
            </motion.div>
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
