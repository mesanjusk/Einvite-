"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { ScrollProgress } from "@/components/animation/scroll-progress";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { EnvelopeSection } from "./envelope-section";
import { GuestNameGate } from "./guest-name-gate";
import { HeroSection } from "./hero-section";
import { CountdownSection } from "./countdown-section";
import { TimelineSection } from "./timeline-section";
import { GallerySection } from "./gallery-section";
import { VenueSection } from "./venue-section";
import { RsvpSection } from "./rsvp-section";
import { ThankYouSection } from "./thank-you-section";
import { MusicPlayer } from "./music-player";
import { LanguageToggle } from "./language-toggle";
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
  initialGuestName = null,
  guestId = null,
}: {
  invite: InviteData;
  sectionConfig: SectionConfigEntry[];
  /** Preview contexts (the builder) don't want to re-tap the envelope on every edit. */
  skipEnvelope?: boolean;
  /** Resolved server-side from a personalized `?to=<token>` link. */
  initialGuestName?: string | null;
  guestId?: string | null;
}) {
  const [inviteOpen, setInviteOpen] = useState(skipEnvelope);
  const [guestName, setGuestName] = useState<string | null>(initialGuestName);
  const [nameCaptured, setNameCaptured] = useState(skipEnvelope || !!initialGuestName);
  const [shareUrl, setShareUrl] = useState(`/invite/${invite.slug}`);

  const guestNameStorageKey = `guest-name-${invite.slug}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/invite/${invite.slug}`);
    }
  }, [invite.slug]);

  useEffect(() => {
    if (initialGuestName || typeof window === "undefined") return;
    const stored = sessionStorage.getItem(guestNameStorageKey);
    if (stored !== null) {
      setGuestName(stored || null);
      setNameCaptured(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNameSubmit(name: string) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(guestNameStorageKey, name);
    }
    setGuestName(name || null);
    setNameCaptured(true);
  }

  const visibleSections = [...sectionConfig]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  // "STORY" and "GALLERY" both render the same photo stack — the section
  // builder lists them as separately toggleable slots ("Our Story" /
  // "Photo Gallery"), but only one should ever actually render, or every
  // photo shows up twice on the page whenever both are visible (the
  // default state).
  let gallerySectionRendered = false;
  const dedupedSections = visibleSections.filter((section) => {
    if (section.type !== "GALLERY" && section.type !== "STORY") return true;
    if (gallerySectionRendered) return false;
    gallerySectionRendered = true;
    return true;
  });

  const initials = `${invite.brideName[0] ?? ""}${invite.groomName[0] ?? ""}`;

  return (
    <LocaleProvider>
      <ScrollProgress />
      <LanguageToggle />
      <MusicPlayer musicUrl={invite.musicUrl} active={inviteOpen} />

      <AnimatePresence>
        {!skipEnvelope && !nameCaptured && (
          <GuestNameGate initials={initials} onSubmit={handleNameSubmit} />
        )}
        {!skipEnvelope && nameCaptured && !inviteOpen && (
          <EnvelopeSection
            initials={initials}
            storageKey={`invited-${invite.slug}`}
            onComplete={() => setInviteOpen(true)}
          />
        )}
      </AnimatePresence>

      {inviteOpen && (
        <main>
          {dedupedSections.map((section) => {
            switch (section.type) {
              case "HERO":
                return <HeroSection key={section.id} invite={invite} guestName={guestName} />;
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
                    animation={invite.galleryAnimation}
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
                return (
                  <RsvpSection
                    key={section.id}
                    invitationId={invite.id}
                    guestId={guestId}
                    guestName={guestName}
                  />
                );
              case "THANK_YOU":
                return (
                  <ThankYouSection
                    key={section.id}
                    brideName={invite.brideName}
                    groomName={invite.groomName}
                    hashtags={invite.copy?.hashtags}
                    shareUrl={shareUrl}
                  />
                );
              default:
                return null;
            }
          })}
        </main>
      )}
    </LocaleProvider>
  );
}
