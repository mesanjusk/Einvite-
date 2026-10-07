"use client";

import { useState, type MouseEvent } from "react";

import { InviteExperience } from "@/components/invite/invite-experience";
import { EnvelopeSection } from "@/components/invite/envelope-section";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { sectionDisplayName } from "@/lib/section-labels";
import type { InviteData } from "@/components/invite/types";

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
  revealAnimation,
  sectionImages,
  sectionStyles,
  elementStyles,
  customText,
  onSelectElement,
  compact = false,
}: PreviewProps) {
  const [envelopeReplay, setEnvelopeReplay] = useState(0);
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
      <div className="grid gap-2">
        {!compact && <PreviewHeading section={section} />}
        <div
          className={`relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-[28px] border-[5px] border-violet-950 bg-white shadow-xl ${compact ? "max-w-[245px]" : "max-w-[285px]"}`}
          style={
            {
              "--inv-primary": palette.primary,
              "--inv-secondary": palette.secondary,
              "--inv-accent": palette.accent,
              "--inv-background": palette.background,
              "--inv-foreground": palette.foreground,
              "--inv-font-display": fonts.display,
              "--inv-font-body": fonts.body,
              "--inv-font-script": fonts.script,
            } as React.CSSProperties
          }
        >
          <LocaleProvider>
            <EnvelopeSection
              key={`${resolvedRevealMode}-${resolvedRevealAnimation.preset}-${resolvedRevealAnimation.intensity}-${resolvedRevealAnimation.speed}-${revealVideoUrl ?? "coded"}-${envelopeReplay}`}
              initials="M&A"
              videoUrl={resolvedRevealMode === "VIDEO" ? revealVideoUrl ?? null : null}
              animation={resolvedRevealAnimation}
              backgroundImageUrl={sectionImages?.ENVELOPE}
              embedded
              autoPlay
              onComplete={() => {
                window.setTimeout(() => setEnvelopeReplay((value) => value + 1), 500);
              }}
            />
          </LocaleProvider>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setEnvelopeReplay((value) => value + 1);
            }}
            className="absolute right-2 top-2 z-30 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[9px] font-bold text-[#5a4168] shadow-sm backdrop-blur"
          >
            Replay
          </button>
        </div>
        {!compact && (
          <p className="text-muted-foreground text-center text-[10px]">
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
    media: [],
    isDemo: true,
    themeSlug: "preview",
    revealVideoUrl: resolvedRevealMode === "VIDEO" ? revealVideoUrl ?? null : null,
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

  return (
    <div className="grid gap-2">
      {!compact && <PreviewHeading section={section} />}
      <div
        className={`relative mx-auto w-full overflow-y-auto overflow-x-hidden rounded-[28px] border-[5px] border-violet-950 bg-white shadow-xl ${compact ? "h-[48vh] min-h-[360px] max-h-[500px] max-w-[245px]" : "h-[570px] max-w-[285px]"}`}
        onClickCapture={captureSelection}
      >
        <div
          className="[&_[data-theme-element]]:cursor-pointer [&_[data-theme-element]]:outline-offset-2 hover:[&_[data-theme-element]]:outline hover:[&_[data-theme-element]]:outline-2 hover:[&_[data-theme-element]]:outline-violet-400"
          style={
            {
              "--inv-primary": palette.primary,
              "--inv-secondary": palette.secondary,
              "--inv-accent": palette.accent,
              "--inv-background": palette.background,
              "--inv-foreground": palette.foreground,
              "--inv-font-display": fonts.display,
              "--inv-font-body": fonts.body,
              "--inv-font-script": fonts.script,
            } as React.CSSProperties
          }
        >
          <InviteExperience
            invite={invite}
            sectionConfig={sectionConfig}
            skipEnvelope
            previewMode
            onlySectionType={section}
          />
        </div>
      </div>
      {!compact && (
        <p className="text-muted-foreground text-center text-[10px]">
          This is the real invitation section. Click its text to edit that exact element.
        </p>
      )}
    </div>
  );
}

function PreviewHeading({ section }: { section: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-semibold">Actual section preview</p>
        <p className="text-muted-foreground text-[11px]">Same component used by the guest invitation.</p>
      </div>
      <span className="rounded-full border px-2 py-1 text-[10px] font-semibold">{sectionDisplayName(section)}</span>
    </div>
  );
}
