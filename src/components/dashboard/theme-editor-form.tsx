"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pause, Play } from "lucide-react";

import { updateInvitationThemeAction } from "@/lib/actions/theme";
import { fontVarFor } from "@/lib/theme-css-vars";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Theme = {
  id: string;
  slug: string;
  name: string;
  category: string;
  colorPalette: { primary: string; accent: string; background: string };
  fontPairing: { display: string; body: string; script: string };
};

type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
};

type FontPairing = {
  display: string;
  body: string;
  script: string;
};

type MusicTrack = {
  id: string;
  title: string;
  mood: string | null;
  url: string;
};

const FONT_OPTIONS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Great Vibes",
  "Inter",
  "EB Garamond",
];

const GALLERY_ANIMATIONS = [
  { value: "fade", label: "Fade up" },
  { value: "slide", label: "Slide in" },
  { value: "zoom", label: "Zoom in" },
  { value: "flip", label: "Flip" },
  { value: "blur", label: "Blur reveal" },
] as const;

type GalleryAnimation = (typeof GALLERY_ANIMATIONS)[number]["value"];

const CATEGORY_TABS = [
  { value: "all", label: "All" },
  { value: "traditional", label: "Traditional" },
  { value: "modern", label: "Modern" },
  { value: "fusion", label: "Fusion" },
  { value: "minimal", label: "Minimal" },
] as const;

