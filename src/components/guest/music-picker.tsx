"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Music, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

export type PickerTrack = {
  id: string;
  title: string;
  artist: string | null;
  mood: string | null;
  url: string;
};

export function MusicPicker({
  tracks,
  selectedId,
  onSelect,
  customUrl,
}: {
  tracks: PickerTrack[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  /** An uploaded track wins over the library, so the cards show as inactive. */
  customUrl?: string;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preview audio is scoped to this component, so it must not outlive it —
  // otherwise navigating away from the step leaves music playing.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function togglePlay(track: PickerTrack) {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(track.url);
    audio.addEventListener("ended", () => setPlayingId(null));
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(track.id);
  }

  if (tracks.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
        No tracks in the library yet.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 sm:grid-cols-2",
        customUrl && "pointer-events-none opacity-50",
      )}
    >
      {tracks.map((track) => {
        const selected = !customUrl && selectedId === track.id;
        const playing = playingId === track.id;

        return (
          <div
            key={track.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              selected ? "border-primary bg-primary/5" : "hover:border-primary/50",
            )}
          >
            <button
              type="button"
              onClick={() => togglePlay(track)}
              aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
              className="bg-secondary text-primary focus-visible:ring-primary flex size-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:outline-none"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>

            <button
              type="button"
              onClick={() => onSelect(selected ? undefined : track.id)}
              aria-pressed={selected}
              className="min-w-0 flex-1 text-left focus-visible:underline focus-visible:outline-none"
            >
              <span className="block truncate text-sm font-medium">{track.title}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {[track.artist, track.mood].filter(Boolean).join(" · ") || "Instrumental"}
              </span>
            </button>

            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border",
                selected ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
              aria-hidden
            >
              {selected ? <Check className="size-3.5" /> : <Music className="size-3" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}
