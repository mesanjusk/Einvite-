"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AssetProps = { kind: "image" | "video" | "audio"; url: string; label: string; poster?: string };

export function ThemeAssetReview(props: AssetProps) {
  // A new source gets a new status, so a failed selection never inherits "Ready".
  return <AssetCheck key={`${props.kind}-${props.url}`} {...props} />;
}

function AssetCheck({ kind, url, label, poster }: AssetProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "played" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const ready = () => setStatus("ready");
  const failed = () => setStatus("error");
  return (
    <div className="grid gap-2 rounded-xl border border-violet-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-words text-xs font-semibold text-[#4b3659]">{label}</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-violet-700"><CheckCircle2 className="size-3" />Selected</span>
      </div>
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={attempt} src={url} alt={label} className="max-h-36 w-full rounded-lg object-contain" onLoad={ready} onError={failed} />
      ) : kind === "video" ? (
        <video key={attempt} src={url} poster={poster} controls muted playsInline preload="auto" className="max-h-48 w-full rounded-lg bg-black" aria-label={label} onLoadedData={ready} onCanPlay={ready} onPlaying={() => setStatus("playing")} onPause={() => setStatus((current) => current === "played" ? current : "ready")} onEnded={() => setStatus("played")} onError={failed} />
      ) : (
        <audio key={attempt} src={url} controls preload="auto" className="w-full" aria-label={label} onLoadedData={ready} onCanPlay={ready} onPlaying={() => setStatus("playing")} onPause={() => setStatus((current) => current === "played" ? current : "ready")} onEnded={() => setStatus("played")} onError={failed} />
      )}
      <div role="status" className={`flex items-center justify-between gap-2 text-[11px] ${status === "error" ? "text-red-700" : "text-muted-foreground"}`}>
        <span>{status === "error" ? <><AlertCircle className="mr-1 inline size-3" />Failed to load — check the file or URL</> : status === "loading" ? "Loading selected file…" : status === "playing" ? "Playing" : status === "played" ? "Playback completed successfully" : kind === "image" ? "Image loaded" : "Loaded — press Play to check playback"}</span>
        {status === "error" && <Button type="button" variant="outline" size="sm" onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}><RotateCcw className="size-3" />Retry</Button>}
      </div>
    </div>
  );
}
