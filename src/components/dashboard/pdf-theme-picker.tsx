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
  description: string | null;
  colorPalette: { primary: string; accent: string; background: string };
};

export function PdfThemePicker({
  invitationId,
  themes,
  currentSlug,
  /** Set once the invitation is published — previews render the live data. */
  previewSlug,
  websiteThemeName,
}: {
  invitationId: string;
  themes: PdfTheme[];
  currentSlug: string | null;
  previewSlug?: string | null;
  websiteThemeName?: string | null;
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

  // Every option can be downloaded before it's saved: `?design=` renders the
  // same invitation in that design without changing anything.
  function previewHref(slug: string | null) {
    if (!previewSlug) return null;
    return slug ? `/api/pdf/${previewSlug}?design=${slug}` : `/api/pdf/${previewSlug}`;
  }

  const options: {
    slug: string | null;
    name: string;
    description: string;
    swatch: string | null;
  }[] = [
    {
      slug: null,
      name: "Match website theme",
      description: websiteThemeName
        ? `Prints in the ${websiteThemeName} palette, with your photos.`
        : "Prints in your invitation's own colours, with your photos.",
      swatch: null,
    },
    ...themes.map((theme) => ({
      slug: theme.slug,
      name: theme.name,
      description: theme.description ?? "",
      swatch: `linear-gradient(135deg, ${theme.colorPalette.primary}, ${theme.colorPalette.accent})`,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const href = previewHref(option.slug);
          return (
            <div
              key={option.slug ?? "website"}
              className={cn(
                "flex flex-col rounded-lg border p-3 transition-colors",
                selectedSlug === option.slug
                  ? "border-primary ring-primary/30 ring-2"
                  : "",
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedSlug(option.slug)}
                aria-pressed={selectedSlug === option.slug}
                className="text-left"
              >
                <div
                  className={cn(
                    "mb-2 h-16 rounded-md",
                    option.swatch ? "" : "bg-muted",
                  )}
                  style={option.swatch ? { background: option.swatch } : undefined}
                />
                <span className="text-sm font-medium">{option.name}</span>
                {option.description && (
                  <span className="text-muted-foreground mt-1 block text-xs">
                    {option.description}
                  </span>
                )}
              </button>
              {href && (
                <a
                  href={href}
                  className="text-primary mt-2 text-xs underline underline-offset-4"
                >
                  Preview PDF
                </a>
              )}
            </div>
          );
        })}
      </div>
      <Button onClick={handleSave} disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : "Save PDF theme"}
      </Button>
    </div>
  );
}
