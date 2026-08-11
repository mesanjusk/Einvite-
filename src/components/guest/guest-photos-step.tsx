"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Sparkles, Trash2, Upload } from "lucide-react";

import { autoFillPhotosAction } from "@/lib/actions/guest-invitation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const REQUIRED_PHOTOS = 5;

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

  const remaining = Math.max(0, REQUIRED_PHOTOS - media.length);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invitationId", invitationId);

      const response = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? `Failed to upload ${file.name}`);
        continue;
      }
      onMediaChange([{ id: data.id, url: data.url, isAuto: false }, ...media]);
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
      toast.success(
        result.data.added > 0
          ? `Added ${result.data.added} photo${result.data.added === 1 ? "" : "s"} automatically.`
          : "You already have enough photos.",
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">Add at least {REQUIRED_PHOTOS} photos</p>
        <p className="text-muted-foreground text-xs">
          These appear in your invitation&apos;s gallery. Don&apos;t have photos handy yet? Use
          automatic photos to fill the gap — you can swap them for your own any time.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload />
          {uploading ? "Uploading…" : "Upload photos"}
        </Button>
        {remaining > 0 && (
          <Button type="button" variant="outline" onClick={handleAutoFill} disabled={isPending}>
            <Sparkles />
            Use automatic photos ({remaining} needed)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {media.map((item) => (
          <Card key={item.id} className="group relative overflow-hidden p-0">
            <div className="relative aspect-square">
              <Image src={item.url} alt="" fill className="object-cover" unoptimized />
            </div>
            {item.isAuto && (
              <span className="bg-background/80 absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium">
                Auto
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              disabled={isPending}
              className="bg-background/80 absolute top-2 right-2 rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Delete photo"
            >
              <Trash2 className="text-destructive size-4" />
            </button>
          </Card>
        ))}
        {Array.from({ length: remaining }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className={cn(
              "text-muted-foreground flex aspect-square items-center justify-center rounded-lg border-2 border-dashed text-xs",
            )}
          >
            Photo {media.length + i + 1}
          </div>
        ))}
      </div>

      <p className={cn("text-xs", remaining > 0 ? "text-destructive" : "text-muted-foreground")}>
        {remaining > 0
          ? `${remaining} more photo${remaining === 1 ? "" : "s"} needed to continue.`
          : `${media.length} photos ready.`}
      </p>
    </div>
  );
}
