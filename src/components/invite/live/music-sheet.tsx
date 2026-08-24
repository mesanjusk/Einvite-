"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, VolumeX } from "lucide-react";

import { MusicPicker } from "@/components/guest/music-picker";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EditorTrack } from "./types";

/**
 * The music sheet, opened from the speaker button on the invitation.
 * A track from the library, a clip of their own, or silence — whichever is
 * chosen starts playing on the invitation behind the sheet.
 */
export function MusicSheet({
  open,
  onOpenChange,
  invitationId,
  tracks,
  selectedTrackId,
  customMusicUrl,
  onSelectTrack,
  onCustomUrl,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  tracks: EditorTrack[];
  selectedTrackId: string | null;
  customMusicUrl: string | null;
  onSelectTrack: (trackId: string) => void;
  onCustomUrl: (url: string) => void;
  onClear: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("invitationId", invitationId);

    const response = await fetch("/api/media/upload-audio", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!response.ok) {
      toast.error(data.error ?? "That audio didn't upload.");
      return;
    }
    onCustomUrl(data.url as string);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Music</SheetTitle>
          <SheetDescription>
            Plays when your guests open the invitation. Tap ▶ to hear one first.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <MusicPicker
            tracks={tracks}
            selectedId={selectedTrackId ?? undefined}
            onSelect={(id) => {
              if (id) onSelectTrack(id);
              else onClear();
            }}
            customUrl={customMusicUrl ?? undefined}
          />

          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          <div className="flex flex-col gap-2">
            {customMusicUrl && (
              <p className="text-muted-foreground text-xs">
                Your own clip is playing — remove it to go back to the library.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload />
                {uploading ? "Uploading…" : "Upload my own song"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={onClear}
              >
                <VolumeX />
                No music
              </Button>
            </div>
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
