"use client";
import { useRef, type ReactNode } from "react";
export function GeminiStylePanel({ projectSettings, enabled, onEnabled, busy, ready, onApply, onAnalyze }: { projectSettings?: ReactNode; enabled: boolean; onEnabled: (enabled: boolean) => void; busy: boolean; ready: boolean; onApply: () => void; onAnalyze: (file: File) => void; }) {
  const file = useRef<HTMLInputElement>(null);
  return <section className="grid gap-3 rounded-xl border bg-white p-3 text-xs">
    <h3 className="font-semibold">Gemini smart styling</h3>
    <p className="text-muted-foreground">Suggest colours, loaded fonts, text widths and positions from an image or video frame. Keep names and wording. Adjust every suggestion with the normal editing tools.</p>
    {projectSettings}
    <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} />Automatically style content after a media upload</label>
    <p className="text-[10px] text-muted-foreground">Analysis sends a small image or video frame to Google Gemini using the project key. If unavailable, your upload and manual layout stay usable.</p>
    <button type="button" disabled={busy} onClick={() => file.current?.click()} className="rounded-xl border px-3 py-2 disabled:opacity-40">{busy ? "Analyzing design…" : "Analyze an image or video"}</button>
    <input ref={file} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => { if (event.target.files?.[0]) onAnalyze(event.target.files[0]); event.target.value = ""; }} />
    {ready && <button type="button" disabled={busy} onClick={onApply} className="rounded-xl bg-violet-700 px-3 py-2 text-white disabled:opacity-40">Apply latest suggestion</button>}
  </section>;
}
