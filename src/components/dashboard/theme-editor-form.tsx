"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateInvitationThemeAction } from "@/lib/actions/theme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Theme = {
  id: string;
  slug: string;
  name: string;
  colorPalette: { primary: string; accent: string; background: string };
};

type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
};

export function ThemeEditorForm({
  invitationId,
  themes,
  currentThemeSlug,
  currentPalette,
}: {
  invitationId: string;
  themes: Theme[];
  currentThemeSlug: string;
  currentPalette: Palette;
}) {
  const [selectedSlug, setSelectedSlug] = useState(currentThemeSlug);
  const [palette, setPalette] = useState(currentPalette);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      const result = await updateInvitationThemeAction({
        invitationId,
        themeSlug: selectedSlug,
        colorPalette: palette,
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
    <div className="flex flex-col gap-8">
      <div>
        <Label className="mb-3 block">Base theme</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {themes.map((theme) => (
            <button
              key={theme.slug}
              onClick={() => {
                setSelectedSlug(theme.slug);
                setPalette((p) => ({
                  ...p,
                  primary: theme.colorPalette.primary,
                  accent: theme.colorPalette.accent,
                  background: theme.colorPalette.background,
                }));
              }}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                selectedSlug === theme.slug ? "border-primary ring-primary/30 ring-2" : "",
              )}
            >
              <div
                className="mb-2 h-12 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${theme.colorPalette.primary}, ${theme.colorPalette.accent})`,
                }}
              />
              <span className="text-sm font-medium">{theme.name}</span>
            </button>
          ))}
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

      <Card>
        <CardContent
          className="rounded-lg p-8 text-center"
          style={{ background: palette.background, color: palette.foreground }}
        >
          <p className="mb-2 text-xs tracking-[0.3em] uppercase" style={{ color: palette.accent }}>
            Live Preview
          </p>
          <p className="font-display text-3xl" style={{ color: palette.primary }}>
            Bride &amp; Groom
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : "Save theme"}
      </Button>
    </div>
  );
}
