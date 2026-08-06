"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { ScrollProgress } from "@/components/animation/scroll-progress";
import { EnvelopeSection } from "./envelope-section";
import { HeroSection } from "./hero-section";
import { CountdownSection } from "./countdown-section";
import { TimelineSection } from "./timeline-section";
import { GallerySection } from "./gallery-section";
import { VenueSection } from "./venue-section";
import { RsvpSection } from "./rsvp-section";
import { ThankYouSection } from "./thank-you-section";
import { MusicPlayer } from "./music-player";
import type { InviteData } from "./types";

type SectionConfigEntry = {
  id: string;
  type: string;
  visible: boolean;
  order: number;
};

const EVENT_SEEDS = [3, 11, 17, 23, 29, 37];

export function InviteExperience({
  invite,
  sectionConfig,
  skipEnvelope = false,
}: {
  invite: InviteData;
  sectionConfig: SectionConfigEntry[];
  /** Preview contexts (the builder) don't want to re-tap the envelope on every edit. */
  skipEnvelope?: boolean;
}) {
  const [inviteOpen, setInviteOpen] = useState(skipEnvelope);

  const visibleSections = [...sectionConfig]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  const initials = `${invite.brideName[0] ?? ""}${invite.groomName[0] ?? ""}`;

  return (
    <>
      <ScrollProgress />
      <MusicPlayer musicUrl={invite.musicUrl} active={inviteOpen} />

      <AnimatePresence>
        {!inviteOpen && (
          <EnvelopeSection
            initials={initials}
            storageKey={`invited-${invite.slug}`}
            onComplete={() => setInviteOpen(true)}
          />
        )}
      </AnimatePresence>

      {inviteOpen && (
        <main>
          {visibleSections.map((section) => {
            switch (section.type) {
              case "HERO":
                return <HeroSection key={section.id} invite={invite} />;
              case "COUNTDOWN":
                return (
                  <CountdownSection key={section.id} weddingDate={invite.weddingDate} />
                );
              case "TIMELINE":
                return invite.events.map((event, i) => (
                  <TimelineSection
                    key={event.id}
                    event={event}
                    seed={EVENT_SEEDS[i % EVENT_SEEDS.length]}
                    invitationId={invite.id}
                  />
                ));
              case "GALLERY":
              case "STORY":
                return (
                  <GallerySection
                    key={section.id}
                    media={invite.media}
                    storyHeadline={invite.copy?.storyHeadline ?? "Forever Us"}
                    coverPhoto={invite.bridePhoto ?? invite.groomPhoto}
                  />
                );
              case "VENUE":
                return invite.venueName ? (
                  <VenueSection
                    key={section.id}
                    invitationId={invite.id}
                    venueName={invite.venueName}
                    venueAddress={invite.venueAddress}
                    googleMapsUrl={invite.googleMapsUrl}
                  />
                ) : null;
              case "RSVP":
                return <RsvpSection key={section.id} invitationId={invite.id} />;
              case "THANK_YOU":
                return (
                  <ThankYouSection
                    key={section.id}
                    brideName={invite.brideName}
                    groomName={invite.groomName}
                    hashtags={invite.copy?.hashtags}
                  />
                );
              default:
                return null;
            }
          })}
        </main>
      )}
    </>
  );
}
