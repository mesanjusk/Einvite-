"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  cta: string;
  primary: string;
  accent: string;
  background: string;
};

const ROTATE_MS = 5000;

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    // Auto-advance is decoration, so anyone who asked for less motion keeps a
    // static first slide and drives it with the dots instead.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Featured invitations"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="w-full shrink-0"
            aria-hidden={i !== index}
            style={{
              background: `radial-gradient(120% 120% at 20% 0%, ${slide.primary} 0%, color-mix(in srgb, ${slide.primary} 60%, black 35%) 100%)`,
              color: slide.background,
            }}
          >
            <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-6 py-16 sm:py-24">
              <span className="text-[11px] tracking-[0.28em] uppercase opacity-80">
                {slide.eyebrow}
              </span>
              <h2 className="font-display max-w-2xl text-3xl leading-tight text-balance sm:text-5xl">
                {slide.title}
              </h2>
              <Link
                href={slide.href}
                tabIndex={i === index ? 0 : -1}
                className="focus-visible:ring-offset-background mt-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                style={{ background: slide.accent, color: slide.primary }}
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1}: ${slide.title}`}
              aria-current={i === index}
              className="focus-visible:ring-primary size-2.5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              style={{
                background: "white",
                opacity: i === index ? 1 : 0.4,
                width: i === index ? "1.5rem" : undefined,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
