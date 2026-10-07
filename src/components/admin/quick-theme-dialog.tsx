"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { upsertThemeAction } from "@/lib/actions/admin";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { THEME_CATEGORIES, type ThemeFormInput } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_SECTIONS = [
  "ENVELOPE",
  "HERO",
  "COUNTDOWN",
  "TIMELINE",
  "GALLERY",
  "VENUE",
  "RSVP",
  "THANK_YOU",
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

export function QuickThemeDialog() {
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [eventCategory, setEventCategory] = useState<ThemeFormInput["eventCategory"]>("wedding");
  const [category, setCategory] = useState<(typeof THEME_CATEGORIES)[number]>("classic");
  const [previewImage, setPreviewImage] = useState("");
  const [primary, setPrimary] = useState("#7a2e2e");
  const [accent, setAccent] = useState("#c9942a");
  const [background, setBackground] = useState("#faf3ea");
  const [isPremium, setIsPremium] = useState(false);

  const canSave = useMemo(() => name.trim().length >= 2 && !saving, [name, saving]);

  async function uploadThumbnail(file?: File) {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/pdf-templates/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Could not upload image.");
      return;
    }
    setPreviewImage(data.url);
  }

  async function createTheme() {
    if (!canSave) return;
    setSaving(true);

    const baseSlug = slugify(name) || "theme";
    const result = await upsertThemeAction({
      type: "WEBSITE",
      name: name.trim(),
      slug: `${baseSlug}-${Date.now().toString(36).slice(-4)}`,
      description: "",
      previewImage,
      revealMode: "ANIMATION",
      revealVideoUrl: "",
      category,
      eventCategory,
      eventCategories: [eventCategory],
      isPremium,
      sortOrder: 0,
      colorPalette: {
        primary,
        secondary: background,
        accent,
        background,
        foreground: "#2f221e",
      },
      fontPairing: {
        display: "Playfair Display",
        body: "Cormorant Garamond",
        script: "Great Vibes",
      },
      sectionOrder: [...DEFAULT_SECTIONS],
    });

    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Theme created. You can fine-tune it anytime.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create theme
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a fresh theme</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="font-medium">Only the essentials</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Name it, choose the celebration and colors. Layout, fonts and sections are added automatically.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Theme name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Royal Lotus"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Celebration</Label>
              <select
                className="border-input h-10 rounded-md border bg-background px-3 text-sm"
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value as ThemeFormInput["eventCategory"])}
              >
                {EVENT_CATEGORIES.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Style</Label>
              <select
                className="border-input h-10 rounded-md border bg-background px-3 text-sm capitalize"
                value={category}
                onChange={(e) => setCategory(e.target.value as (typeof THEME_CATEGORIES)[number])}
              >
                {THEME_CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Preview image <span className="text-muted-foreground">(optional)</span></Label>
            <div className="flex items-center gap-3">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImage} alt="" className="size-16 rounded-xl border object-cover" />
              ) : (
                <div className="text-muted-foreground grid size-16 place-items-center rounded-xl border border-dashed">
                  <ImageIcon className="size-5" />
                </div>
              )}
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadThumbnail(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => uploadRef.current?.click()} disabled={uploading}>
                <Upload className="size-4" />
                {uploading ? "Uploading…" : previewImage ? "Replace" : "Upload"}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Colors</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Main", primary, setPrimary],
                ["Accent", accent, setAccent],
                ["Background", background, setBackground],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="flex items-center gap-2 rounded-xl border p-2 text-xs font-medium">
                  <input
                    type="color"
                    value={value as string}
                    onChange={(e) => (setter as (value: string) => void)(e.target.value)}
                    className="size-8 cursor-pointer rounded border-0 bg-transparent"
                  />
                  {label as string}
                </label>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">Premium theme</p>
              <p className="text-muted-foreground text-xs">Show it as a premium design.</p>
            </div>
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="size-4"
            />
          </label>
        </div>

        <DialogFooter>
          <Button onClick={createTheme} disabled={!canSave}>
            {saving ? "Creating…" : "Create theme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
