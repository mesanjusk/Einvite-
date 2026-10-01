"use client";

import { useRef, useState } from "react";
import { Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type IntroVideoValue = {
  mp4Url: string | null;
  webmUrl: string | null;
  posterUrl: string | null;
};

export function IntroVideoUploader({
  invitationId,
  value,
  onChange,
}: {
  invitationId: string;
  value: IntroVideoValue;
  onChange: (value: IntroVideoValue) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Intro video must be 20MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invitationId", invitationId);
      const response = await fetch("/api/media/upload-intro-video", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to optimize intro video.");
        return;
      }

      onChange({
        mp4Url: data.introVideoMp4Url ?? null,
        webmUrl: data.introVideoWebmUrl ?? null,
        posterUrl: data.introVideoPosterUrl ?? null,
      });
      toast.success("Intro video optimized for fast loading.");
    } catch {
      toast.error("Intro video upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const response = await fetch(
        "/api/media/upload-intro-video?invitationId=" + encodeURIComponent(invitationId),
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error ?? "Failed to remove intro video.");
        return;
      }
      onChange({ mp4Url: null, webmUrl: null, posterUrl: null });
      toast.success("Intro video removed.");
    } finally {
      setBusy(false);
    }
  }

  const previewUrl = value.webmUrl ?? value.mp4Url;

  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
          <Video className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Tap-to-start intro</p>
          <p className="text-muted-foreground mt-1 text-xs">
            MP4, MOV or WebM · up to 20MB. We trim to 5 seconds, resize to
            540×960, remove audio and create fast MP4/WebM versions.
          </p>
        </div>
      </div>

      {previewUrl && (
        <video
          className="mt-3 aspect-[9/16] max-h-56 w-full rounded-lg bg-black object-cover"
          muted
          playsInline
          controls
          poster={value.posterUrl ?? undefined}
        >
          {value.webmUrl && <source src={value.webmUrl} type="video/webm" />}
          {value.mp4Url && <source src={value.mp4Url} type="video/mp4" />}
        </video>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(event) => void upload(event.target.files?.[0])}
      />

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {busy ? "Processing…" : previewUrl ? "Replace" : "Upload intro"}
        </Button>
        {previewUrl && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void remove()}
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
