"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { artworkPosterFor, type ArtworkTheme } from "@/lib/marketplace-artwork";

export function ThemeArtwork({ theme, animate = false }: { theme: ArtworkTheme; animate?: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [failedVideo, setFailedVideo] = useState<string | null>(null);
  const poster = artworkPosterFor(theme);
  const videoSource = theme.revealMode === "VIDEO" ? theme.revealVideoUrl : null;
  const playable = animate && visible && motionAllowed && videoSource && failedVideo !== videoSource;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => setMotionAllowed(!query.matches && !connection?.saveData);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const update = () => {
      if (playable && !document.hidden) void element.play().catch(() => {});
      else element.pause();
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => { element.pause(); document.removeEventListener("visibilitychange", update); };
  }, [playable]);

  return (
    <div ref={frame} className="absolute inset-0 overflow-hidden" data-theme-artwork={theme.name}>
      <div aria-hidden="true" className="royal-coded-artwork absolute inset-0" style={{ background: `linear-gradient(160deg,#fffaf4,${theme.previewAccent || "#d8c4e5"},${theme.previewPrimary || "#76508c"})` }}>
        <div className="royal-artwork-arch" />
        <Sparkles className="absolute left-[18%] top-[16%] size-5 text-white/80" />
        <Heart className="absolute right-[18%] top-[23%] size-4 text-white/80" />
        <div className="absolute inset-x-4 top-[44%] text-center text-[#4b3659]">
          <p className="font-script text-4xl">You&apos;re invited</p>
          <p className="font-display mt-3 text-base leading-tight">{theme.name}</p>
          <span className="mx-auto mt-5 block h-px w-12 bg-[#b99865]" />
        </div>
        <span className="wedding-petal wedding-petal-a left-[12%] top-[65%]" />
        <span className="wedding-petal wedding-petal-b right-[14%] top-[72%]" />
      </div>
      {poster && failedImage !== poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" onError={() => setFailedImage(poster)} />
      )}
      {playable && (
        <video ref={video} src={videoSource} poster={poster || undefined} className="absolute inset-0 size-full object-cover" muted loop playsInline preload="none" onError={() => setFailedVideo(videoSource)} />
      )}
    </div>
  );
}
