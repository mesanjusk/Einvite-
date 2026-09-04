"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ScrollProgress } from "@/components/animation/scroll-progress";
import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { EnvelopeSection } from "./envelope-section";
import { HeroSection } from "./hero-section";
import { CountdownSection } from "./countdown-section";
import { TimelineSection } from "./timeline-section";
import { GallerySection } from "./gallery-section";
import { VenueSection } from "./venue-section";
import { RsvpSection } from "./rsvp-section";
import { ThankYouSection } from "./thank-you-section";
import { MusicPlayer } from "./music-player";
import { LanguageToggle } from "./language-toggle";
import {
  InviteEditProvider,
  useInviteEdit,
  type InviteEditApi,
} from "./edit-context";
import { EditChip } from "./editable";
import type { InviteData } from "./types";

type SectionConfigEntry = {
  id: string;
  type: string;
  visible: boolean;
  order: number;
};

const EVENT_SEEDS = [3, 11, 17, 23, 29, 37];

/**
 * One real invitation section, with its own nearest edit context.
 *
 * The live editor passes `guidedActiveSectionId` even when it is null. That
 * puts the invitation in guided mode: every section renders normally, but
 * only the one the visitor explicitly chose receives `active: true`. Public
 * invitation renders omit the prop completely and keep the old behavior.
 *
 * The data attributes are intentionally plain DOM. The guided editor watches
 * them while the visitor scrolls and shows one small "Make it yours" prompt
 * for whichever slide is currently centred on screen.
 */
function SectionScope({
  id,
  label,
  guidedActiveSectionId,
  edit,
  children,
}: {
  id: string;
  label: string;
  guidedActiveSectionId: string | null | undefined;
  edit: InviteEditApi | null;
  children: ReactNode;
}) {
  const guided = guidedActiveSectionId !== undefined;
  const scopedEdit = edit
    ? {
        ...edit,
        active: guided ? edit.active && guidedActiveSectionId === id : edit.active,
      }
    : null;

  return (
    <InviteEditProvider value={scopedEdit}>
      <div
        data-invite-section-id={id}
        data-invite-section-label={label}
        className="relative"
      >
        {children}
      </div>
    </InviteEditProvider>
  );
}

export function InviteExperience({
  invite,
  sectionConfig,
  skipEnvelope = false,
  initialGuestName = null,
  guestId = null,
  showRemixCta = false,
  guidedActiveSectionId,
}: {
  invite: InviteData;
  sectionConfig: SectionConfigEntry[];
  /** Preview contexts (the builder) don't want to re-tap the envelope on every edit. */
  skipEnvelope?: boolean;
  /** Resolved server-side from a personalized `?to=<token>` link. */
  initialGuestName?: string | null;
  guestId?: string | null;
  /**
   * Whether to offer a visitor their own invitation built on this design.
   * Off inside the editor and for the couple looking at their own page.
   */
  showRemixCta?: boolean;
  /**
   * Undefined outside the guided editor. Null means preview-only; a section
   * id means that one slide — and only that slide — is editable.
   */
  guidedActiveSectionId?: string | null;
}) {
  const edit = useInviteEdit();
  const [inviteOpen, setInviteOpen] = useState(skipEnvelope);
  const [guestName] = useState<string | null>(initialGuestName);
  const [shareUrl, setShareUrl] = useState(`/invite/${invite.slug}`);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/invite/${invite.slug}`);
    }
  }, [invite.slug]);

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
      <MusicPlayer
        key={invite.musicUrl ?? "no-music"}
        musicUrl={invite.musicUrl}
        active={inviteOpen}
      />

      <AnimatePresence>
        {!skipEnvelope && !inviteOpen && (
          <EnvelopeSection
            initials={initials}
            videoUrl={invite.revealVideoUrl}
            onComplete={() => setInviteOpen(true)}
          />
        )}
      </AnimatePresence>

      {inviteOpen && (
        <main>
          {dedupedSections.map((section) => {
            switch (section.type) {
              case "HERO":
                return (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label="Names & welcome"
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                  >
                    <HeroSection invite={invite} guestName={guestName} />
                  </SectionScope>
                );
              case "COUNTDOWN":
                return (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label="Date & countdown"
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                  >
                    <CountdownSection weddingDate={invite.weddingDate} />
                  </SectionScope>
                );
              case "TIMELINE":
                // With no ceremonies yet there is nothing to tap, so the
                // editor still shows one slide that can start the list.
                if (invite.events.length === 0 && edit) {
                  return (
                    <SectionScope
                      key={section.id}
                      id={section.id}
                      label="Functions"
                      guidedActiveSectionId={guidedActiveSectionId}
                      edit={edit}
                    >
                      <section
                        className="flex min-h-[40svh] flex-col items-center justify-center gap-3 px-6 text-center"
                        style={{ background: "var(--inv-background)" }}
                      >
                        <p className="text-sm opacity-70">No functions on the invitation yet.</p>
                        <EditChip onClick={() => edit.addEvent()}>+ Add a function</EditChip>
                      </section>
                    </SectionScope>
                  );
                }
                return invite.events.map((event, i) => {
                  const eventSectionId = `${section.id}:${event.id}`;
                  return (
                    <SectionScope
                      key={event.id}
                      id={eventSectionId}
                      label={event.name || `Function ${i + 1}`}
                      guidedActiveSectionId={guidedActiveSectionId}
                      edit={edit}
                    >
                      <TimelineSection
                        event={event}
                        seed={EVENT_SEEDS[i % EVENT_SEEDS.length]}
                        invitationId={invite.id}
                      />
                    </SectionScope>
                  );
                });
              case "GALLERY":
              case "STORY":
                return (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label="Photos & story"
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                  >
                    <GallerySection
                      media={invite.media}
                      storyHeadline={invite.copy?.storyHeadline ?? "Forever Us"}
                      coverPhoto={invite.bridePhoto ?? invite.groomPhoto}
                      animation={invite.galleryAnimation}
                    />
                  </SectionScope>
                );
              case "VENUE":
                // Same reason as the ceremonies above: a venue nobody has
                // typed yet still needs its place on the page to type it in.
                return invite.venueName || edit ? (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label="Venue & directions"
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                  >
                    <VenueSection
                      invitationId={invite.id}
                      venueName={invite.venueName ?? ""}
                      venueAddress={invite.venueAddress}
                      googleMapsUrl={invite.googleMapsUrl}
                    />
                  </SectionScope>
                ) : null;
              case "RSVP":
                return (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label="RSVP"
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                  >
                    <RsvpSection
                      invitationId={invite.id}
                      guestId={guestId}
                      guestName={guestName}
                    />
                  </SectionScope>
                );
              case "THANK_YOU":
                return (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label="Final message"
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                  >
                    <ThankYouSection
                      brideName={invite.brideName}
                      groomName={invite.groomName}
                      hashtags={invite.copy?.hashtags}
                      shareUrl={shareUrl}
                    />
                  </SectionScope>
                );
              default:
                return null;
            }
          })}
        </main>
      )}

      {inviteOpen && showRemixCta && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="no-print fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <StartLiveInvitationButton
            fromSlug={invite.slug}
            className="pill-button shadow-lg"
            style={{ background: "var(--inv-accent)", color: "var(--inv-primary)" }}
          >
            Make this invitation mine
          </StartLiveInvitationButton>
        </motion.div>
      )}
    </LocaleProvider>
  );
}
