"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pause, Play, Upload, X } from "lucide-react";

import { updateInvitationThemeAction } from "@/lib/actions/theme";
import { fontVarFor } from "@/lib/theme-css-vars";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ThemeVariant = {
  slug: string;
  name: string;
  isPremium: boolean;
  colorPalette: Palette;
  fontPairing: FontPairing;
  musicTrackId: string | null;
  galleryAnimation: string;
  effectPreset: string;
};

type Theme = {
  id: string;
  slug: string;
  name: string;
  category: string;
  colorPalette: Palette;
  fontPairing: FontPairing;
  variants: ThemeVariant[];
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
  currentVariantSlug,
  currentPalette,
  currentFonts,
  currentMusicTrackId,
  currentCustomMusicUrl,
  currentGalleryAnimation,
}: {
  invitationId: string;
  themes: Theme[];
  musicTracks: MusicTrack[];
  brideName: string;
  groomName: string;
  currentThemeSlug: string;
  currentVariantSlug: string | null;
  currentPalette: Palette;
  currentFonts: FontPairing;
  currentMusicTrackId: string | null;
  currentCustomMusicUrl: string | null;
  currentGalleryAnimation: string;
}) {
  const [category, setCategory] = useState<(typeof CATEGORY_TABS)[number]["value"]>("all");
  const [selectedSlug, setSelectedSlug] = useState(currentThemeSlug);
  const [selectedVariantSlug, setSelectedVariantSlug] = useState<string | null>(
    currentVariantSlug,
  );
  const [palette, setPalette] = useState(currentPalette);
  const [fonts, setFonts] = useState(currentFonts);
  const [musicTrackId, setMusicTrackId] = useState<string | null>(currentMusicTrackId);
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(currentCustomMusicUrl);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const musicInputRef = useRef<HTMLInputElement>(null);
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
    setSelectedVariantSlug(null);
    setPalette(theme.colorPalette);
    setFonts(theme.fontPairing);
  }

  function handleVariantPick(theme: Theme, variant: ThemeVariant) {
    setSelectedSlug(theme.slug);
    setSelectedVariantSlug(variant.slug);
    setPalette(variant.colorPalette);
    setFonts(variant.fontPairing);
    setMusicTrackId(variant.musicTrackId);
    setCustomMusicUrl(null);
    if (GALLERY_ANIMATIONS.some((item) => item.value === variant.galleryAnimation)) {
      setGalleryAnimation(variant.galleryAnimation as GalleryAnimation);
    }
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

  async function handleMusicUpload(file: File | undefined) {
    if (!file) return;
    setUploadingMusic(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("invitationId", invitationId);

    const response = await fetch("/api/media/upload-audio", { method: "POST", body: formData });
    const data = await response.json();
    setUploadingMusic(false);

    if (!response.ok) {
      toast.error(data.error ?? "Failed to upload audio");
      return;
    }
    setCustomMusicUrl(data.url);
    setMusicTrackId(null);
    if (musicInputRef.current) musicInputRef.current.value = "";
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateInvitationThemeAction({
        invitationId,
        themeSlug: selectedSlug,
        variantSlug: selectedVariantSlug,
        colorPalette: palette,
        fontPairing: fonts,
        musicTrackId: musicTrackId ?? null,
        customMusicUrl: customMusicUrl ?? null,
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
              <div key={theme.slug} className="overflow-hidden rounded-xl border">
                <button
                  type="button"
                  onClick={() => handleThemePick(theme)}
                  className={cn(
                    "w-full p-3 text-left transition-colors",
                    selectedSlug === theme.slug && !selectedVariantSlug
                      ? "bg-primary/5 ring-primary/30 ring-2 ring-inset"
                      : "hover:bg-muted/40",
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
                    {theme.category} · base
                  </span>
                </button>

                {theme.variants.length > 0 && (
                  <div className="border-t p-2">
                    <p className="text-muted-foreground mb-1.5 px-1 text-[9px] font-bold tracking-wide uppercase">
                      Variants
                    </p>
                    <div className="grid gap-1">
                      {theme.variants.map((variant) => (
                        <button
                          key={variant.slug}
                          type="button"
                          onClick={() => handleVariantPick(theme, variant)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition",
                            selectedSlug === theme.slug && selectedVariantSlug === variant.slug
                              ? "bg-primary/10 ring-primary/30 ring-1"
                              : "hover:bg-muted",
                          )}
                        >
                          <span
                            className="size-5 shrink-0 rounded-full border"
                            style={{
                              background: `linear-gradient(135deg, ${variant.colorPalette.primary} 50%, ${variant.colorPalette.accent} 50%)`,
                            }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{variant.name}</span>
                            <span className="text-muted-foreground block truncate text-[9px] capitalize">
                              {variant.effectPreset} · {variant.galleryAnimation}
                              {variant.musicTrackId ? " · music" : ""}
                            </span>
                          </span>
                          {variant.isPremium && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-800">
                              Pro
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
              onClick={() => {
                setMusicTrackId(null);
                setCustomMusicUrl(null);
              }}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm",
                musicTrackId === null && !customMusicUrl ? "border-primary ring-primary/30 ring-2" : "",
              )}
            >
              No music
            </button>
            {musicTracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-2.5",
                  musicTrackId === track.id && !customMusicUrl
                    ? "border-primary ring-primary/30 ring-2"
                    : "",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMusicTrackId(track.id);
                    setCustomMusicUrl(null);
                  }}
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

            <input
              ref={musicInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleMusicUpload(e.target.files?.[0])}
            />
            {customMusicUrl ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border-primary ring-primary/30 border px-4 py-2.5 ring-2">
                <span className="text-sm font-medium">Your uploaded song</span>
                <button
                  type="button"
                  onClick={() => setCustomMusicUrl(null)}
                  aria-label="Remove uploaded song"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => musicInputRef.current?.click()}
                disabled={uploadingMusic}
                className="w-fit"
              >
                <Upload />
                {uploadingMusic ? "Uploading…" : "Or upload your own song"}
              </Button>
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
