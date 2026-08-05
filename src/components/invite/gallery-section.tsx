"use client";

import Image from "next/image";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { PetalField } from "@/components/animation/petal-field";
import { fadeUp } from "@/lib/animation-variants";
import type { InviteMedia } from "./types";

export function GallerySection({
  media,
  storyHeadline,
  coverPhoto,
}: {
  media: InviteMedia[];
  storyHeadline: string;
  coverPhoto: string | null;
}) {
  const photo = coverPhoto ?? media[0]?.url;
  if (!photo) return null;

  return (
    <section
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-7 py-12 text-center"
      style={{ background: "var(--inv-background)" }}
    >
      <PetalField count={12} seed={31} />

      <RevealGroup className="relative z-[2] w-full">
        <Reveal variants={fadeUp}>
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "var(--inv-accent)" }}>
            Our Story
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

        <Reveal variants={fadeUp} className="relative mx-auto w-[78%] max-w-[280px]">
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
        </Reveal>

        {media.length > 1 && (
          <Reveal variants={fadeUp} className="mt-8 grid grid-cols-3 gap-2">
            {media.slice(1, 7).map((item) => (
              <div key={item.id} className="relative aspect-square overflow-hidden rounded-md">
                <Image src={item.url} alt={item.caption ?? ""} fill className="object-cover" unoptimized />
              </div>
            ))}
          </Reveal>
        )}
      </RevealGroup>
    </section>
  );
}