export function ThemeEditorForm({
  invitationId,
  themes,
  musicTracks,
  brideName,
  groomName,
  currentThemeSlug,
  currentPalette,
  currentFonts,
  currentMusicTrackId,
  currentGalleryAnimation,
}: {
  invitationId: string;
  themes: Theme[];
  musicTracks: MusicTrack[];
  brideName: string;
  groomName: string;
  currentThemeSlug: string;
  currentPalette: Palette;
  currentFonts: FontPairing;
  currentMusicTrackId: string | null;
  currentGalleryAnimation: string;
}) {
  const [category, setCategory] = useState<(typeof CATEGORY_TABS)[number]["value"]>("all");
  const [selectedSlug, setSelectedSlug] = useState(currentThemeSlug);
  const [palette, setPalette] = useState(currentPalette);
  const [fonts, setFonts] = useState(currentFonts);
  const [musicTrackId, setMusicTrackId] = useState<string | null>(currentMusicTrackId);
  const [galleryAnimation, setGalleryAnimation] = useState<GalleryAnimation>(
    GALLERY_ANIMATIONS.some((a) => a.value === currentGalleryAnimation)
      ? (currentGalleryAnimation as GalleryAnimation)
      : "fade",
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);

  const visibleThemes = useMemo(
    () => (category === "all" ? themes : themes.filter((t) => t.category === category)),
    [themes, category],
  );

  function handleThemePick(theme: Theme) {
    setSelectedSlug(theme.slug);
    setPalette((p) => ({
      ...p,
      primary: theme.colorPalette.primary,
      accent: theme.colorPalette.accent,
      background: theme.colorPalette.background,
    }));
    setFonts(theme.fontPairing);
  }

  function togglePreview(track: MusicTrack) {
    const audio = previewAudioRef.current;
    if (playingPreviewId === track.id && audio) {
      audio.pause();
      setPlayingPreviewId(null);
      return;
    }
    if (audio) audio.pause();
    const next = new Audio(track.url);
    next.volume = 0.5;
    next.play().catch(() => toast.error("Couldn't preview this track."));
    next.addEventListener("ended", () => setPlayingPreviewId(null));
    previewAudioRef.current = next;
    setPlayingPreviewId(track.id);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateInvitationThemeAction({
        invitationId,
        themeSlug: selectedSlug,
        colorPalette: palette,
        fontPairing: fonts,
        musicTrackId: musicTrackId ?? null,
        galleryAnimation,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Theme updated.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-8">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Label className="block">Base theme</Label>
            <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <TabsList>
                {CATEGORY_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleThemes.map((theme) => (
              <button
                key={theme.slug}
                type="button"
                onClick={() => handleThemePick(theme)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  selectedSlug === theme.slug ? "border-primary ring-primary/30 ring-2" : "",
                )}
              >
                <div
                  className="mb-2 flex h-16 items-center justify-center rounded-md"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colorPalette.primary}, ${theme.colorPalette.accent})`,
                  }}
                >
                  <span
                    className="text-lg"
                    style={{
                      fontFamily: fontVarFor(theme.fontPairing.script),
                      color: theme.colorPalette.background,
                    }}
                  >
                    Aa
                  </span>
                </div>
                <span className="text-sm font-medium">{theme.name}</span>
                <span className="text-muted-foreground block text-[11px] capitalize">
                  {theme.category}
                </span>
              </button>
            ))}
            {visibleThemes.length === 0 && (
              <p className="text-muted-foreground col-span-full py-6 text-center text-sm">
                No themes in this category yet.
              </p>
            )}
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Color overrides</Label>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(Object.keys(palette) as (keyof Palette)[]).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label className="text-xs capitalize">{key}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={palette[key]}
                    onChange={(e) => setPalette((p) => ({ ...p, [key]: e.target.value }))}
                    className="h-9 w-9 cursor-pointer rounded border"
                  />
                  <span className="text-muted-foreground font-mono text-xs">{palette[key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Fonts</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["display", "body", "script"] as const).map((key) => (
              <div key={key} className="grid gap-1.5">
                <Label className="text-xs capitalize">{key} font</Label>
                <select
                  className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
                  value={fonts[key]}
                  onChange={(e) => setFonts((f) => ({ ...f, [key]: e.target.value }))}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                <p
                  className="text-lg"
                  style={{ fontFamily: fontVarFor(fonts[key]) }}
                >
                  Aa Bb Cc
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Gallery photo animation</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {GALLERY_ANIMATIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGalleryAnimation(option.value)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-center text-xs font-medium transition-colors",
                  galleryAnimation === option.value
                    ? "border-primary ring-primary/30 ring-2"
                    : "text-muted-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Background music</Label>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => setMusicTrackId(null)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm",
                musicTrackId === null ? "border-primary ring-primary/30 ring-2" : "",
              )}
            >
              No music
            </button>
            {musicTracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-2.5",
                  musicTrackId === track.id ? "border-primary ring-primary/30 ring-2" : "",
                )}
              >
                <button
                  type="button"
                  onClick={() => setMusicTrackId(track.id)}
                  className="flex-1 text-left text-sm"
                >
                  {track.title}
                  {track.mood && (
                    <span className="text-muted-foreground ml-2 text-xs">{track.mood}</span>
                  )}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePreview(track)}
                  aria-label={`Preview ${track.title}`}
                >
                  {playingPreviewId === track.id ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                </Button>
              </div>
            ))}
            {musicTracks.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No tracks in your library yet — add some from{" "}
                <span className="underline">Music Library</span>.
              </p>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-fit">
          {isPending ? "Saving…" : "Save theme"}
        </Button>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Label className="mb-3 block">Live preview</Label>
        <Card className="overflow-hidden py-0">
          <CardContent
            className="relative flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center"
            style={{ background: palette.background, color: palette.foreground }}
          >
            <p
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: palette.accent }}
            >
              The Wedding Of
            </p>
            <div
              className="flex size-14 items-center justify-center rounded-full border text-lg"
              style={{
                borderColor: palette.accent,
                color: palette.accent,
                fontFamily: fontVarFor(fonts.script),
              }}
            >
              {brideName[0]}
              {groomName[0]}
            </div>
            <p
              className="text-4xl leading-tight"
              style={{ fontFamily: fontVarFor(fonts.display), color: palette.primary }}
            >
              {brideName}
            </p>
            <span style={{ fontFamily: fontVarFor(fonts.script), color: palette.accent }} className="text-2xl">
              &amp;
            </span>
            <p
              className="text-4xl leading-tight"
              style={{ fontFamily: fontVarFor(fonts.display), color: palette.primary }}
            >
              {groomName}
            </p>
            <p
              className="text-sm italic opacity-80"
              style={{ fontFamily: fontVarFor(fonts.body) }}
            >
              Together with our families, we joyfully invite you.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
