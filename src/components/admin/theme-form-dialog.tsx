"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

import {
  REVEAL_ANIMATION_PRESETS,
  SECTION_TYPES,
  THEME_CATEGORIES,
  themeFormSchema,
  type ThemeFormInput,
  type ThemeFormValues,
} from "@/lib/validations/admin";
import { upsertThemeAction } from "@/lib/actions/admin";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type DecorAssets = {
  revealAnimation?: {
    preset?: (typeof REVEAL_ANIMATION_PRESETS)[number];
    intensity?: number;
    speed?: number;
  };
  sectionImages?: Record<string, string>;
};

type ThemeRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  eventCategory: string;
  isPremium: boolean;
  sortOrder: number;
  previewImage: string | null;
  revealMode: string;
  revealVideoUrl: string | null;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fontPairing: { display: string; body: string; script: string };
  decorAssets?: DecorAssets | null;
  sectionOrder: string[];
};

type ThemeType = "WEBSITE" | "PDF";
type LibraryVideo = { label: string; url: string };

const FONT_OPTIONS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Great Vibes",
  "Inter",
  "EB Garamond",
];

const ANIMATION_LABELS: Record<(typeof REVEAL_ANIMATION_PRESETS)[number], string> = {
  MAGIC_BLOOM: "Magic bloom",
  SPARKLES: "Golden sparkles",
  CONFETTI: "Celebration confetti",
  PETALS: "Falling petals",
};

function defaultValues(type: ThemeType, theme?: ThemeRecord): ThemeFormValues {
  const decor = theme?.decorAssets ?? {};
  return {
    id: theme?.id,
    type,
    name: theme?.name ?? "",
    slug: theme?.slug ?? "",
    description: theme?.description ?? "",
    previewImage: theme?.previewImage ?? "",
    revealMode: (theme?.revealMode as ThemeFormValues["revealMode"]) ?? "ANIMATION",
    revealVideoUrl: theme?.revealVideoUrl ?? "",
    category: (theme?.category as ThemeFormValues["category"]) ?? "classic",
    eventCategory:
      (theme?.eventCategory as ThemeFormValues["eventCategory"]) ?? "wedding",
    isPremium: theme?.isPremium ?? false,
    sortOrder: theme?.sortOrder ?? 0,
    colorPalette: theme?.colorPalette ?? {
      primary: "#7a2e2e",
      secondary: "#f3d9d9",
      accent: "#c9942a",
      background: "#faf3ea",
      foreground: "#3a1414",
    },
    fontPairing: theme?.fontPairing ?? {
      display: "Playfair Display",
      body: "Cormorant Garamond",
      script: "Great Vibes",
    },
    decorAssets: {
      revealAnimation: {
        preset: decor.revealAnimation?.preset ?? "MAGIC_BLOOM",
        intensity: decor.revealAnimation?.intensity ?? 1,
        speed: decor.revealAnimation?.speed ?? 1,
      },
      sectionImages: decor.sectionImages ?? {},
    },
    sectionOrder:
      (theme?.sectionOrder as ThemeFormValues["sectionOrder"]) ?? [
        "ENVELOPE",
        "HERO",
        "COUNTDOWN",
        "TIMELINE",
        "GALLERY",
        "VENUE",
        "RSVP",
        "THANK_YOU",
      ],
  };
}

