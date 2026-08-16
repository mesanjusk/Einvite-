"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type VideoItem = { id: string; url: string };

const MAX_VIDEOS = 5;

export function VideoUploader({
  invitationId,
  initialVideos,
}: {
  invitationId: string;
  initialVideos: VideoItem[];
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invitationId", invitationId);

      const response = await fetch("/api/media/upload-video", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? `Failed to upload ${file.name}`);
        continue;
      }
      setVideos((prev) => [data, ...prev]);
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
      setVideos((prev) => prev.filter((v) => v.id !== id));
      router.refresh();
    });
  }

  const remaining = Math.max(0, MAX_VIDEOS - videos.length);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Short clips appear in your invitation&apos;s photo gallery alongside your photos —
        up to {MAX_VIDEOS}, 40MB each.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading || remaining === 0}>
          <Upload />
          {uploading ? "Uploading…" : "Upload video"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {videos.map((item) => (
          <Card key={item.id} className="group relative overflow-hidden p-0">
            <div className="relative aspect-square bg-black">
              <video src={item.url} muted loop playsInline className="size-full object-cover" />
              <VideoIcon className="absolute top-2 left-2 size-4 text-white drop-shadow" />
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              disabled={isPending}
              className="bg-background/80 absolute top-2 right-2 rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Delete video"
            >
              <Trash2 className="text-destructive size-4" />
            </button>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <p className="text-muted-foreground text-sm">No videos uploaded yet.</p>
      )}
    </div>
  );
}
