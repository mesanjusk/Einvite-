"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-context";

export function MusicPlayer({ musicUrl, active }: { musicUrl: string | null; active: boolean }) {
  const { t } = useLocale();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (active && musicUrl && !started) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
      setStarted(true);
    }
  }, [active, musicUrl, started]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  if (!musicUrl || !active) return null;

  return (
    <button
      onClick={() => {
        if (audioRef.current) {
          audioRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
        }
      }}
      aria-label={isMuted ? t.unmuteMusic : t.muteMusic}
      className="fixed top-4 right-4 z-[99999] flex size-10 items-center justify-center rounded-full border backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--inv-primary) 85%, transparent)",
        borderColor: "color-mix(in srgb, var(--inv-accent) 50%, transparent)",
        color: "var(--inv-secondary)",
      }}
    >
      {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </button>
  );
}
