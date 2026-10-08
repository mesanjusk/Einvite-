"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

import { ScrollProgress } from "@/components/animation/scroll-progress";
import { WeddingAmbientEffects } from "@/components/marketing/wedding-ambient-effects";
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
import { EventSectionPicker } from "./event-section-picker";
import type { InviteData } from "./types";
import { ThemeElementProvider } from "./theme-text-element";
import { sectionDisplayName } from "@/lib/section-labels";

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
  sectionImage,
  sectionStyle,
  elementStyles,
  customText,
  children,
}: {
  id: string;
  label: string;
  guidedActiveSectionId: string | null | undefined;
  edit: InviteEditApi | null;
  sectionImage?: string | null;
  sectionStyle?: NonNullable<InviteData["sectionStyles"]>[string];
  elementStyles?: InviteData["elementStyles"];
  customText?: NonNullable<InviteData["customText"]>[string];
  children: ReactNode;
}) {
  const elementCss = Object.entries(elementStyles ?? {})
    .map(([key, config]) => {
      const declarations = [
        config.hidden ? "display:none !important" : "",
        config.fontSize ? `font-size:${config.fontSize}px !important` : "",
        config.fontRole
          ? `font-family:var(--inv-font-${config.fontRole}) !important`
          : "",
        config.align ? `text-align:${config.align} !important` : "",
        config.color ? `color:${config.color} !important` : "",
        config.bold !== undefined ? `font-weight:${config.bold ? 700 : 400} !important` : "",
        config.italic !== undefined ? `font-style:${config.italic ? "italic" : "normal"} !important` : "",
        config.underline !== undefined ? `text-decoration:${config.underline ? "underline" : "none"} !important` : "",
        config.letterSpacing !== undefined ? `letter-spacing:${config.letterSpacing}px !important` : "",
        config.lineHeight !== undefined ? `line-height:${config.lineHeight} !important` : "",
        config.showBackground
          ? "background:color-mix(in srgb,var(--inv-background) 90%,white 10%) !important;padding:.2em .45em !important;border-radius:.55em !important"
          : "",
      ]
        .filter(Boolean)
        .join(";");
      const selector = `[data-theme-element=${JSON.stringify(key)}]`;
      // ThemeText may repeat its parent's key. Move/fade the outer layer once.
      const outerSelector = `${selector}:not(${selector} ${selector})`;
      const position = config.x || config.y ? `transform:translate(${config.x ?? 0}%, ${config.y ?? 0}%) !important;` : "";
      const opacity = config.opacity !== undefined ? `opacity:${config.opacity} !important;` : "";
      return `${declarations ? `${selector}{${declarations}}` : ""}${position || opacity ? `${outerSelector}{${position}${opacity}}` : ""}`;
    })
    .filter(Boolean)
    .join("\n");

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
        className={cn(
          "relative",
          sectionImage && "inv-section-artwork bg-cover bg-center bg-no-repeat",
          (sectionStyle?.showBox === false || (sectionImage && sectionStyle?.showBox !== true)) && "inv-section-no-box",
        )}
        style={{
          ...(sectionImage
            ? { backgroundImage: `url("${sectionImage.replace(/"/g, "\\\"")}")` }
            : {}),
          ...(sectionStyle?.primary ? { "--inv-primary": sectionStyle.primary } : {}),
          ...(sectionStyle?.accent ? { "--inv-accent": sectionStyle.accent } : {}),
          ...(sectionStyle?.foreground ? { "--inv-foreground": sectionStyle.foreground } : {}),
          ...(sectionStyle?.displayFont ? { "--inv-font-display": sectionStyle.displayFont } : {}),
          ...(sectionStyle?.bodyFont ? { "--inv-font-body": sectionStyle.bodyFont } : {}),
          ...(sectionStyle?.scriptFont ? { "--inv-font-script": sectionStyle.scriptFont } : {}),
        } as React.CSSProperties}
      >
        {elementCss && <style>{elementCss}</style>}
        <ThemeElementProvider value={elementStyles}>
          <div
            className="relative"
            style={{
              transform: `translate(${sectionStyle?.x ?? 0}%, ${sectionStyle?.y ?? 0}%)`,
            }}
          >
            {children}
          </div>
        </ThemeElementProvider>
        {customText && customText.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-20">
            {customText.map((block) => (
              <div
                key={block.id}
                className="pointer-events-auto absolute left-1/2 top-1/2 w-[88%]"
                data-theme-element={block.id}
                style={{
                  transform: `translate(calc(-50% + ${block.x ?? 0}%), calc(-50% + ${block.y ?? 0}%))`,
                  fontSize: `${block.fontSize}px`,
                  lineHeight: block.lineHeight ?? 1.25,
                  fontWeight: block.bold ? 700 : undefined,
                  fontStyle: block.italic ? "italic" : undefined,
                  textDecoration: block.underline ? "underline" : undefined,
                  letterSpacing: block.letterSpacing !== undefined ? `${block.letterSpacing}px` : undefined,
                  opacity: block.opacity ?? 1,
                  fontFamily:
                    block.fontRole === "display"
                      ? "var(--inv-font-display)"
                      : block.fontRole === "script"
                        ? "var(--inv-font-script)"
                        : "var(--inv-font-body)",
                  textAlign: block.align,
                  color: block.color || "var(--inv-foreground)",
                }}
              >
                {block.text}
              </div>
            ))}
          </div>
        )}
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
  previewMode = false,
  onlySectionType,
  onEnvelopeComplete,
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
  /** Theme Studio: render inside its phone frame without global fixed controls. */
  previewMode?: boolean;
  /** Theme Studio: render one real section instead of the whole invitation. */
  onlySectionType?: string;
  /** Live editor uses this to refresh mobile preview controls after opening. */
  onEnvelopeComplete?: () => void;
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
    .filter((s) => s.visible && (!onlySectionType || s.type === onlySectionType))
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
      {!previewMode && <ScrollProgress />}
      {!previewMode && <LanguageToggle />}
      {!previewMode && (
        <MusicPlayer
          key={invite.musicUrl ?? "no-music"}
          musicUrl={invite.musicUrl}
          active={inviteOpen}
        />
      )}

      {inviteOpen && !previewMode && (
        <WeddingAmbientEffects
          variant="viewer"
          reactToMusic
          className={
            skipEnvelope
              ? "no-print absolute inset-x-0 top-0 h-[100svh]"
              : "no-print"
          }
        />
      )}

      <AnimatePresence>
        {!skipEnvelope && !inviteOpen && (
          <EnvelopeSection
            initials={initials}
            mode={invite.revealMode}
            videoUrl={invite.revealVideoUrl}
            videoWebmUrl={invite.revealVideoWebmUrl}
            posterUrl={invite.revealVideoPosterUrl}
            animation={invite.revealAnimation}
            backgroundImageUrl={invite.sectionImages?.ENVELOPE}
            embedded={previewMode}
            onComplete={() => {
              setInviteOpen(true);
              onEnvelopeComplete?.();
            }}
          />
        )}
      </AnimatePresence>

      {inviteOpen && (
        <main className="relative z-[7]">
          {dedupedSections.map((section) => {
            switch (section.type) {
              case "HERO":
                return (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label={sectionDisplayName("HERO")}
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                    sectionImage={invite.sectionImages?.[section.type]}
                    sectionStyle={invite.sectionStyles?.[section.type]}
                    elementStyles={invite.elementStyles}
                    customText={invite.customText?.[section.type]}
                  >
                    <HeroSection invite={invite} guestName={guestName} />
                  </SectionScope>
                );
              case "COUNTDOWN":
                return (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label={sectionDisplayName("COUNTDOWN")}
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                    sectionImage={invite.sectionImages?.[section.type]}
                    sectionStyle={invite.sectionStyles?.[section.type]}
                    elementStyles={invite.elementStyles}
                    customText={invite.customText?.[section.type]}
                  >
                    <CountdownSection weddingDate={invite.weddingDate} scratchShape={invite.sectionStyles?.COUNTDOWN?.scratchShape} />
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
                      label={sectionDisplayName("TIMELINE")}
                      guidedActiveSectionId={guidedActiveSectionId}
                      edit={edit}
                      sectionImage={invite.sectionImages?.[section.type]}
                      sectionStyle={invite.sectionStyles?.[section.type]}
                      elementStyles={invite.elementStyles}
                      customText={invite.customText?.[section.type]}
                    >
                      <section
                        className="flex min-h-[40svh] flex-col items-center justify-center gap-3 px-6 text-center"
                        style={{ background: "var(--inv-background)" }}
                      >
                        <p className="text-sm opacity-70">No functions on the invitation yet.</p>
                        <EventSectionPicker />
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
                      label={`${sectionDisplayName("TIMELINE")} · ${event.name || `Function ${i + 1}`}`}
                      guidedActiveSectionId={guidedActiveSectionId}
                      edit={edit}
                      sectionImage={invite.sectionImages?.[section.type]}
                      sectionStyle={invite.sectionStyles?.[section.type]}
                      elementStyles={invite.elementStyles}
                      customText={invite.customText?.[section.type]}
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
                    label={sectionDisplayName(section.type)}
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                    sectionImage={invite.sectionImages?.[section.type]}
                    sectionStyle={invite.sectionStyles?.[section.type]}
                    elementStyles={invite.elementStyles}
                    customText={invite.customText?.[section.type]}
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
                    label={sectionDisplayName("VENUE")}
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                    sectionImage={invite.sectionImages?.[section.type]}
                    sectionStyle={invite.sectionStyles?.[section.type]}
                    elementStyles={invite.elementStyles}
                    customText={invite.customText?.[section.type]}
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
                    label={sectionDisplayName("RSVP")}
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                    sectionImage={invite.sectionImages?.[section.type]}
                    sectionStyle={invite.sectionStyles?.[section.type]}
                    elementStyles={invite.elementStyles}
                    customText={invite.customText?.[section.type]}
                  >
                    <RsvpSection
                      invitationId={invite.id}
                      guestId={guestId}
                      guestName={guestName}
                      previewMode={previewMode}
                    />
                  </SectionScope>
                );
              case "THANK_YOU":
                return (
                  <SectionScope
                    key={section.id}
                    id={section.id}
                    label={sectionDisplayName("THANK_YOU")}
                    guidedActiveSectionId={guidedActiveSectionId}
                    edit={edit}
                    sectionImage={invite.sectionImages?.[section.type]}
                    sectionStyle={invite.sectionStyles?.[section.type]}
                    elementStyles={invite.elementStyles}
                    customText={invite.customText?.[section.type]}
                  >
                    <ThankYouSection
                      brideName={invite.brideName}
                      groomName={invite.groomName}
                      hashtags={invite.copy?.hashtags}
                      shareUrl={previewMode ? undefined : shareUrl}
                      message={invite.copy?.thankYou}
                    />
                  </SectionScope>
                );
              default:
                return null;
            }
          })}
        </main>
      )}

      {inviteOpen && showRemixCta && !previewMode && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="no-print fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <StartLiveInvitationButton
            fromSlug={invite.slug}
            loadingVideoUrl={invite.revealVideoUrl}
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
