"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Palette, Pencil } from "lucide-react";

import {
  themeColorwayFormSchema,
  type ThemeColorwayFormInput,
  type ThemeColorwayFormValues,
} from "@/lib/validations/admin";
import { upsertThemeColorwayAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type ColorwayRecord = {
  id: string;
  name: string;
  slug: string;
  colorPalette: Palette;
  sortOrder: number;
};

const PALETTE_KEYS: (keyof Palette)[] = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
];

export function ThemeColorwayDialog({
  themeId,
  themeName,
  colorway,
  fallbackPalette,
}: {
  themeId: string;
  themeName: string;
  colorway?: ColorwayRecord;
  /** Starting point for a new colourway — the theme's own palette. */
  fallbackPalette: Palette;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ThemeColorwayFormValues, unknown, ThemeColorwayFormInput>({
    resolver: zodResolver(themeColorwayFormSchema),
    defaultValues: {
      id: colorway?.id,
      themeId,
      name: colorway?.name ?? "",
      slug: colorway?.slug ?? "",
      colorPalette: colorway?.colorPalette ?? fallbackPalette,
      sortOrder: colorway?.sortOrder ?? 0,
    },
  });

  async function onSubmit(values: ThemeColorwayFormInput) {
    setLoading(true);
    const result = await upsertThemeColorwayAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(colorway ? "Colour updated." : "Colour added.");
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
          <IconButton label={`Add a colour to ${themeName}`} variant="outline">
            <Palette className="size-4" />
          </IconButton>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {colorway ? `Edit ${colorway.name}` : `New colour for ${themeName}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input placeholder="Emerald & Gold" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Slug</Label>
              <Input placeholder="emerald-gold" {...form.register("slug")} />
              {form.formState.errors.slug && (
                <p className="text-destructive text-xs">{form.formState.errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Palette</Label>
            {PALETTE_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={key}
                  className="size-9 shrink-0 cursor-pointer rounded border bg-transparent"
                  value={form.watch(`colorPalette.${key}`)}
                  onChange={(e) => form.setValue(`colorPalette.${key}`, e.target.value)}
                />
                <span className="text-muted-foreground w-24 text-xs capitalize">{key}</span>
                <Input
                  className="font-mono text-xs"
                  value={form.watch(`colorPalette.${key}`)}
                  onChange={(e) => form.setValue(`colorPalette.${key}`, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-1.5">
            <Label>Sort order</Label>
            <Input type="number" {...form.register("sortOrder", { valueAsNumber: true })} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : colorway ? "Save changes" : "Add colour"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
