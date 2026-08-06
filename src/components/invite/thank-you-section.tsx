"use client";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { Sparkles } from "@/components/animation/sparkles";
import { fadeUp } from "@/lib/animation-variants";
import { useLocale } from "@/lib/i18n/locale-context";

export function ThankYouSection({
  brideName,
  groomName,
  hashtags,
}: {
  brideName: string;
  groomName: string;
  hashtags?: string[];
}) {
  const { t } = useLocale();
  return (
    <section
      className="relative flex min-h-[60svh] flex-col items-center justify-center overflow-hidden px-7 py-12 text-center"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--inv-primary) 80%, white 8%) 0%, var(--inv-primary) 45%, color-mix(in srgb, var(--inv-primary) 70%, black 30%) 100%)",
      }}
    >
      <Sparkles count={12} seed={3} />
      <RevealGroup className="relative z-[2]">
        <Reveal variants={fadeUp}>
          <h2
            className="mb-4 text-[38px]"
            style={{ fontFamily: "var(--inv-font-script)", fontWeight: 400, color: "var(--inv-secondary)" }}
          >
            {t.thankYouSectionHeading}
          </h2>
        </Reveal>
        <Reveal variants={fadeUp}>
          <p
            className="text-[15px]"
            style={{ fontFamily: "var(--inv-font-body)", fontStyle: "italic", color: "var(--inv-accent)" }}
          >
            {brideName} &amp; {groomName}
          </p>
        </Reveal>
        {hashtags && hashtags.length > 0 && (
          <Reveal variants={fadeUp}>
            <p className="mt-4 text-xs tracking-wide opacity-70" style={{ color: "var(--inv-secondary)" }}>
              {hashtags.map((h) => `#${h}`).join("  ")}
            </p>
          </Reveal>
        )}
      </RevealGroup>
    </section>
  );
}
