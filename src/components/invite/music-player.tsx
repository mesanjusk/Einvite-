"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-context";

export function MusicPlayer({ musicUrl, active }: { musicUrl: string | null; active: boolean }) {
  const { t } = useLocale();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [started, setStarted] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (active && musicUrl && !started) {
      const audio = new Audio(musicUrl);
      audio.loop = true;
      audio.volume = 0.3;
      audio.addEventListener("error", () => setBroken(true));
      // Autoplay can be blocked by the browser even though this fires from a
      // tap (envelope open); that's not a broken file, so leave the button
      // up — the click handler below retries play() from a direct gesture.
      audio.play().catch(() => {});
      audioRef.current = audio;
      setStarted(true);
    }
  }, [active, musicUrl, started]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  if (!musicUrl || !active || broken) return null;

  return (
    <button
      onClick={() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
          audio.muted = false;
          audio.play().catch(() => setBroken(true));
          setIsMuted(false);
          return;
        }
        audio.muted = !isMuted;
        setIsMuted(!isMuted);
      }}
      aria-label={isMuted ? t.unmuteMusic : t.muteMusic}
      className="no-print fixed top-4 right-4 z-[99999] flex size-10 items-center justify-center rounded-full border backdrop-blur"
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
