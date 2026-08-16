"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { autoFillPhotosAction } from "@/lib/actions/guest-invitation";
import { REQUIRED_PHOTO_COUNT } from "@/lib/media/constants";
import { compressImageFile } from "@/lib/media/compress-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MediaItem = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
};

export function MediaUploader({
  invitationId,
  initialMedia,
}: {
  invitationId: string;
  initialMedia: MediaItem[];
}) {
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
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
      setMedia((prev) => [data, ...prev]);
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
      setMedia((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    });
  }

  function handleAutoFill() {
    startTransition(async () => {
      const result = await autoFillPhotosAction(invitationId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setMedia(result.data.media.map((m) => ({ id: m.id, url: m.url, width: null, height: null })));
      toast.success(
        result.data.added > 0
          ? `Added ${result.data.added} photo${result.data.added === 1 ? "" : "s"} automatically.`
          : "You already have enough photos.",
      );
    });
  }

  const remaining = Math.max(0, REQUIRED_PHOTO_COUNT - media.length);

  return (
    <div className="flex flex-col gap-4">
      {remaining > 0 && (
        <p className="text-muted-foreground text-sm">
          Publishing requires at least {REQUIRED_PHOTO_COUNT} photos — {remaining} more needed.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload />
          {uploading ? "Uploading…" : "Upload photos"}
        </Button>
        {remaining > 0 && (
          <Button variant="outline" onClick={handleAutoFill} disabled={isPending}>
            <Sparkles />
            Use automatic photos ({remaining} needed)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((item) => (
          <Card key={item.id} className="group relative overflow-hidden p-0">
            <div className="relative aspect-square">
              <Image src={item.url} alt="" fill className="object-cover" unoptimized />
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              disabled={isPending}
              className="bg-background/80 absolute top-2 right-2 rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Delete photo"
            >
              <Trash2 className="text-destructive size-4" />
            </button>
          </Card>
        ))}
      </div>

      {media.length === 0 && (
        <p className="text-muted-foreground text-sm">No photos uploaded yet.</p>
      )}
    </div>
  );
}
