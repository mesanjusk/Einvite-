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
  image?: string;
};

const ROTATE_MS = 5200;

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
      className="overflow-hidden border-y border-[#eadfd3] bg-[#fff9f0]"
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
          <article key={slide.id} className="w-full shrink-0" aria-hidden={i !== index}>
            <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-8 sm:px-8 sm:py-12 md:grid-cols-[0.88fr_1.12fr] md:gap-12 lg:px-10 lg:py-16">
              <div className="relative mx-auto w-full max-w-[410px] md:max-w-[430px]">
                <div
                  className="absolute -inset-4 rounded-[2.5rem] opacity-35 blur-2xl"
                  style={{ background: slide.accent }}
                  aria-hidden="true"
                />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-2.5 shadow-[0_24px_70px_rgba(80,30,35,0.18)]">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.55rem] bg-[#f3e9dd] sm:aspect-[5/6] md:aspect-[4/5]">
                    {slide.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.image}
                        alt=""
                        className="absolute inset-0 size-full object-cover transition-transform duration-1000 hover:scale-[1.025]"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(145deg, ${slide.background}, ${slide.accent})`,
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-white backdrop-blur-md">
                      <p className="text-[9px] font-semibold tracking-[0.22em] uppercase opacity-80">
                        Live invitation
                      </p>
                      <p className="font-display mt-1 text-xl leading-tight">{slide.title}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-1 top-8 rounded-2xl border border-[#eadfd3] bg-white/95 px-3 py-2 text-[10px] font-semibold tracking-wide text-[#6a2638] shadow-lg backdrop-blur sm:-right-6">
                  CUSTOMIZED FOR YOU
                </div>
              </div>

              <div className="mx-auto max-w-xl text-center md:mx-0 md:text-left">
                <div className="mb-5 inline-flex items-center rounded-full border border-[#dbc9b7] bg-white/80 px-4 py-2 text-[10px] font-semibold tracking-[0.22em] text-[#7a3143] uppercase shadow-sm">
                  A new standard in digital invitations
                </div>
                <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[#9a6c48] uppercase">
                  {slide.eyebrow}
                </p>
                <h1 className="font-display text-4xl leading-[1.05] text-[#5d2032] text-balance sm:text-5xl lg:text-6xl">
                  Digital elegance for your everlasting story
                </h1>
                <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#765e55] sm:text-base md:mx-0">
                  Create a bespoke, beautifully animated invitation website with your own
                  story, events, photos, RSVP and sharing link — ready in minutes.
                </p>
                <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:justify-start">
                  <Link
                    href="/create"
                    tabIndex={i === index ? 0 : -1}
                    className="rounded-full bg-[#651d33] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(101,29,51,0.22)] transition hover:-translate-y-0.5 hover:bg-[#53162a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#651d33] focus-visible:ring-offset-2"
                  >
                    Create your invitation
                  </Link>
                  <Link
                    href="/themes"
                    tabIndex={i === index ? 0 : -1}
                    className="rounded-full border border-[#d7c6b8] bg-white px-7 py-3 text-sm font-semibold text-[#651d33] transition hover:border-[#651d33]/50 hover:bg-[#fffdf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#651d33] focus-visible:ring-offset-2"
                  >
                    Explore templates →
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 pb-7 md:justify-start md:pl-[48%]">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1}: ${slide.title}`}
              aria-current={i === index}
              className="h-2 rounded-full bg-[#651d33] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#651d33] focus-visible:ring-offset-2"
              style={{ width: i === index ? "1.75rem" : "0.5rem", opacity: i === index ? 1 : 0.25 }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
