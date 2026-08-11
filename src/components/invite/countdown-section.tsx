"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { PetalField } from "@/components/animation/petal-field";
import { useCountdown } from "@/hooks/use-countdown";
import { fadeUp } from "@/lib/animation-variants";
import { useLocale } from "@/lib/i18n/locale-context";
import { ScratchCard } from "./scratch-card";

const SCRATCH_PARTS = ["month", "day", "year"] as const;
type ScratchPart = (typeof SCRATCH_PARTS)[number];

export function CountdownSection({
  weddingDate,
  quote,
}: {
  weddingDate: Date;
  quote?: string;
}) {
  const { t, locale } = useLocale();
  const values = useCountdown(weddingDate);
  const [scratched, setScratched] = useState<Record<ScratchPart, boolean>>({
    month: false,
    day: false,
    year: false,
  });

  const dateDisplay = weddingDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const parts = {
    month: weddingDate.toLocaleDateString(locale, { month: "long" }),
    day: weddingDate.toLocaleDateString(locale, { day: "2-digit" }),
    year: weddingDate.toLocaleDateString(locale, { year: "numeric" }),
  };
  const allScratched = SCRATCH_PARTS.every((part) => scratched[part]);

  const UNITS = [
    { key: "days", label: t.days },
    { key: "hours", label: t.hours },
    { key: "minutes", label: t.mins },
    { key: "seconds", label: t.secs },
  ] as const;

  return (
    <section
      className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-12"
      style={{ background: "var(--inv-background)" }}
    >
      <PetalField count={12} seed={19} />

      <RevealGroup className="relative z-[2] w-full max-w-md">
        <div
          className="rounded-[20px] border px-6 py-10 text-center"
          style={{
            background: "color-mix(in srgb, var(--inv-background) 96%, white 4%)",
            borderColor: "color-mix(in srgb, var(--inv-accent) 30%, transparent)",
            boxShadow: "0 20px 45px rgba(0,0,0,0.1)",
          }}
        >
          <Reveal variants={fadeUp}>
            <p
              className="mb-4 text-[15px]"
              style={{ fontFamily: "var(--inv-font-body)", fontStyle: "italic", opacity: 0.75 }}
            >
              {quote ?? t.countdownQuoteDefault}
            </p>
          </Reveal>

          <Reveal variants={fadeUp}>
            <h2
              className="mb-3.5 text-[38px]"
              style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
            >
              {t.theWedding}
            </h2>
          </Reveal>

          <AnimatePresence mode="wait">
            {!allScratched ? (
              <motion.div
                key="scratch"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-4"
              >
                <p className="text-xs tracking-[0.15em] italic opacity-70" style={{ color: "var(--inv-accent)" }}>
                  Scratch below to reveal our wedding date
                </p>
                <div className="flex justify-center gap-3">
                  {(["month", "day"] as ScratchPart[]).map((part) => (
                    <div key={part} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] tracking-[0.2em] opacity-60">
                        {part.toUpperCase()}
                      </span>
                      <ScratchCard
                        label="Scratch"
                        className="h-24 w-20 overflow-hidden rounded-xl border"
                        onReveal={() => setScratched((s) => ({ ...s, [part]: true }))}
                      >
                        <span
                          className="text-lg font-semibold"
                          style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
                        >
                          {parts[part]}
                        </span>
                      </ScratchCard>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] tracking-[0.2em] opacity-60">YEAR</span>
                  <ScratchCard
                    label="Scratch"
                    className="mx-auto h-24 w-20 overflow-hidden rounded-xl border"
                    onReveal={() => setScratched((s) => ({ ...s, year: true }))}
                  >
                    <span
                      className="text-lg font-semibold"
                      style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
                    >
                      {parts.year}
                    </span>
                  </ScratchCard>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="mb-7 text-sm tracking-[0.2em]" style={{ color: "var(--inv-accent)" }}>
                  {dateDisplay}
                </p>

                <div className="flex justify-center gap-3.5">
                  {UNITS.map((unit) => (
                    <div key={unit.key} className="min-w-[56px]">
                      <div
                        className="text-[30px] leading-none font-semibold"
                        style={{ fontFamily: "var(--inv-font-display)" }}
                      >
                        {String(values[unit.key]).padStart(2, "0")}
                      </div>
                      <div
                        className="mt-2 border-t pt-1.5 text-[10px] tracking-[0.15em]"
                        style={{
                          color: "var(--inv-accent)",
                          borderColor: "color-mix(in srgb, var(--inv-accent) 40%, transparent)",
                        }}
                      >
                        {unit.label.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </RevealGroup>
    </section>
  );
}
