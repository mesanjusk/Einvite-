"use client";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { fadeUp } from "@/lib/animation-variants";
import { trackInviteEvent } from "@/lib/analytics-client";

export function VenueSection({
  invitationId,
  venueName,
  venueAddress,
  googleMapsUrl,
}: {
  invitationId: string;
  venueName: string;
  venueAddress: string | null;
  googleMapsUrl: string | null;
}) {
  return (
    <section
      className="relative flex min-h-[70svh] items-center justify-center px-6 py-12 text-center"
      style={{ background: "var(--inv-background)" }}
    >
      <RevealGroup className="w-full max-w-md">
        <Reveal variants={fadeUp}>
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "var(--inv-accent)" }}>
            Venue
          </p>
        </Reveal>
        <Reveal variants={fadeUp}>
          <h2
            className="mt-1.5 mb-3 text-4xl"
            style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
          >
            {venueName}
          </h2>
        </Reveal>
        {venueAddress && (
          <Reveal variants={fadeUp}>
            <p className="mb-6 text-sm opacity-75" style={{ fontFamily: "var(--inv-font-body)" }}>
              {venueAddress}
            </p>
          </Reveal>
        )}
        {googleMapsUrl && (
          <Reveal variants={fadeUp}>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInviteEvent(invitationId, "CLICK_MAPS")}
              className="pill-button"
              style={{ background: "var(--inv-primary)", color: "var(--inv-background)" }}
            >
              📍 OPEN IN GOOGLE MAPS
            </a>
          </Reveal>
        )}
      </RevealGroup>
    </section>
  );
}
