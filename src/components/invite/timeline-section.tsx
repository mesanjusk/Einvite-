"use client";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { PetalField } from "@/components/animation/petal-field";
import { fadeUp, fadeLeft } from "@/lib/animation-variants";
import { trackInviteEvent } from "@/lib/analytics-client";
import { useLocale } from "@/lib/i18n/locale-context";
import type { InviteEvent } from "./types";

export function TimelineSection({
  event,
  seed,
  invitationId,
}: {
  event: InviteEvent;
  seed: number;
  invitationId: string;
}) {
  const { t, locale } = useLocale();
  const dateDisplay = event.date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const accent = event.accentColor || "var(--inv-primary)";

  return (
    <section
      className="relative flex min-h-svh items-center justify-center overflow-hidden px-5 py-12"
      style={{ background: "var(--inv-background)" }}
    >
      <PetalField count={10} seed={seed} />

      <RevealGroup className="relative z-[2] w-full max-w-md">
        <div
          className="rounded-[20px] border px-6 py-9 text-center"
          style={{
            background: "color-mix(in srgb, var(--inv-background) 96%, white 4%)",
            borderColor: "color-mix(in srgb, var(--inv-accent) 30%, transparent)",
            boxShadow: "0 20px 45px rgba(0,0,0,0.1)",
          }}
        >
          <Reveal variants={fadeLeft}>
            <p
              className="mb-2.5 text-[11px] tracking-[0.3em] uppercase"
              style={{ color: "var(--inv-foreground)", opacity: 0.6 }}
            >
              {dateDisplay}
            </p>
          </Reveal>

          <Reveal variants={fadeUp}>
            <h2
              className="mb-4 text-[46px]"
              style={{ fontFamily: "var(--inv-font-display)", color: accent }}
            >
              {event.name}
            </h2>
          </Reveal>

          <Reveal variants={fadeUp}>
            <div
              className="grid gap-2.5 border-t border-dashed pt-4 text-left text-sm"
              style={{ borderColor: "color-mix(in srgb, var(--inv-primary) 25%, transparent)" }}
            >
              {event.time && (
                <Row label={t.timeLabel} value={event.time} />
              )}
              {event.venueName && <Row label={t.venueLabel} value={event.venueName} />}
              {event.dressCode && <Row label={t.dressCode} value={event.dressCode} />}
            </div>
          </Reveal>

          {event.googleMapsUrl && (
            <Reveal variants={fadeUp}>
              <a
                href={event.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackInviteEvent(invitationId, "CLICK_MAPS")}
                className="pill-button mt-5 block"
                style={{ background: accent, color: "var(--inv-background)" }}
              >
                📍 {t.getDirections}
              </a>
            </Reveal>
          )}
        </div>
      </RevealGroup>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
