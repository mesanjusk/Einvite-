"use client";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { PetalField } from "@/components/animation/petal-field";
import { useCountdown } from "@/hooks/use-countdown";
import { fadeUp } from "@/lib/animation-variants";

const UNITS = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Mins" },
  { key: "seconds", label: "Secs" },
] as const;

export function CountdownSection({
  weddingDate,
  quote = "A lifetime of togetherness begins with one sacred step",
}: {
  weddingDate: Date;
  quote?: string;
}) {
  const values = useCountdown(weddingDate);
  const dateDisplay = weddingDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
              {quote}
            </p>
          </Reveal>

          <Reveal variants={fadeUp}>
            <h2
              className="mb-3.5 text-[38px]"
              style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
            >
              The Wedding
            </h2>
          </Reveal>

          <Reveal variants={fadeUp}>
            <p
              className="mb-7 text-sm tracking-[0.2em]"
              style={{ color: "var(--inv-accent)" }}
            >
              {dateDisplay}
            </p>
          </Reveal>

          <Reveal variants={fadeUp} className="flex justify-center gap-3.5">
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
          </Reveal>
        </div>
      </RevealGroup>
    </section>
  );
}
