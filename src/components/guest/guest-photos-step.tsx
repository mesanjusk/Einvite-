"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Sparkles, Trash2, Upload } from "lucide-react";

import { autoFillPhotosAction } from "@/lib/actions/guest-invitation";
import { MAX_PHOTO_COUNT } from "@/lib/media/constants";
import { compressImageFile } from "@/lib/media/compress-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export { MAX_PHOTO_COUNT };

export type GuestMediaItem = { id: string; url: string; isAuto: boolean };

export function GuestPhotosStep({
  invitationId,
  media,
  onMediaChange,
}: {
  invitationId: string;
  media: GuestMediaItem[];
  onMediaChange: (media: GuestMediaItem[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const slotsLeft = Math.max(0, MAX_PHOTO_COUNT - media.length);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    // Trim to the free slots rather than uploading and then rejecting — the
    // cap is the reason galleries stopped running to a dozen photos.
    const selected = Array.from(files);
    const accepted = selected.slice(0, slotsLeft);
    if (accepted.length < selected.length) {
      toast.error(
        `Only ${MAX_PHOTO_COUNT} photos allowed — using the first ${accepted.length}.`,
      );
    }
    if (accepted.length === 0) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    let next = media;

    for (const file of accepted) {
      const compressed = await compressImageFile(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("invitationId", invitationId);

      const response = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? `Failed to upload ${file.name}`);
        continue;
      }
      next = [{ id: data.id, url: data.url, isAuto: false }, ...next];
      onMediaChange(next);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete");
        return;
      }
      onMediaChange(media.filter((m) => m.id !== id));
    });
  }

  function handleAutoFill() {
    startTransition(async () => {
      const result = await autoFillPhotosAction(invitationId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onMediaChange(result.data.media);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || slotsLeft === 0}
        >
          <Upload />
          {uploading ? "Uploading…" : "Upload photos"}
        </Button>
        {slotsLeft > 0 && (
          <Button type="button" variant="outline" onClick={handleAutoFill} disabled={isPending}>
            <Sparkles />
            Use ready-made photos
          </Button>
        )}
        <span className="text-muted-foreground text-xs">
          {media.length} of {MAX_PHOTO_COUNT}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {media.map((item) => (
          <Card key={item.id} className="group relative overflow-hidden p-0">
            <div className="relative aspect-square">
              <Image
                src={item.url}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 20vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                aria-label="Remove photo"
                className={cn(
                  "absolute top-1.5 right-1.5 rounded-full bg-black/55 p-1.5 text-white opacity-0 transition-opacity",
                  "group-hover:opacity-100 focus-visible:opacity-100",
                )}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
