"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";

import { compressImageFile } from "@/lib/media/compress-image";
import { MAX_PHOTO_COUNT } from "@/lib/media/constants";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { InviteMedia } from "../types";

type Slot = "gallery" | "bride" | "groom";

/**
 * The photo sheet, opened by tapping a photo on the invitation itself.
 *
 * Every photo on the invitation is here, in the order it appears, and each
 * one has the two things anyone actually wants from it: swap this one, or
 * take it off. Nothing is a "photo step" to be completed — the invitation
 * behind the sheet already shows what these photos look like.
 */
export function PhotosSheet({
  open,
  onOpenChange,
  invitationId,
  media,
  focusMediaId,
  coverPhoto,
  onReplace,
  onRemove,
  onAdd,
  onCoverChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  media: InviteMedia[];
  /** The photo tapped on the invitation — scrolled to when the sheet opens. */
  focusMediaId?: string;
  coverPhoto: string | null;
  onReplace: (mediaId: string, next: InviteMedia) => void;
  onRemove: (mediaId: string) => void;
  onAdd: (next: InviteMedia) => void;
  onCoverChange: (url: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Which photo the next file picked replaces — null means "add a new one",
  // "cover" means the portrait at the top of the pile.
  const targetRef = useRef<{ mediaId: string | null; slot: Slot }>({
    mediaId: null,
    slot: "gallery",
  });
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !focusMediaId) return;
    const node = listRef.current?.querySelector(`[data-media-id="${focusMediaId}"]`);
    node?.scrollIntoView({ block: "center" });
  }, [open, focusMediaId]);

  async function upload(file: File, slot: Slot) {
    const compressed = await compressImageFile(file);
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("invitationId", invitationId);
    formData.append("slot", slot);

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(data.error ?? "That photo didn't upload. Try another one.");
      return null;
    }
    return data as { id?: string; url: string };
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const { mediaId, slot } = targetRef.current;

    setBusyId(mediaId ?? slot);
    try {
      const uploaded = await upload(file, slot);
      if (!uploaded) return;

      if (slot !== "gallery") {
        onCoverChange(uploaded.url);
        return;
      }
      const next: InviteMedia = { id: uploaded.id!, url: uploaded.url, caption: null };

      if (mediaId) {
        // The old photo goes only once the new one is safely up, so a failed
        // upload never costs someone a photo they can't get back.
        await fetch(`/api/media/${mediaId}`, { method: "DELETE" }).catch(() => {});
        onReplace(mediaId, next);
      } else {
        onAdd(next);
      }
    } finally {
      setBusyId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function pick(mediaId: string | null, slot: Slot = "gallery") {
    targetRef.current = { mediaId, slot };
    fileInputRef.current?.click();
  }

  async function handleRemove(mediaId: string) {
    setBusyId(mediaId);
    const response = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
    setBusyId(null);
    if (!response.ok) {
      toast.error("Couldn't remove that photo.");
      return;
    }
    onRemove(mediaId);
  }

  const slotsLeft = Math.max(0, MAX_PHOTO_COUNT - media.length);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Photos</SheetTitle>
          <SheetDescription>
            Tap a photo to swap it for one of your own. {media.length} of{" "}
            {MAX_PHOTO_COUNT} used.
          </SheetDescription>
        </SheetHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div ref={listRef} className="grid grid-cols-3 gap-3 px-4 pb-4">
          {/* The portrait at the top of the pile. `cover` is the id the
              gallery gives it, so tapping it on the invitation lands here. */}
          <div data-media-id="cover">
            <PhotoTile
              label="Cover"
              url={coverPhoto}
              busy={busyId === "bride"}
              onPick={() => pick(null, "bride")}
            />
          </div>

          {media.map((item) => (
            <div
              key={item.id}
              data-media-id={item.id}
              className="flex flex-col gap-1.5"
            >
              <button
                type="button"
                onClick={() => pick(item.id)}
                disabled={busyId === item.id}
                className="relative aspect-square overflow-hidden rounded-lg border"
              >
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="33vw"
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-1 text-[10px] text-white">
                  <RefreshCw className="size-3" />
                  {busyId === item.id ? "Working…" : "Replace"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={busyId === item.id}
                className="text-muted-foreground hover:text-destructive flex items-center justify-center gap-1 text-[11px]"
              >
                <Trash2 className="size-3" />
                Remove
              </button>
            </div>
          ))}

          {slotsLeft > 0 && (
            <button
              type="button"
              onClick={() => pick(null)}
              disabled={busyId === "gallery"}
              className="text-muted-foreground hover:border-primary hover:text-primary flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-[11px]"
            >
              <ImagePlus className="size-5" />
              {busyId === "gallery" ? "Uploading…" : "Add photo"}
            </button>
          )}
        </div>

        <div className="px-4 pb-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PhotoTile({
  label,
  url,
  busy,
  onPick,
}: {
  label: string;
  url: string | null;
  busy: boolean;
  onPick: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        className="text-muted-foreground hover:border-primary relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed"
      >
        {url ? (
          <Image
            src={url}
            alt=""
            fill
            sizes="33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <ImagePlus className="size-5" />
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[10px] text-white">
          {busy ? "Working…" : label}
        </span>
      </button>
    </div>
  );
}
