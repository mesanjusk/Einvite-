"use client";

import { ThemePhoneFrame } from "./theme-phone-frame";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { InviteExperience } from "@/components/invite/invite-experience";
import { EnvelopeSection } from "@/components/invite/envelope-section";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { sectionDisplayName } from "@/lib/section-labels";
import type { InviteData } from "@/components/invite/types";
import { buildInviteThemeStyle } from "@/lib/theme-css-vars";

type PreviewSection = string;

type PreviewProps = {
  section: PreviewSection;
  eventCategory?: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fonts: { display: string; body: string; script: string };
  content?: {
    eyebrow?: string;
    heroHeadline?: string;
    heroSubline?: string;
    invitationLetter?: string;
    storyHeadline?: string;
    thankYou?: string;
  };
  revealMode?: "ANIMATION" | "VIDEO";
  revealVideoUrl?: string;
  revealVideoWebmUrl?: string;
  revealVideoPosterUrl?: string;
  selectedElement?: string | null;
  revealAnimation?: {
    preset?: "MAGIC_BLOOM" | "SPARKLES" | "CONFETTI" | "PETALS";
    intensity?: unknown;
    speed?: unknown;
  };
  sectionImages?: Record<string, string>;
  sectionStyles?: Record<string, unknown>;
  elementStyles?: Record<string, unknown>;
  customText?: Record<string, unknown[]>;
  onSelectElement: (key: string) => void;
  onMoveElement?: (key: string, position: { x: number; y: number }) => void;
  compact?: boolean;
};

