"use client";

import { type ReactNode, useId } from "react";
import { Layers, Type, SlidersHorizontal, Palette, Image, Video, Music, BookOpen, Plus } from "lucide-react";

export type StudioTool = "sections" | "ai" | "content" | "library" | "text" | "advanced" | "theme" | "templates" | "video" | "music";
const TOOLS = [
  { id: "sections", title: "Sections", icon: Layers },
  { id: "ai", title: "AI style", icon: Palette },
  { id: "content", title: "Layers", icon: Layers },
  { id: "text", title: "Text & style", icon: Type },
  { id: "advanced", title: "Section", icon: SlidersHorizontal },
  { id: "theme", title: "Theme", icon: Palette },
] as const;
const ASSETS = [
  { id: "templates", title: "Templates", icon: Image },
  { id: "video", title: "Video", icon: Video },
  { id: "music", title: "Music", icon: Music },
  { id: "library", title: "Content", icon: BookOpen },
] as const;
const TITLES: Record<StudioTool, string> = { sections: "Add & organize sections", ai: "Gemini design assistant", content: "Text layers", library: "Content library", text: "Text & style", advanced: "Section layout", theme: "Theme settings", templates: "Artwork templates", video: "Opening video & animation", music: "Theme music" };

/** Tool changes stay within this editor: no route navigation or network fetch. */
export function ThemeStudioShell({ tool, onToolChange, sections, canvas, panel, onAddText, status, actions, canEditText = true }: {
  canEditText?: boolean;
  tool: StudioTool;
  onToolChange: (tool: StudioTool) => void;
  sections: ReactNode;
  canvas: ReactNode;
  panel: ReactNode;
  onAddText: () => void;
  status: ReactNode;
  actions: ReactNode;
}) {
  const panelId = useId();
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f3eff7] lg:h-full">
      <nav aria-label="Invitation sections" className="shrink-0 border-b border-violet-200 bg-white px-3 py-1">{sections}</nav>
      <div className="grid min-h-0 flex-1 grid-cols-[86px_minmax(0,1fr)] lg:grid-cols-[100px_minmax(320px,1fr)_360px] xl:grid-cols-[108px_minmax(320px,1fr)_390px]">
        <nav aria-label="Theme editing tools" className="flex min-h-0 flex-col gap-2 overflow-y-auto border-r border-violet-200 bg-white px-2 py-4">
          {TOOLS.map(({ id, title, icon: Icon }) => <button key={id} type="button" disabled={id === "text" && !canEditText} aria-pressed={tool === id} aria-controls={panelId} onClick={() => onToolChange(id)} className={`disabled:cursor-not-allowed disabled:opacity-40 flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl p-2 text-center text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-violet-600 ${tool === id ? "bg-violet-100 text-violet-900" : "text-[#74617f] hover:bg-violet-50"}`}><Icon className="size-5" />{title}</button>)}
          <button type="button" disabled={!canEditText} title={canEditText ? "Add text to this section" : "Choose a body section to add text"} onClick={onAddText} className="disabled:cursor-not-allowed disabled:opacity-40 mt-2 flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 p-2 text-[11px] font-semibold text-violet-800"><Plus className="size-5" />Add text</button>
          <p className="mt-auto px-1 pt-6 text-center text-[9px] leading-relaxed text-muted-foreground">Admin studio<br />Mobile invitation</p>
        </nav>
        <main aria-label="Theme design canvas" className="min-h-0 min-w-0 overflow-hidden p-2 lg:p-3">{canvas}</main>
        <aside id={panelId} aria-label={TITLES[tool]} className="col-span-2 flex max-h-[65svh] min-h-0 flex-col overflow-hidden border-t border-violet-200 bg-white lg:col-span-1 lg:max-h-none lg:border-t-0 lg:border-l">
          <div className="shrink-0 border-b border-violet-100 px-4 py-3"><h2 className="text-sm font-bold text-[#4b3659]">{TITLES[tool]}</h2><p className="mt-1 text-[10px] text-muted-foreground">Changes appear in your draft preview immediately.</p></div>
          <div key={tool} className="min-h-0 flex-1 overflow-y-auto p-3">{panel}</div>
        </aside>
      </div>
      <footer className="z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-violet-200 bg-white px-3 py-2 lg:px-5">
        <nav aria-label="Theme asset libraries" className="flex gap-1 sm:gap-2">{ASSETS.map(({ id, title, icon: Icon }) => <button key={id} type="button" aria-pressed={tool === id} aria-controls={panelId} onClick={() => onToolChange(id)} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-violet-600 ${tool === id ? "bg-violet-100 text-violet-900" : "text-[#74617f] hover:bg-violet-50"}`}><Icon className="size-4" /><span>{title}</span></button>)}</nav>
        <p className="hidden text-[10px] text-muted-foreground xl:block">{status}</p>
        <div className="flex items-center gap-2">{actions}</div>
      </footer>
    </div>
  );
}
