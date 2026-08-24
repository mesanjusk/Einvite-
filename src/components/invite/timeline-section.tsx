"use client";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { PetalField } from "@/components/animation/petal-field";
import { fadeUp, fadeLeft } from "@/lib/animation-variants";
import { trackInviteEvent } from "@/lib/analytics-client";
import { useLocale } from "@/lib/i18n/locale-context";
import { useInviteEdit, type EditTarget } from "./edit-context";
import { EditableDate, EditableText, EditChip } from "./editable";
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
  const edit = useInviteEdit();
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
              <EditableDate target={{ kind: "event", eventId: event.id }} value={event.date}>
                {dateDisplay}
              </EditableDate>
            </p>
          </Reveal>

          <Reveal variants={fadeUp}>
            <h2
              className="mb-2 text-[46px]"
              style={{ fontFamily: "var(--inv-font-display)", color: accent }}
            >
              <EditableText
                target={{ kind: "event", eventId: event.id, field: "name" }}
                value={event.name}
                placeholder="Name this function"
              />
            </h2>
          </Reveal>

          {(event.tagline || edit?.active) && (
            <Reveal variants={fadeUp}>
              <p
                className="mb-4 text-sm"
                style={{ fontFamily: "var(--inv-font-body)", fontStyle: "italic", opacity: 0.75 }}
              >
                <EditableText
                  target={{ kind: "event", eventId: event.id, field: "tagline" }}
                  value={event.tagline ?? ""}
                  placeholder="Add a line about this function"
                />
              </p>
            </Reveal>
          )}

          <Reveal variants={fadeUp}>
            <div
              className="grid gap-2.5 border-t border-dashed pt-4 text-left text-sm"
              style={{ borderColor: "color-mix(in srgb, var(--inv-primary) 25%, transparent)" }}
            >
              {(event.time || edit?.active) && (
                <Row
                  label={t.timeLabel}
                  value={event.time ?? ""}
                  target={{ kind: "event", eventId: event.id, field: "time" }}
                  placeholder="Add a time"
                />
              )}
              {(event.venueName || edit?.active) && (
                <Row
                  label={t.venueLabel}
                  value={event.venueName ?? ""}
                  target={{ kind: "event", eventId: event.id, field: "venueName" }}
                  placeholder="Add a venue"
                />
              )}
            </div>
          </Reveal>

          {(event.dressCode || edit?.active) && (
            <Reveal variants={fadeUp}>
              <div className="mt-4 border-t pt-4" style={{ borderColor: "color-mix(in srgb, var(--inv-primary) 25%, transparent)" }}>
                <p
                  className="mb-2 text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: "var(--inv-accent)" }}
                >
                  {t.dressCode}
                </p>
                {edit?.active ? (
                  <p className="text-xs">
                    <EditableText
                      target={{ kind: "event", eventId: event.id, field: "dressCode" }}
                      value={event.dressCode ?? ""}
                      placeholder="Colours to wear, comma separated"
                    />
                  </p>
                ) : (
                  <div className="flex flex-wrap justify-center gap-2">
                    {event.dressCode?.split(",").map((item) => (
                      <span
                        key={item}
                        className="rounded-full border px-3 py-1 text-xs"
                        style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 40%, transparent)" }}
                      >
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {edit?.active && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <EditChip onClick={() => edit.addEvent()}>+ Add a function</EditChip>
              <EditChip onClick={() => edit.removeEvent(event.id)}>Remove this one</EditChip>
            </div>
          )}

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

function Row({
  label,
  value,
  target,
  placeholder,
}: {
  label: string;
  value: string;
  target: Extract<EditTarget, { kind: "event" }>;
  placeholder: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span className="font-medium">
        <EditableText target={target} value={value} placeholder={placeholder} />
      </span>
    </div>
  );
}