export function ThemeRealSectionPreview({
  section,
  eventCategory,
  palette,
  fonts,
  content,
  revealMode,
  revealVideoUrl,
  revealVideoWebmUrl,
  revealVideoPosterUrl,
  selectedElement,
  revealAnimation,
  sectionImages,
  sectionStyles,
  elementStyles,
  customText,
  onSelectElement,
  onMoveElement,
  compact = false,
}: PreviewProps) {
  const drag = useRef<{ pointerId: number; key: string; startX: number; startY: number; x: number; y: number; width: number; height: number } | null>(null);
  const [envelopeReplay, setEnvelopeReplay] = useState(0);
  const replayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (replayTimer.current) clearTimeout(replayTimer.current); }, []);
  const resolvedRevealMode = revealMode ?? "ANIMATION";
  const resolvedRevealAnimation: InviteData["revealAnimation"] = {
    preset: revealAnimation?.preset ?? "MAGIC_BLOOM",
    intensity: Number(revealAnimation?.intensity ?? 1),
    speed: Number(revealAnimation?.speed ?? 1),
  };
  const resolvedSectionStyles = (sectionStyles ?? {}) as InviteData["sectionStyles"];
  const resolvedElementStyles = (elementStyles ?? {}) as InviteData["elementStyles"];
  const resolvedCustomText = (customText ?? {}) as InviteData["customText"];

  if (section === "ENVELOPE") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-1">
        {!compact && <PreviewHeading section={section} />}
        <ThemePhoneFrame
          style={buildInviteThemeStyle(palette, fonts)}
        >
          <LocaleProvider>
            <EnvelopeSection
              key={`${resolvedRevealMode}-${resolvedRevealAnimation.preset}-${resolvedRevealAnimation.intensity}-${resolvedRevealAnimation.speed}-${revealVideoUrl ?? "coded"}-${envelopeReplay}`}
              initials="M&A"
              mode={resolvedRevealMode}
              videoUrl={resolvedRevealMode === "VIDEO" ? revealVideoUrl ?? null : null}
              videoWebmUrl={resolvedRevealMode === "VIDEO" ? revealVideoWebmUrl ?? null : null}
              posterUrl={revealVideoPosterUrl}
              animation={resolvedRevealAnimation}
              backgroundImageUrl={sectionImages?.ENVELOPE}
              embedded
              autoPlay
              onComplete={() => {
                replayTimer.current = setTimeout(() => setEnvelopeReplay((value) => value + 1), 500);
              }}
            />
          </LocaleProvider>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (replayTimer.current) clearTimeout(replayTimer.current);
              setEnvelopeReplay((value) => value + 1);
            }}
            className="absolute right-2 top-2 z-30 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[9px] font-bold text-[#5a4168] shadow-sm backdrop-blur"
          >
            Replay
          </button>
        </ThemePhoneFrame>
        {!compact && (
          <p className="shrink-0 text-muted-foreground text-center text-[10px]">
            Real mobile opening. It loops automatically; use Replay to run it again.
          </p>
        )}
      </div>
    );
  }

  const invite: InviteData = {
    id: "theme-preview",
    slug: "theme-preview",
    eventCategory: eventCategory ?? "wedding",
    brideName: "Meera",
    bridePhoto: null,
    groomName: "Arjun",
    groomPhoto: null,
    weddingDate: new Date("2026-12-12T18:30:00"),
    venueName: "Celebration Palace",
    venueAddress: "Main Road, Your City",
    googleMapsUrl: null,
    customMessage: null,
    musicUrl: null,
    galleryAnimation: "fade",
    copy: {
      eyebrow: content?.eyebrow,
      heroHeadline: content?.heroHeadline,
      heroSubline: content?.heroSubline,
      invitationLetter:
        content?.invitationLetter ||
        "Together with our families, we invite you to celebrate this beautiful beginning with us.",
      storyHeadline: content?.storyHeadline || "Forever Us",
      thankYou:
        content?.thankYou ||
        "With love and gratitude, we cannot wait to celebrate with you.",
    },
    events: [
      {
        id: "preview-event",
        name: "Sangeet",
        date: new Date("2026-12-11T19:00:00"),
        time: "7:00 PM",
        venueName: "Celebration Palace",
        address: null,
        googleMapsUrl: null,
        dressCode: "Festive",
        accentColor: null,
        tagline: "An evening of music and celebration",
      },
    ],
    familyMembers: [],
    media: [{ id: "preview-photo", url: "/images/theme-preview-photo.svg", caption: "Sample customer photo", type: "IMAGE" }],
    isDemo: true,
    themeSlug: "preview",
    revealVideoUrl: resolvedRevealMode === "VIDEO" ? revealVideoUrl ?? null : null,
    revealVideoWebmUrl: resolvedRevealMode === "VIDEO" ? revealVideoWebmUrl ?? null : null,
    revealVideoPosterUrl,
    revealAnimation: resolvedRevealAnimation,
    sectionImages,
    sectionStyles: resolvedSectionStyles,
    elementStyles: resolvedElementStyles,
    customText: resolvedCustomText,
  };

  const sectionConfig = [
    {
      id: `preview-${section.toLowerCase()}`,
      type: section,
      visible: true,
      order: 0,
    },
  ];

  function captureSelection(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const selectable = target.closest<HTMLElement>("[data-theme-element]");
    if (!selectable) return;
    event.preventDefault();
    event.stopPropagation();
    const key = selectable.dataset.themeElement;
    if (key) onSelectElement(key);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!onMoveElement || event.pointerType !== "mouse" || event.button !== 0) return;
    let element = (event.target as HTMLElement).closest<HTMLElement>("[data-theme-element]");
    const key = element?.dataset.themeElement;
    if (!element || !key) return;
    let parent = element.parentElement?.closest<HTMLElement>("[data-theme-element]");
    while (parent?.dataset.themeElement === key) {
      element = parent;
      parent = element.parentElement?.closest<HTMLElement>("[data-theme-element]");
    }
    const bounds = element.getBoundingClientRect();
    const custom = Object.values(customText ?? {}).flat().find((block) => (block as { id?: string }).id === key) as { x?: number; y?: number } | undefined;
    const style = elementStyles?.[key] as { x?: number; y?: number } | undefined;
    drag.current = { pointerId: event.pointerId, key, startX: event.clientX, startY: event.clientY, x: custom?.x ?? style?.x ?? 0, y: custom?.y ?? style?.y ?? 0, width: Math.max(1, bounds.width), height: Math.max(1, bounds.height) };
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelectElement(key);
    event.preventDefault();
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (Math.abs(dx) + Math.abs(dy) < 4) return;
    const clamp = (value: number) => Math.round(Math.max(-60, Math.min(60, value)));
    onMoveElement?.(current.key, { x: clamp(current.x + dx / current.width * 100), y: clamp(current.y + dy / current.height * 100) });
    event.preventDefault();
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1">
      {!compact && <PreviewHeading section={section} />}
      <ThemePhoneFrame
        data-theme-preview
        onClickCapture={captureSelection}
        onPointerDownCapture={startDrag}
        onPointerMoveCapture={moveDrag}
        onPointerUpCapture={stopDrag}
        onPointerCancel={stopDrag}
      >
        <div
          className="[&_[data-theme-element]]:cursor-pointer [&_[data-theme-element]]:outline-offset-2 [&_[data-theme-element]:hover]:outline [&_[data-theme-element]:hover]:outline-2 [&_[data-theme-element]:hover]:outline-violet-400"
          style={buildInviteThemeStyle(palette, fonts)}
        >
          {selectedElement && <style>{`[data-theme-preview] [data-theme-element=${JSON.stringify(selectedElement)}]{outline:2px solid #76508c;outline-offset:3px;}`}</style>}
          <InviteExperience
            invite={invite}
            sectionConfig={sectionConfig}
            skipEnvelope
            previewMode
            onlySectionType={section}
          />
        </div>
      </ThemePhoneFrame>
      {!compact && (
        <p className="shrink-0 text-muted-foreground text-center text-[10px]">
          This is the real invitation section. Click text to edit; drag it to position. Customer values are samples.
        </p>
      )}
    </div>
  );
}

function PreviewHeading({ section }: { section: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold">Mobile preview · Fit to screen</p>
      <span className="rounded-full border px-2 py-1 text-[10px] font-semibold">{sectionDisplayName(section)}</span>
    </div>
  );
}
