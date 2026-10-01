"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ScrollProgress } from "@/components/animation/scroll-progress";
import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
import {
  InviteEditProvider,
  useInviteEdit,
  type InviteEditApi,
} from "@/components/invite/edit-context";
import { MusicPlayer } from "@/components/invite/music-player";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import type { CustomExperienceProps } from "../registry";
import { RoyalOpening } from "./royal-opening";
import { RoyalDateSection } from "./royal-date";
import {
  RoyalEvents,
  RoyalHero,
  RoyalOutro,
  RoyalRsvp,
  RoyalStory,
  RoyalVenue,
} from "./royal-sections";

function ScopedSection({
  id,
  label,
  guidedActiveSectionId,
  edit,
  children,
}: {
  id: string;
  label: string;
  guidedActiveSectionId?: string | null;
  edit: InviteEditApi | null;
  children: ReactNode;
}) {
  const guided = guidedActiveSectionId !== undefined;
  const scoped = edit
    ? {
        ...edit,
        active: guided
          ? edit.active && guidedActiveSectionId === id
          : edit.active,
      }
    : null;

  return (
    <InviteEditProvider value={scoped}>
      <section
        data-invite-section-id={id}
        data-invite-section-label={label}
        className="relative"
      >
        {children}
      </section>
    </InviteEditProvider>
  );
}

export function RoyalStoryExperience({
  invite,
  sectionConfig,
  skipEnvelope = false,
  initialGuestName = null,
  guestId = null,
  showRemixCta = false,
  guidedActiveSectionId,
}: CustomExperienceProps) {
  const edit = useInviteEdit();
  const envelopeEnabled = sectionConfig.some(
    (section) => section.type === "ENVELOPE" && section.visible,
  );
  const [open, setOpen] = useState(skipEnvelope || !envelopeEnabled);
  const [shareUrl, setShareUrl] = useState("/invite/" + invite.slug);

  useEffect(() => {
    setShareUrl(window.location.origin + "/invite/" + invite.slug);
  }, [invite.slug]);

  const visible = useMemo(
    () =>
      new Set(
        sectionConfig
          .filter((section) => section.visible)
          .map((section) => section.type),
      ),
    [sectionConfig],
  );

  const showStory = visible.has("STORY") || visible.has("GALLERY");

  return (
    <LocaleProvider>
      <ScrollProgress />
      <MusicPlayer musicUrl={invite.musicUrl} active={open} />

      <AnimatePresence>
        {!open && (
          <RoyalOpening invite={invite} onComplete={() => setOpen(true)} />
        )}
      </AnimatePresence>

      {open && (
        <main className="bg-[#f8eedc]">
          {visible.has("HERO") && (
            <ScopedSection
              id="HERO"
              label="Names & welcome"
              guidedActiveSectionId={guidedActiveSectionId}
              edit={edit}
            >
              <RoyalHero invite={invite} guestName={initialGuestName} />
            </ScopedSection>
          )}

          {visible.has("COUNTDOWN") && (
            <ScopedSection
              id="COUNTDOWN"
              label="Date & countdown"
              guidedActiveSectionId={guidedActiveSectionId}
              edit={edit}
            >
              <RoyalDateSection invite={invite} />
            </ScopedSection>
          )}

          {showStory && (
            <ScopedSection
              id="STORY"
              label="Photos & story"
              guidedActiveSectionId={guidedActiveSectionId}
              edit={edit}
            >
              <RoyalStory invite={invite} />
            </ScopedSection>
          )}

          {visible.has("TIMELINE") && (
            <ScopedSection
              id="TIMELINE"
              label="Functions"
              guidedActiveSectionId={guidedActiveSectionId}
              edit={edit}
            >
              <RoyalEvents invite={invite} />
            </ScopedSection>
          )}

          {visible.has("VENUE") && (
            <ScopedSection
              id="VENUE"
              label="Venue & directions"
              guidedActiveSectionId={guidedActiveSectionId}
              edit={edit}
            >
              <RoyalVenue invite={invite} />
            </ScopedSection>
          )}

          {visible.has("RSVP") && (
            <ScopedSection
              id="RSVP"
              label="RSVP"
              guidedActiveSectionId={guidedActiveSectionId}
              edit={edit}
            >
              <RoyalRsvp
                invitationId={invite.id}
                guestId={guestId}
                initialGuestName={initialGuestName}
              />
            </ScopedSection>
          )}

          {visible.has("THANK_YOU") && (
            <ScopedSection
              id="THANK_YOU"
              label="Final message"
              guidedActiveSectionId={guidedActiveSectionId}
              edit={edit}
            >
              <RoyalOutro invite={invite} shareUrl={shareUrl} />
            </ScopedSection>
          )}
        </main>
      )}

      {open && showRemixCta && (
        <motion.div
          initial={{ y: 35, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="no-print fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <StartLiveInvitationButton
            fromSlug={invite.slug}
            className="rounded-full bg-[#e4bb68] px-5 py-3 text-xs font-extrabold text-[#4c1627] shadow-lg"
          >
            Make this invitation mine
          </StartLiveInvitationButton>
        </motion.div>
      )}
    </LocaleProvider>
  );
}
