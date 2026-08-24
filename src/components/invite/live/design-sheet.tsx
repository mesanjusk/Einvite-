"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GALLERY_ANIMATIONS } from "@/lib/validations/live-invitation";
import type { SectionConfigEntry } from "@/lib/get-invite-data";
import type { EditorTheme } from "./types";

const SECTION_LABELS: Record<string, string> = {
  HERO: "Names & invitation",
  COUNTDOWN: "Save the date",
  STORY: "Photos",
  GALLERY: "Photos",
  TIMELINE: "Functions",
  VENUE: "Venue",
  RSVP: "RSVP",
  THANK_YOU: "Thank you",
  ENVELOPE: "Envelope",
  REGISTRY: "Registry",
  INSTAGRAM: "Instagram",
};

/** The design sheet: which look the invitation wears, and what's on it. */
export function DesignSheet({
  open,
  onOpenChange,
  themes,
  activeThemeSlug,
  activeColorwaySlug,
  galleryAnimation,
  sections,
  onThemeChange,
  onColorwayChange,
  onGalleryAnimationChange,
  onSectionToggle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themes: EditorTheme[];
  activeThemeSlug: string | null;
  activeColorwaySlug: string | null;
  galleryAnimation: string;
  sections: SectionConfigEntry[];
  onThemeChange: (slug: string) => void;
  onColorwayChange: (slug: string | null) => void;
  onGalleryAnimationChange: (value: string) => void;
  onSectionToggle: (sectionId: string, visible: boolean) => void;
}) {
  const activeTheme = themes.find((theme) => theme.slug === activeThemeSlug);
  // "STORY" and "GALLERY" both drive the same photo pile, so only the one
  // that renders is worth a switch here.
  let photoSectionSeen = false;
  const toggleable = sections
    .filter((section) => section.type !== "ENVELOPE")
    .filter((section) => {
      if (section.type !== "GALLERY" && section.type !== "STORY") return true;
      if (photoSectionSeen) return false;
      photoSectionSeen = true;
      return true;
    })
    .sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Design</SheetTitle>
          <SheetDescription>
            The invitation behind this sheet changes as you tap.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          <section className="flex flex-col gap-2">
            <Label>Look</Label>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.slug}
                  type="button"
                  onClick={() => onThemeChange(theme.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors",
                    theme.slug === activeThemeSlug
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50",
                  )}
                >
                  <Swatch palette={theme.colorPalette} />
                  <span className="min-w-0 flex-1 truncate text-sm">{theme.name}</span>
                  {theme.slug === activeThemeSlug && (
                    <Check className="text-primary size-4" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {activeTheme && activeTheme.colorways.length > 0 && (
            <section className="flex flex-col gap-2">
              <Label>Colours</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onColorwayChange(null)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    !activeColorwaySlug
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50",
                  )}
                >
                  Original
                </button>
                {activeTheme.colorways.map((colorway) => (
                  <button
                    key={colorway.slug}
                    type="button"
                    onClick={() => onColorwayChange(colorway.slug)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                      colorway.slug === activeColorwaySlug
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50",
                    )}
                  >
                    <Swatch palette={colorway.colorPalette} small />
                    {colorway.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <Label>How photos appear</Label>
            <div className="flex flex-wrap gap-2">
              {GALLERY_ANIMATIONS.map((animation) => (
                <button
                  key={animation}
                  type="button"
                  onClick={() => onGalleryAnimationChange(animation)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs capitalize",
                    animation === galleryAnimation
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50",
                  )}
                >
                  {animation}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <Label>What&apos;s on the invitation</Label>
            <div className="flex flex-col divide-y rounded-lg border">
              {toggleable.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <span className="text-sm">
                    {SECTION_LABELS[section.type] ?? section.type}
                  </span>
                  <Switch
                    checked={section.visible}
                    disabled={section.locked}
                    onCheckedChange={(checked) => onSectionToggle(section.id, checked)}
                    aria-label={`Show ${SECTION_LABELS[section.type] ?? section.type}`}
                  />
                </div>
              ))}
            </div>
          </section>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Swatch({
  palette,
  small,
}: {
  palette: { primary: string; accent: string };
  small?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 rounded-full border",
        small ? "size-4" : "size-7",
      )}
      style={{
        background: `linear-gradient(135deg, ${palette.primary} 50%, ${palette.accent} 50%)`,
      }}
    />
  );
}
