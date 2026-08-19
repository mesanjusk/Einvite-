"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Image as ImageIcon, Pencil, Plus, Upload } from "lucide-react";

import {
  themeFormSchema,
  SECTION_TYPES,
  THEME_CATEGORIES,
  type ThemeFormInput,
  type ThemeFormValues,
} from "@/lib/validations/admin";
import { upsertThemeAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type ThemeRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  isPremium: boolean;
  sortOrder: number;
  previewImage: string | null;
  revealMode: string;
  revealVideoUrl: string | null;
  colorPalette: { primary: string; secondary: string; accent: string; background: string; foreground: string };
  fontPairing: { display: string; body: string; script: string };
  sectionOrder: string[];
};

type ThemeType = "WEBSITE" | "PDF";

const FONT_OPTIONS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Great Vibes",
  "Inter",
  "EB Garamond",
];

function defaultValues(type: ThemeType, theme?: ThemeRecord): ThemeFormValues {
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
    sectionOrder: (theme?.sectionOrder as ThemeFormValues["sectionOrder"]) ?? [
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
}: {
  theme?: ThemeRecord;
  type?: ThemeType;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const form = useForm<ThemeFormValues, unknown, ThemeFormInput>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: defaultValues(type, theme),
  });

  const sectionOrder = form.watch("sectionOrder");

  function toggleSection(type: (typeof SECTION_TYPES)[number]) {
    const current = form.getValues("sectionOrder");
    if (current.includes(type)) {
      form.setValue(
        "sectionOrder",
        current.filter((s) => s !== type),
      );
    } else {
      form.setValue("sectionOrder", [...current, type]);
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const current = [...form.getValues("sectionOrder")];
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    form.setValue("sectionOrder", current);
  }

  async function handleThumbnailUpload(file: File | undefined) {
    if (!file) return;
    setThumbUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/pdf-templates/upload", {
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

  async function onSubmit(values: ThemeFormInput) {
    setLoading(true);
    const result = await upsertThemeAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(theme ? "Theme updated." : "Theme created.");
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {theme ? `Edit ${theme.name}` : type === "PDF" ? "New PDF theme" : "New theme"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="grid gap-1.5">
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
                <img
                  src={form.watch("previewImage")}
                  alt=""
                  className="size-16 shrink-0 rounded-md border object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-md border border-dashed">
                  <ImageIcon className="size-5" />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleThumbnailUpload(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={thumbUploading}
                  onClick={() => thumbInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  {thumbUploading ? "Uploading…" : "Upload"}
                </Button>
                {form.watch("previewImage") && (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive text-xs"
                    onClick={() => form.setValue("previewImage", "")}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {type === "WEBSITE" && (
            <div className="grid gap-1.5">
              <Label>Envelope reveal</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => form.setValue("revealMode", "ANIMATION")}
                  className={`rounded-md border px-3 py-2 text-left text-sm ${form.watch("revealMode") === "ANIMATION" ? "border-primary bg-primary/5" : ""}`}
                >
                  <span className="font-medium">Coded animation</span>
                  <p className="text-muted-foreground text-xs">Instant, no video file needed.</p>
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("revealMode", "VIDEO")}
                  className={`rounded-md border px-3 py-2 text-left text-sm ${form.watch("revealMode") === "VIDEO" ? "border-primary bg-primary/5" : ""}`}
                >
                  <span className="font-medium">Video clip</span>
                  <p className="text-muted-foreground text-xs">Cinematic — falls back to the animation if not preloaded in time.</p>
                </button>
              </div>
              {form.watch("revealMode") === "VIDEO" && (
                <div className="mt-2">
                  <Input
                    placeholder="https://…/envelope-open.mp4"
                    {...form.register("revealVideoUrl")}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    Short (3–5s), muted, ideally under a few MB — h264 mp4 for the widest browser
                    support.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <select
                className="border-input h-9 rounded-md border bg-transparent px-2 text-sm capitalize"
                value={form.watch("category")}
                onChange={(e) =>
                  form.setValue("category", e.target.value as ThemeFormValues["category"])
                }
              >
                {THEME_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="capitalize">
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Premium theme</Label>
              <Switch
                checked={form.watch("isPremium")}
                onCheckedChange={(v) => form.setValue("isPremium", v)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Color palette</Label>
            <div className="grid grid-cols-5 gap-2">
              {(["primary", "secondary", "accent", "background", "foreground"] as const).map(
                (key) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <input
                      type="color"
                      value={form.watch(`colorPalette.${key}`)}
                      onChange={(e) => form.setValue(`colorPalette.${key}`, e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded border"
                    />
                    <span className="text-muted-foreground text-[10px] capitalize">{key}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(["display", "body", "script"] as const).map((key) => (
              <div key={key} className="grid gap-1.5">
                <Label className="text-xs capitalize">{key} font</Label>
                <select
                  className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
                  value={form.watch(`fontPairing.${key}`)}
                  onChange={(e) => form.setValue(`fontPairing.${key}`, e.target.value)}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <Label className="mb-2 block">Sections (default layout)</Label>
            <div className="mb-3 flex flex-wrap gap-2">
              {SECTION_TYPES.filter((type) => !sectionOrder.includes(type)).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleSection(type)}
                  className="text-muted-foreground rounded-full border px-2 py-1 text-xs"
                >
                  + {type}
                </button>
              ))}
            </div>
            <div className="grid gap-1.5">
              {sectionOrder.map((type, index) => (
                <div
                  key={type}
                  className="bg-muted flex items-center justify-between rounded-md px-3 py-1.5 text-sm"
                >
                  <span>{type}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => moveSection(index, -1)}
                    >
                      <ArrowUp className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => moveSection(index, 1)}
                    >
                      <ArrowDown className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => toggleSection(type)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {form.formState.errors.sectionOrder && (
              <p className="text-destructive mt-1 text-xs">
                {form.formState.errors.sectionOrder.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : theme ? "Save changes" : type === "PDF" ? "Create PDF theme" : "Create theme"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
