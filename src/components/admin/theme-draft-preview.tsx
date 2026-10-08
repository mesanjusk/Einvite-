"use client";

import { ThemePhoneFrame } from "./theme-phone-frame";
import { useState } from "react";
import { Eye, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InviteExperience } from "@/components/invite/invite-experience";
import { ThemeAssetReview } from "@/components/admin/theme-asset-review";
import { buildThemePreviewData, PREVIEW_SECTION_TYPES } from "@/lib/theme-preview";
import { buildInviteThemeStyle } from "@/lib/theme-css-vars";
import { sectionDisplayName } from "@/lib/section-labels";
import type { ThemeFormValues } from "@/lib/validations/admin";

export function ThemeDraftPreview({ draft }: { draft: ThemeFormValues }) {
  const [replay, setReplay] = useState(0);
  const [skipOpening, setSkipOpening] = useState(false);
  const [open, setOpen] = useState(false);
  const invite = buildThemePreviewData(draft);
  const missingVideo = draft.revealMode === "VIDEO" && !draft.revealVideoUrl;
  const sections = draft.sectionOrder.map((type, order) => ({ id: `preview-${type}`, type, visible: true, order }));
  const images = Object.entries(draft.decorAssets?.sectionImages ?? {}).filter(([section, url]) => url && draft.sectionOrder.includes(section as ThemeFormValues["sectionOrder"][number]));
  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { setSkipOpening(false); setReplay((value) => value + 1); } }}>
      <DialogTrigger asChild><Button type="button" variant="outline"><Eye className="size-4" />Full preview</Button></DialogTrigger>
      <DialogContent className="z-[80] h-[94svh] max-h-[94svh] flex flex-col overflow-hidden bg-[#f5f4f7] p-4 sm:max-w-6xl sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle>Full invitation preview · {draft.name || "Untitled theme"}</DialogTitle>
          <DialogDescription>Current unsaved draft. Names, date, venue and gallery photo are sample customer values. Previewing does not save or publish the theme.</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 min-w-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_350px]">
          <div className="flex min-h-0 flex-col gap-2">
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setSkipOpening(false); setReplay((value) => value + 1); }}><RotateCcw className="size-3" />Replay from start</Button>
              {draft.sectionOrder.includes("ENVELOPE") && <Button type="button" variant="outline" size="sm" onClick={() => setSkipOpening(true)}>View all sections</Button>}
            </div>
            <ThemePhoneFrame aria-label="Full mobile invitation preview" style={buildInviteThemeStyle(draft.colorPalette, draft.fontPairing)} onSubmitCapture={(event) => { event.preventDefault(); event.stopPropagation(); }}>
              {open && <InviteExperience key={`${replay}-${skipOpening}-${invite.revealVideoUrl}-${draft.revealMode}`} invite={invite} sectionConfig={sections} skipEnvelope={skipOpening || !draft.sectionOrder.includes("ENVELOPE")} previewMode />}
            </ThemePhoneFrame>
            <p className="text-center text-xs text-muted-foreground">Tap the opening, then scroll inside the phone to inspect the complete design. RSVP is disabled in this preview.</p>
          </div>
          <aside className="grid min-h-0 content-start gap-3 overflow-y-auto lg:pr-2">
            <h3 className="text-sm font-bold">Selected items & checks</h3>
            <p className="text-xs text-muted-foreground">“Selected” confirms the draft choice. Load status and playback controls let you check whether the file works.</p>
            <div className="grid gap-2 rounded-xl border bg-white p-3">
              <p className="text-xs font-semibold">Section order</p>
              {draft.sectionOrder.map((section, index) => <p key={section} className={`flex items-center gap-2 text-xs ${PREVIEW_SECTION_TYPES.has(section) ? "text-[#4b3659]" : "text-amber-700"}`}>{PREVIEW_SECTION_TYPES.has(section) ? <CheckCircle2 className="size-3 shrink-0" /> : <AlertCircle className="size-3 shrink-0" />}{index + 1}. {sectionDisplayName(section)}{!PREVIEW_SECTION_TYPES.has(section) && " — no website renderer yet"}</p>)}
              {draft.sectionOrder.includes("TIMELINE") && <p className="text-[11px] text-muted-foreground">Separate events: {invite.events.map((event) => event.name).join(" · ") || "none selected"}</p>}
              {draft.sectionOrder.includes("COUNTDOWN") && <p className="text-[11px] text-muted-foreground">Scratch shape: {invite.sectionStyles?.COUNTDOWN?.scratchShape ?? "box"} · three cards in one row</p>}
              {draft.sectionOrder.includes("STORY") && draft.sectionOrder.includes("GALLERY") && <p className="text-[11px] text-amber-700">Story and Gallery share one photo section in the guest invitation.</p>}
            </div>
            {missingVideo && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">Video reveal selected, but no video chosen. Choose a video before saving; animation will not play in video mode.</p>}
            {draft.revealMode === "VIDEO" ? (invite.revealVideoUrl ? <ThemeAssetReview kind="video" url={invite.revealVideoUrl} poster={invite.revealVideoPosterUrl ?? undefined} label="Opening reveal video" /> : <p className="rounded-xl border bg-white p-3 text-xs">Selected opening: video · no file selected</p>) : <p className="rounded-xl border bg-white p-3 text-xs">Selected opening: {draft.decorAssets?.revealAnimation?.preset ?? "MAGIC_BLOOM"} coded animation</p>}
            {invite.musicUrl ? <ThemeAssetReview kind="audio" url={invite.musicUrl} label={draft.decorAssets?.musicName || "Theme music"} /> : <p className="rounded-xl border bg-white p-3 text-xs">Music: none selected</p>}
            {images.map(([section, url]) => <ThemeAssetReview key={section} kind="image" url={url} label={`${sectionDisplayName(section)} artwork`} />)}
            {images.length === 0 && <p className="rounded-xl border bg-white p-3 text-xs">Artwork: no section images selected</p>}
            <details className="rounded-xl border bg-white p-3 text-xs"><summary className="cursor-pointer font-semibold">Selected content</summary><div className="mt-3 grid gap-3">{Object.entries(draft.content ?? {}).filter(([, text]) => text).map(([key, text]) => <p key={key} className="whitespace-pre-wrap break-words"><strong>{key}: </strong>{text}</p>)}{Object.entries(draft.decorAssets?.elementStyles ?? {}).filter(([, style]) => style.text && !style.hidden).map(([key, style]) => <p key={key} className="whitespace-pre-wrap break-words"><strong>{key}: </strong>{style.text}</p>)}{Object.entries(draft.decorAssets?.customText ?? {}).filter(([section]) => draft.sectionOrder.includes(section as ThemeFormValues["sectionOrder"][number])).flatMap(([section, blocks]) => blocks.map((block) => <p key={block.id} className="whitespace-pre-wrap break-words"><strong>{sectionDisplayName(section)}: </strong>{block.text}</p>))}</div></details>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
