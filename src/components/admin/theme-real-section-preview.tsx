"use client";

import type { MouseEvent } from "react";

import { InviteExperience } from "@/components/invite/invite-experience";
import type { InviteData } from "@/components/invite/types";

type PreviewSection = string;

type PreviewProps = {
  section: PreviewSection;
  eventCategory: string;
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
  revealMode: "ANIMATION" | "VIDEO";
  revealVideoUrl?: string;
  revealAnimation?: InviteData["revealAnimation"];
  sectionImages?: InviteData["sectionImages"];
  sectionStyles?: InviteData["sectionStyles"];
  elementStyles?: InviteData["elementStyles"];
  customText?: InviteData["customText"];
  onSelectElement: (key: string) => void;
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
}: PreviewProps) {
  if (section === "ENVELOPE") {
    return (
      <div className="grid gap-2">
        <PreviewHeading section={section} />
        <div
          className="relative mx-auto aspect-[9/16] w-full max-w-[285px] overflow-hidden rounded-[28px] border-[5px] border-violet-950 bg-cover bg-center shadow-xl"
          style={{
            backgroundColor: palette.primary,
            backgroundImage: sectionImages?.ENVELOPE
              ? `url("${sectionImages.ENVELOPE.replace(/"/g, "\\\"")}")`
              : undefined,
          }}
        >
          {revealMode === "VIDEO" && revealVideoUrl ? (
            <video
              src={revealVideoUrl}
              className="absolute inset-0 size-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center overflow-hidden">
              <div
                className="absolute size-64 animate-pulse rounded-full opacity-40 blur-3xl"
                style={{ background: palette.accent }}
              />
              <div className="relative text-center text-white">
                <div
                  className="mx-auto grid size-24 place-items-center rounded-full border border-white/40 bg-white/10 text-3xl backdrop-blur"
                  style={{ fontFamily: fonts.script }}
                >
                  M&amp;A
                </div>
                <p className="mt-5 text-xl" style={{ fontFamily: fonts.script }}>
                  {revealAnimation?.preset?.replaceAll("_", " ") ?? "MAGIC BLOOM"}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] opacity-70">
                  coded reveal preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const invite: InviteData = {
    id: "theme-preview",
    slug: "theme-preview",
    eventCategory,
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
    revealVideoUrl: revealMode === "VIDEO" ? revealVideoUrl ?? null : null,
    revealAnimation,
    sectionImages,
    sectionStyles,
    elementStyles,
    customText,
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
      <PreviewHeading section={section} />
      <div
        className="relative mx-auto h-[570px] w-full max-w-[285px] overflow-y-auto overflow-x-hidden rounded-[28px] border-[5px] border-violet-950 bg-white shadow-xl"
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
      <p className="text-muted-foreground text-center text-[10px]">
        This is the real invitation section. Click its text to edit that exact element.
      </p>
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
      <span className="rounded-full border px-2 py-1 text-[10px] font-semibold">{section}</span>
    </div>
  );
}
