"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Blend, Copy, Pencil, Sparkles } from "lucide-react";

import {
  SECTION_TYPES,
  THEME_GALLERY_ANIMATIONS,
  themeColorwayFormSchema,
  type ThemeColorwayFormInput,
  type ThemeColorwayFormValues,
} from "@/lib/validations/admin";
import { upsertThemeColorwayAction } from "@/lib/actions/admin";
import {
  EFFECT_INTENSITIES,
  EFFECT_PRESETS,
  GALLERY_STYLES,
  HERO_STYLES,
  type ThemeDecorConfig,
} from "@/lib/theme-recipe";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export type ThemeMixerSource = {
  id: string;
  name: string;
  colorPalette: Palette;
  fontPairing: FontPairing;
  decorAssets: ThemeDecorConfig;
  revealMode: string;
  revealVideoUrl: string | null;
  defaultMusicTrackId: string | null;
  galleryAnimation: string;
  sectionOrder: string[];
  previewImage: string | null;
};

type VariantRecord = {
  id: string;
  name: string;
  slug: string;
  colorPalette: Palette;
  previewImage: string | null;
  fontPairing: FontPairing | null;
  decorAssets: ThemeDecorConfig | null;
  revealMode: string | null;
  revealVideoUrl: string | null;
  musicTrackId: string | null;
  galleryAnimation: string | null;
  sectionOrder: string[] | null;
  isPremium: boolean;
  sortOrder: number;
};

const PALETTE_KEYS: (keyof Palette)[] = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
];

const FONT_OPTIONS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Great Vibes",
  "Inter",
  "EB Garamond",
];