export function ThemeFormDialog({
  theme,
  type = "WEBSITE",
  revealVideoLibrary = [],
}: {
  theme?: ThemeRecord;
  type?: ThemeType;
  revealVideoLibrary?: LibraryVideo[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [assetUploading, setAssetUploading] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<ThemeFormValues, unknown, ThemeFormInput>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: defaultValues(type, theme),
  });

  const sectionOrder = form.watch("sectionOrder");

  function toggleSection(sectionType: (typeof SECTION_TYPES)[number]) {
    const current = form.getValues("sectionOrder");
    if (current.includes(sectionType)) {
      form.setValue(
        "sectionOrder",
        current.filter((s) => s !== sectionType),
      );
    } else {
      form.setValue("sectionOrder", [...current, sectionType]);
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const current = [...form.getValues("sectionOrder")];
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    form.setValue("sectionOrder", current);
  }

  async function uploadAsset(file: File | undefined, kind: "image" | "video") {
    if (!file) return null;
    setAssetUploading(kind);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      const response = await fetch("/api/admin/theme-assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Upload failed.");
        return null;
      }
      return data as { url: string; webmUrl?: string; posterUrl?: string };
    } finally {
      setAssetUploading(null);
    }
  }

  async function handleThumbnailUpload(file: File | undefined) {
    if (!file) return;
    setThumbUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/theme-assets/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setThumbUploading(false);
    if (!response.ok) {
      toast.error(data.error ?? "Failed to upload image");
      return;
    }
    form.setValue("previewImage", data.url);
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  }

  async function handleRevealVideo(file?: File) {
    const uploaded = await uploadAsset(file, "video");
    if (uploaded?.url) {
      form.setValue("revealVideoUrl", uploaded.url);
      toast.success("Reveal video uploaded and selected.");
    }
  }

  async function handleSectionImage(
    sectionType: (typeof SECTION_TYPES)[number],
    file?: File,
  ) {
    const uploaded = await uploadAsset(file, "image");
    if (!uploaded?.url) return;
    const current = form.getValues("decorAssets.sectionImages") ?? {};
    form.setValue("decorAssets.sectionImages", {
      ...current,
      [sectionType]: uploaded.url,
    });
    toast.success(`${sectionType} artwork uploaded.`);
  }

  async function onSubmit(values: ThemeFormInput) {
    setLoading(true);
    const result = await upsertThemeAction(values);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(theme ? "Theme updated and published." : "Theme created and published.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {theme ? (
          <IconButton label="Edit">
            <Pencil className="size-4" />
          </IconButton>
        ) : (
          <IconButton label={type === "PDF" ? "New PDF theme" : "New theme"} variant="default">
            <Plus className="size-4" />
          </IconButton>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {theme ? `Edit ${theme.name}` : type === "PDF" ? "New PDF theme" : "New theme"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid min-w-0 gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label>Slug</Label>
              <Input {...form.register("slug")} disabled={!!theme} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} {...form.register("description")} />
          </div>

          <div className="grid gap-1.5">
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-3">
              {form.watch("previewImage") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.watch("previewImage")} alt="" className="size-20 rounded-xl border object-cover" />
              ) : (
                <div className="text-muted-foreground grid size-20 place-items-center rounded-xl border border-dashed">
                  <ImageIcon className="size-5" />
                </div>
              )}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleThumbnailUpload(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => thumbInputRef.current?.click()} disabled={thumbUploading}>
                <Upload className="size-4" />
                {thumbUploading ? "Uploading…" : "Upload thumbnail"}
              </Button>
            </div>
          </div>

          {type === "WEBSITE" && (
            <section className="grid gap-3 rounded-2xl border p-4">
              <div>
                <Label className="text-base">Envelope reveal</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Use a coded animation or a 3–5 second video. Uploaded videos automatically become reusable through the existing-theme library.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => form.setValue("revealMode", "ANIMATION")}
                  className={`rounded-xl border p-3 text-left ${form.watch("revealMode") === "ANIMATION" ? "border-primary bg-primary/5" : ""}`}
                >
                  <Sparkles className="mb-2 size-4" />
                  <span className="font-medium">Coded animation</span>
                  <p className="text-muted-foreground text-xs">Build it from a reusable preset below.</p>
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("revealMode", "VIDEO")}
                  className={`rounded-xl border p-3 text-left ${form.watch("revealMode") === "VIDEO" ? "border-primary bg-primary/5" : ""}`}
                >
                  <Video className="mb-2 size-4" />
                  <span className="font-medium">Video reveal</span>
                  <p className="text-muted-foreground text-xs">Upload a new clip or pick one already used by another theme.</p>
                </button>
              </div>

              {form.watch("revealMode") === "ANIMATION" ? (
                <div className="grid gap-3 rounded-xl bg-muted/40 p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="grid min-w-0 gap-1.5 sm:col-span-1">
                      <Label>Animation style</Label>
                      <select
                        className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
                        value={form.watch("decorAssets.revealAnimation.preset")}
                        onChange={(e) =>
                          form.setValue(
                            "decorAssets.revealAnimation.preset",
                            e.target.value as (typeof REVEAL_ANIMATION_PRESETS)[number],
                          )
                        }
                      >
                        {REVEAL_ANIMATION_PRESETS.map((preset) => (
                          <option key={preset} value={preset}>{ANIMATION_LABELS[preset]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <Label>Intensity</Label>
                      <Input type="number" min="0.5" max="2" step="0.1" {...form.register("decorAssets.revealAnimation.intensity", { valueAsNumber: true })} />
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <Label>Speed</Label>
                      <Input type="number" min="0.5" max="2" step="0.1" {...form.register("decorAssets.revealAnimation.speed", { valueAsNumber: true })} />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    This is the coded-animation creator: choose the effect, then tune its intensity and speed. The saved animation is reused by every invitation using this theme.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <Upload className="size-4" />
                      {assetUploading === "video" ? "Uploading…" : "Upload new video"}
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/*"
                        className="hidden"
                        disabled={assetUploading === "video"}
                        onChange={(e) => handleRevealVideo(e.target.files?.[0])}
                      />
                    </label>
                    {form.watch("revealVideoUrl") && (
                      <a href={form.watch("revealVideoUrl")} target="_blank" rel="noreferrer" className="text-primary self-center text-xs underline">
                        Preview selected video
                      </a>
                    )}
                  </div>

                  {revealVideoLibrary.length > 0 && (
                    <div className="grid gap-1.5">
                      <Label>Choose from uploaded collection</Label>
                      <select
                        className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
                        value={form.watch("revealVideoUrl") ?? ""}
                        onChange={(e) => form.setValue("revealVideoUrl", e.target.value)}
                      >
                        <option value="">Select a reveal video…</option>
                        {revealVideoLibrary.map((item) => (
                          <option key={`${item.label}-${item.url}`} value={item.url}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <Label>Video URL</Label>
                    <Input placeholder="https://…/reveal.mp4" {...form.register("revealVideoUrl")} />
                  </div>
                </div>
              )}
            </section>
          )}

          {type === "WEBSITE" && (
            <div className="grid gap-1.5">
              <Label>Celebration</Label>
              <select
                className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
                value={form.watch("eventCategory")}
                onChange={(e) => form.setValue("eventCategory", e.target.value as ThemeFormValues["eventCategory"])}
              >
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
              <Label>Style</Label>
              <select
                className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm capitalize"
                value={form.watch("category")}
                onChange={(e) => form.setValue("category", e.target.value as ThemeFormValues["category"])}
              >
                {THEME_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="capitalize">{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label>Premium theme</Label>
              <Switch checked={form.watch("isPremium")} onCheckedChange={(v) => form.setValue("isPremium", v)} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Color palette</Label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {(["primary", "secondary", "accent", "background", "foreground"] as const).map((key) => (
                <label key={key} className="flex min-w-0 flex-col items-center gap-1 rounded-xl border p-2">
                  <input
                    type="color"
                    value={form.watch(`colorPalette.${key}`)}
                    onChange={(e) => form.setValue(`colorPalette.${key}`, e.target.value)}
                    className="size-9 cursor-pointer rounded border"
                  />
                  <span className="text-muted-foreground text-[10px] capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Fonts</Label>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
              {(["display", "body", "script"] as const).map((key) => (
                <div key={key} className="grid min-w-0 gap-1.5">
                  <Label className="text-xs capitalize">{key} font</Label>
                  <select
                    className="border-input h-10 w-full min-w-0 rounded-md border bg-background px-2 text-sm"
                    value={form.watch(`fontPairing.${key}`)}
                    onChange={(e) => form.setValue(`fontPairing.${key}`, e.target.value)}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {type === "WEBSITE" && (
            <section className="grid gap-3">
              <div>
                <Label className="text-base">Sections & image-based artwork</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Upload an image for any section when the design is artwork-led. It is shown full-width with that section in invitations using this theme.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {SECTION_TYPES.filter((item) => !sectionOrder.includes(item)).map((item) => (
                  <button key={item} type="button" onClick={() => toggleSection(item)} className="text-muted-foreground rounded-full border px-2.5 py-1 text-xs">
                    + {item}
                  </button>
                ))}
              </div>

              <div className="grid gap-2">
                {sectionOrder.map((sectionType, index) => {
                  const typedSection = sectionType as (typeof SECTION_TYPES)[number];
                  const imageUrl = form.watch(`decorAssets.sectionImages.${typedSection}`);
                  return (
                    <div key={sectionType} className="grid gap-2 rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{sectionType}</span>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => moveSection(index, -1)}>
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => moveSection(index, 1)}>
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => toggleSection(typedSection)}>
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt="" className="h-14 w-10 rounded border object-cover" />
                        )}
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs">
                          <ImageIcon className="size-3.5" />
                          {assetUploading === "image" ? "Uploading…" : imageUrl ? "Replace section image" : "Upload section image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={assetUploading === "image"}
                            onChange={(e) => handleSectionImage(typedSection, e.target.files?.[0])}
                          />
                        </label>
                        {imageUrl && (
                          <button
                            type="button"
                            className="text-destructive text-xs"
                            onClick={() => {
                              const current = { ...(form.getValues("decorAssets.sectionImages") ?? {}) };
                              delete current[typedSection];
                              form.setValue("decorAssets.sectionImages", current);
                            }}
                          >
                            Remove image
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading || Boolean(assetUploading)}>
              {loading ? "Saving…" : theme ? "Save changes" : type === "PDF" ? "Create PDF theme" : "Create theme"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
