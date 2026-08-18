"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Upload, ChevronLeft, ChevronRight } from "lucide-react";

import { upsertPdfTemplatePagesAction } from "@/lib/actions/admin";
import {
  PDF_PAGE_SIZES,
  PDF_PLACEHOLDER_FIELDS,
  newPdfPage,
  newPdfPlaceholder,
  type PdfPlaceholder,
  type PdfTemplatePage,
} from "@/lib/validations/pdf-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FIELD_LABELS: Record<(typeof PDF_PLACEHOLDER_FIELDS)[number], string> = {
  brideName: "Bride name",
  groomName: "Groom name",
  coupleNames: "Bride & groom",
  weddingDate: "Wedding date",
  venueName: "Venue name",
  venueAddress: "Venue address",
  customMessage: "Custom message",
  pdfExtraText: "Extra PDF text (couple-written)",
  STATIC: "Fixed text (you write it)",
};

const CANVAS_WIDTH = 480;

export function PdfTemplateEditor({
  themeId,
  initialPages,
}: {
  themeId: string;
  initialPages: PdfTemplatePage[];
}) {
  const [pages, setPages] = useState<PdfTemplatePage[]>(
    initialPages.length > 0 ? initialPages : [newPdfPage()],
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; mode: "move" | "resize" } | null>(null);
  const router = useRouter();

  const page = pages[pageIndex];
  const { width: pageW, height: pageH } = PDF_PAGE_SIZES[page.size];
  const canvasHeight = (CANVAS_WIDTH * pageH) / pageW;
  const selected = useMemo(
    () => page.placeholders.find((p) => p.id === selectedId) ?? null,
    [page, selectedId],
  );

  function updatePage(updater: (p: PdfTemplatePage) => PdfTemplatePage) {
    setPages((prev) => prev.map((p, i) => (i === pageIndex ? updater(p) : p)));
  }

  function updatePlaceholder(id: string, updater: (p: PdfPlaceholder) => PdfPlaceholder) {
    updatePage((p) => ({
      ...p,
      placeholders: p.placeholders.map((ph) => (ph.id === id ? updater(ph) : ph)),
    }));
  }

  function addPage() {
    setPages((prev) => [...prev, newPdfPage()]);
    setPageIndex(pages.length);
    setSelectedId(null);
  }

  function removePage() {
    if (pages.length <= 1) return;
    if (!confirm("Delete this page?")) return;
    setPages((prev) => prev.filter((_, i) => i !== pageIndex));
    setPageIndex((i) => Math.max(0, i - 1));
    setSelectedId(null);
  }

  function addPlaceholder() {
    const ph = newPdfPlaceholder();
    updatePage((p) => ({ ...p, placeholders: [...p.placeholders, ph] }));
    setSelectedId(ph.id);
  }

  function removeSelected() {
    if (!selectedId) return;
    updatePage((p) => ({ ...p, placeholders: p.placeholders.filter((ph) => ph.id !== selectedId) }));
    setSelectedId(null);
  }

  async function handleBackgroundUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/pdf-templates/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Upload failed.");
        return;
      }
      updatePage((p) => ({ ...p, backgroundImageUrl: json.url }));
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handlePointerDown(e: React.PointerEvent, id: string, mode: "move" | "resize") {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { id, mode };
    setSelectedId(id);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragState.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    updatePlaceholder(drag.id, (ph) => {
      if (drag.mode === "move") {
        return {
          ...ph,
          x: Math.min(100 - ph.width, Math.max(0, xPct)),
          y: Math.max(0, Math.min(98, yPct)),
        };
      }
      return { ...ph, width: Math.max(5, Math.min(100 - ph.x, xPct - ph.x)) };
    });
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertPdfTemplatePagesAction({ themeId, pages });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("PDF layout saved.");
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((i) => i - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {pageIndex + 1} of {pages.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={pageIndex === pages.length - 1}
              onClick={() => setPageIndex((i) => i + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addPage}>
              <Plus className="size-4" />
              Add page
            </Button>
            <Button variant="outline" size="sm" onClick={removePage} disabled={pages.length <= 1}>
              <Trash2 className="size-4" />
              Remove page
            </Button>
          </div>
        </div>

        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => setSelectedId(null)}
          className="relative mx-auto overflow-hidden rounded-md border shadow-sm select-none"
          style={{
            width: CANVAS_WIDTH,
            height: canvasHeight,
            backgroundColor: page.backgroundColor,
            backgroundImage: page.backgroundImageUrl ? `url(${page.backgroundImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {page.placeholders.map((ph) => (
            <div
              key={ph.id}
              onPointerDown={(e) => handlePointerDown(e, ph.id, "move")}
              className={cn(
                "absolute cursor-move border px-1 py-0.5",
                selectedId === ph.id ? "border-primary border-2" : "border-dashed border-black/30",
              )}
              style={{
                left: `${ph.x}%`,
                top: `${ph.y}%`,
                width: `${ph.width}%`,
                fontSize: Math.max(8, (ph.fontSize / pageW) * CANVAS_WIDTH),
                color: ph.color,
                textAlign: ph.align,
                fontWeight: ph.bold ? "bold" : "normal",
              }}
            >
              {ph.field === "STATIC" ? ph.staticText || "Text" : FIELD_LABELS[ph.field]}
              <div
                onPointerDown={(e) => handlePointerDown(e, ph.id, "resize")}
                className="bg-primary absolute top-0 -right-1 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={uploading} asChild>
            <label className="cursor-pointer">
              <Upload className="size-4" />
              {uploading ? "Uploading…" : "Background image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleBackgroundUpload(e.target.files?.[0])}
              />
            </label>
          </Button>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Background color</Label>
            <input
              type="color"
              value={page.backgroundColor}
              onChange={(e) => updatePage((p) => ({ ...p, backgroundColor: e.target.value }))}
              className="h-8 w-8 cursor-pointer rounded border"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Page size</Label>
            <select
              className="border-input h-8 rounded-md border bg-transparent px-2 text-sm"
              value={page.size}
              onChange={(e) => updatePage((p) => ({ ...p, size: e.target.value as PdfTemplatePage["size"] }))}
            >
              <option value="A4">A4</option>
              <option value="LETTER">Letter</option>
            </select>
          </div>
          <Button size="sm" onClick={addPlaceholder}>
            <Plus className="size-4" />
            Add text
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            {selected ? (
              <>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Bound to</Label>
                  <select
                    className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
                    value={selected.field}
                    onChange={(e) =>
                      updatePlaceholder(selected.id, (ph) => ({
                        ...ph,
                        field: e.target.value as PdfPlaceholder["field"],
                      }))
                    }
                  >
                    {PDF_PLACEHOLDER_FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {FIELD_LABELS[field]}
                      </option>
                    ))}
                  </select>
                </div>

                {selected.field === "STATIC" && (
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Text</Label>
                    <Textarea
                      rows={2}
                      value={selected.staticText ?? ""}
                      onChange={(e) =>
                        updatePlaceholder(selected.id, (ph) => ({ ...ph, staticText: e.target.value }))
                      }
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Font size</Label>
                    <Input
                      type="number"
                      min={4}
                      max={200}
                      value={selected.fontSize}
                      onChange={(e) =>
                        updatePlaceholder(selected.id, (ph) => ({
                          ...ph,
                          fontSize: Number(e.target.value) || ph.fontSize,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Color</Label>
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) =>
                        updatePlaceholder(selected.id, (ph) => ({ ...ph, color: e.target.value }))
                      }
                      className="h-9 w-full cursor-pointer rounded border"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Align</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => updatePlaceholder(selected.id, (ph) => ({ ...ph, align }))}
                        className={cn(
                          "rounded-md border py-1.5 text-xs capitalize",
                          selected.align === align ? "border-primary bg-primary/5" : "",
                        )}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Bold</Label>
                  <input
                    type="checkbox"
                    checked={selected.bold}
                    onChange={(e) =>
                      updatePlaceholder(selected.id, (ph) => ({ ...ph, bold: e.target.checked }))
                    }
                  />
                </div>

                <Button variant="ghost" size="sm" onClick={removeSelected} className="text-destructive">
                  <Trash2 className="size-4" />
                  Delete this text box
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Click a text box on the page to edit it, or add one.
              </p>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save PDF layout"}
        </Button>
      </div>
    </div>
  );
}