export function ThemeColorwayDialog({
  themeId,
  themeName,
  colorway,
  fallbackPalette,
  fallbackFonts,
  fallbackDecor,
  fallbackSectionOrder,
  donorThemes = [],
  musicTracks = [],
}: {
  themeId: string;
  themeName: string;
  colorway?: VariantRecord;
  fallbackPalette: Palette;
  fallbackFonts: FontPairing;
  fallbackDecor: ThemeDecorConfig;
  fallbackSectionOrder: string[];
  donorThemes?: ThemeMixerSource[];
  musicTracks?: Array<{ id: string; title: string; mood: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [donorId, setDonorId] = useState("");
  const router = useRouter();

  const form = useForm<ThemeColorwayFormValues, unknown, ThemeColorwayFormInput>({
    resolver: zodResolver(themeColorwayFormSchema),
    defaultValues: {
      id: colorway?.id,
      themeId,
      name: colorway?.name ?? "",
      slug: colorway?.slug ?? "",
      colorPalette: colorway?.colorPalette ?? fallbackPalette,
      previewImage: colorway?.previewImage ?? "",
      fontPairing: colorway?.fontPairing ?? undefined,
      decorAssets: colorway?.decorAssets ?? undefined,
      revealMode: (colorway?.revealMode as ThemeColorwayFormValues["revealMode"]) ?? undefined,
      revealVideoUrl: colorway?.revealVideoUrl ?? "",
      musicTrackId: colorway?.musicTrackId ?? undefined,
      galleryAnimation:
        (colorway?.galleryAnimation as ThemeColorwayFormValues["galleryAnimation"]) ?? undefined,
      sectionOrder:
        (colorway?.sectionOrder as ThemeColorwayFormValues["sectionOrder"]) ?? undefined,
      isPremium: colorway?.isPremium ?? true,
      sortOrder: colorway?.sortOrder ?? 0,
    },
  });

  const donor = useMemo(
    () => donorThemes.find((theme) => theme.id === donorId) ?? null,
    [donorId, donorThemes],
  );

  const fontOverride = form.watch("fontPairing");
  const decorOverride = form.watch("decorAssets");
  const sectionOverride = form.watch("sectionOrder");

  function borrow(part: "colors" | "fonts" | "effects" | "opening" | "sections" | "all") {
    if (!donor) {
      toast.error("Choose a source theme first.");
      return;
    }

    if (part === "colors" || part === "all") {
      form.setValue("colorPalette", donor.colorPalette);
    }
    if (part === "fonts" || part === "all") {
      form.setValue("fontPairing", donor.fontPairing);
    }
    if (part === "effects" || part === "all") {
      form.setValue("decorAssets", donor.decorAssets);
      if (donor.previewImage) form.setValue("previewImage", donor.previewImage);
    }
    if (part === "opening" || part === "all") {
      form.setValue(
        "revealMode",
        donor.revealMode as ThemeColorwayFormValues["revealMode"],
      );
      form.setValue("revealVideoUrl", donor.revealVideoUrl ?? "");
      form.setValue("musicTrackId", donor.defaultMusicTrackId ?? undefined);
      form.setValue(
        "galleryAnimation",
        donor.galleryAnimation as ThemeColorwayFormValues["galleryAnimation"],
      );
    }
    if (part === "sections" || part === "all") {
      form.setValue(
        "sectionOrder",
        donor.sectionOrder as ThemeColorwayFormValues["sectionOrder"],
      );
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const current = [...(form.getValues("sectionOrder") ?? fallbackSectionOrder)];
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    form.setValue("sectionOrder", current as ThemeColorwayFormValues["sectionOrder"]);
  }

  function toggleSection(type: (typeof SECTION_TYPES)[number]) {
    const current = [...(form.getValues("sectionOrder") ?? fallbackSectionOrder)];
    const next = current.includes(type)
      ? current.filter((value) => value !== type)
      : [...current, type];
    form.setValue("sectionOrder", next as ThemeColorwayFormValues["sectionOrder"]);
  }

  async function onSubmit(values: ThemeColorwayFormInput) {
    setLoading(true);
    const result = await upsertThemeColorwayAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(colorway ? "Variant updated." : "Variant added.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {colorway ? (
          <IconButton label={`Edit ${colorway.name}`}>
            <Pencil className="size-3.5" />
          </IconButton>
        ) : (
          <IconButton label={`Add a variant to ${themeName}`} variant="outline">
            <Blend className="size-4" />
          </IconButton>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {colorway ? `Edit ${colorway.name}` : `Mix a new variant for ${themeName}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <Label>Borrow pieces from another theme</Label>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Pick a source, then copy only the pieces you want. The base theme stays unchanged.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                className="border-input h-10 rounded-xl border bg-background px-3 text-sm"
                value={donorId}
                onChange={(event) => setDonorId(event.target.value)}
              >
                <option value="">Choose source theme…</option>
                {donorThemes
                  .filter((theme) => theme.id !== themeId)
                  .map((theme) => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
              </select>
              <Button type="button" variant="outline" onClick={() => borrow("all")} disabled={!donor}>
                <Copy className="size-4" />
                Copy all
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["colors", "Colours"],
                ["fonts", "Fonts"],
                ["effects", "Effects & images"],
                ["opening", "Opening & sound"],
                ["sections", "Sections"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!donor}
                  onClick={() => borrow(value as "colors" | "fonts" | "effects" | "opening" | "sections")}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input placeholder="Emerald Royal" {...form.register("name")} />
            </div>
            <div className="grid gap-1.5">
              <Label>Slug</Label>
              <Input placeholder="emerald-royal" {...form.register("slug")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label>Preview image</Label>
              <Input placeholder="Optional variant thumbnail URL" {...form.register("previewImage")} />
            </div>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5">
              <Label className="text-xs">Premium</Label>
              <Switch
                checked={form.watch("isPremium")}
                onCheckedChange={(value) => form.setValue("isPremium", value)}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Order</Label>
              <Input className="w-24" type="number" {...form.register("sortOrder", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl border p-4">
            <Label>Colours</Label>
            <div className="grid grid-cols-5 gap-2">
              {PALETTE_KEYS.map((key) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <input
                    type="color"
                    aria-label={key}
                    className="size-9 cursor-pointer rounded border bg-transparent"
                    value={form.watch(`colorPalette.${key}`)}
                    onChange={(event) =>
                      form.setValue(`colorPalette.${key}`, event.target.value)
                    }
                  />
                  <span className="text-muted-foreground text-[9px] capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Fonts</Label>
                <p className="text-muted-foreground text-xs">
                  Leave inherited to keep the base theme&apos;s typography.
                </p>
              </div>
              {fontOverride ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue("fontPairing", undefined)}>
                  Use base
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("fontPairing", fallbackFonts)}>
                  Override
                </Button>
              )}
            </div>
            {fontOverride && (
              <div className="grid gap-2 sm:grid-cols-3">
                {(["display", "body", "script"] as const).map((key) => (
                  <div key={key} className="grid gap-1">
                    <Label className="text-[10px] capitalize">{key}</Label>
                    <select
                      className="border-input h-9 rounded-md border bg-transparent px-2 text-xs"
                      value={form.watch(`fontPairing.${key}`) ?? fallbackFonts[key]}
                      onChange={(event) => form.setValue(`fontPairing.${key}`, event.target.value)}
                    >
                      {FONT_OPTIONS.map((font) => <option key={font}>{font}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Effects & image treatment</Label>
                <p className="text-muted-foreground text-xs">
                  Petals, sparkles, background/motif images and section styling.
                </p>
              </div>
              {decorOverride ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue("decorAssets", undefined)}>
                  Use base
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("decorAssets", fallbackDecor)}>
                  Override
                </Button>
              )}
            </div>

            {decorOverride && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <SelectField
                    label="Effect"
                    value={form.watch("decorAssets.effectPreset")}
                    options={EFFECT_PRESETS}
                    onChange={(value) =>
                      form.setValue("decorAssets.effectPreset", value as ThemeDecorConfig["effectPreset"])
                    }
                  />
                  <SelectField
                    label="Intensity"
                    value={form.watch("decorAssets.effectIntensity")}
                    options={EFFECT_INTENSITIES}
                    onChange={(value) =>
                      form.setValue("decorAssets.effectIntensity", value as ThemeDecorConfig["effectIntensity"])
                    }
                  />
                  <SelectField
                    label="Hero"
                    value={form.watch("decorAssets.heroStyle")}
                    options={HERO_STYLES}
                    onChange={(value) =>
                      form.setValue("decorAssets.heroStyle", value as ThemeDecorConfig["heroStyle"])
                    }
                  />
                  <SelectField
                    label="Gallery"
                    value={form.watch("decorAssets.galleryStyle")}
                    options={GALLERY_STYLES}
                    onChange={(value) =>
                      form.setValue("decorAssets.galleryStyle", value as ThemeDecorConfig["galleryStyle"])
                    }
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Background image URL" {...form.register("decorAssets.backgroundImageUrl")} />
                  <Input placeholder="Motif / overlay image URL" {...form.register("decorAssets.motifImageUrl")} />
                </div>
              </>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border p-4">
            <Label>Opening, sound & motion</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-1">
                <Label className="text-[10px]">Opening</Label>
                <select
                  className="border-input h-9 rounded-md border bg-transparent px-2 text-xs"
                  value={form.watch("revealMode") ?? ""}
                  onChange={(event) =>
                    form.setValue(
                      "revealMode",
                      (event.target.value || undefined) as ThemeColorwayFormValues["revealMode"],
                    )
                  }
                >
                  <option value="">Inherit base</option>
                  <option value="ANIMATION">Animation</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px]">Photo motion</Label>
                <select
                  className="border-input h-9 rounded-md border bg-transparent px-2 text-xs capitalize"
                  value={form.watch("galleryAnimation") ?? ""}
                  onChange={(event) =>
                    form.setValue(
                      "galleryAnimation",
                      (event.target.value || undefined) as ThemeColorwayFormValues["galleryAnimation"],
                    )
                  }
                >
                  <option value="">Inherit base</option>
                  {THEME_GALLERY_ANIMATIONS.map((value) => <option key={value}>{value}</option>)}
                </select>
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px]">Music</Label>
                <select
                  className="border-input h-9 rounded-md border bg-transparent px-2 text-xs"
                  value={form.watch("musicTrackId") ?? ""}
                  onChange={(event) =>
                    form.setValue("musicTrackId", event.target.value || undefined)
                  }
                >
                  <option value="">Inherit base/default</option>
                  {musicTracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.title}{track.mood ? ` · ${track.mood}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {form.watch("revealMode") === "VIDEO" && (
              <Input placeholder="Opening video URL" {...form.register("revealVideoUrl")} />
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Section recipe</Label>
                <p className="text-muted-foreground text-xs">
                  Reorder or remove sections only when this variant needs a different flow.
                </p>
              </div>
              {sectionOverride ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue("sectionOrder", undefined)}>
                  Use base
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    form.setValue(
                      "sectionOrder",
                      fallbackSectionOrder as ThemeColorwayFormValues["sectionOrder"],
                    )
                  }
                >
                  Customize
                </Button>
              )}
            </div>

            {sectionOverride && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {SECTION_TYPES.filter((type) => !sectionOverride.includes(type)).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleSection(type)}
                      className="rounded-full border px-2 py-1 text-[10px]"
                    >
                      + {type}
                    </button>
                  ))}
                </div>
                <div className="grid gap-1">
                  {sectionOverride.map((type, index) => (
                    <div key={type} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                      <span className="flex-1">{type}</span>
                      <button type="button" disabled={index === 0} onClick={() => moveSection(index, -1)}>↑</button>
                      <button type="button" disabled={index === sectionOverride.length - 1} onClick={() => moveSection(index, 1)}>↓</button>
                      <button type="button" className="text-destructive" onClick={() => toggleSection(type)}>×</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : colorway ? "Save variant" : "Add variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-[10px]">{label}</Label>
      <select
        className="border-input h-9 rounded-md border bg-transparent px-2 text-xs capitalize"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option.replace("-", " ")}</option>
        ))}
      </select>
    </div>
  );
}
