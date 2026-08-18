"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateInvitationPdfThemeAction } from "@/lib/actions/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PdfTheme = {
  id: string;
  slug: string;
  name: string;
  colorPalette: { primary: string; accent: string; background: string };
};

export function PdfThemePicker({
  invitationId,
  themes,
  currentSlug,
}: {
  invitationId: string;
  themes: PdfTheme[];
  currentSlug: string | null;
}) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(currentSlug);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      const result = await updateInvitationPdfThemeAction({
        invitationId,
        pdfThemeSlug: selectedSlug,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("PDF theme updated.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setSelectedSlug(null)}
          className={cn(
            "text-muted-foreground rounded-lg border p-3 text-left text-sm",
            selectedSlug === null ? "border-primary ring-primary/30 ring-2" : "",
          )}
        >
          <div className="bg-muted mb-2 h-16 rounded-md" />
          Match website theme
        </button>
        {themes.map((theme) => (
          <button
            key={theme.slug}
            type="button"
            onClick={() => setSelectedSlug(theme.slug)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              selectedSlug === theme.slug ? "border-primary ring-primary/30 ring-2" : "",
            )}
          >
            <div
              className="mb-2 h-16 rounded-md"
              style={{
                background: `linear-gradient(135deg, ${theme.colorPalette.primary}, ${theme.colorPalette.accent})`,
              }}
            />
            <span className="text-sm font-medium">{theme.name}</span>
          </button>
        ))}
      </div>
      <Button onClick={handleSave} disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : "Save PDF theme"}
      </Button>
    </div>
  );
}
