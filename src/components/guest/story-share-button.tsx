"use client";

import { useState } from "react";
import { ImageDown, Share2 } from "lucide-react";
import { invitationStoryUrl } from "@/lib/invitation-growth";
import { trackInvitationGrowth } from "@/lib/track-invitation-growth";

function drawStory(canvas: HTMLCanvasElement, title: string, link: string) {
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#f8f1e8");
  gradient.addColorStop(1, "#e7d9ef");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.strokeStyle = "#a98554";
  ctx.lineWidth = 9;
  ctx.strokeRect(65, 65, 950, 1790);
  ctx.lineWidth = 2;
  ctx.strokeRect(86, 86, 908, 1748);
  ctx.textAlign = "center";
  ctx.fillStyle = "#795a8b";
  ctx.font = "bold 40px Georgia, serif";
  ctx.fillText("A SPECIAL CELEBRATION", 540, 490);
  ctx.fillStyle = "#4b3659";
  ctx.font = "bold 76px Georgia, serif";
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > 880 && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  lines.slice(0, 5).forEach((line, i) => ctx.fillText(line, 540, 760 + i * 104, 900));
  ctx.fillStyle = "#947647";
  ctx.font = "32px Georgia, serif";
  ctx.fillText("OPEN OUR DIGITAL INVITATION", 540, 1395);
  ctx.fillStyle = "#4b3659";
  ctx.font = "30px sans-serif";
  ctx.fillText("Add the link using Instagram's Link sticker", 540, 1490, 870);
  ctx.font = "28px sans-serif";
  ctx.fillText(new URL(link).host, 540, 1540, 840);
  ctx.fillStyle = "#947647";
  ctx.font = "bold 44px Georgia, serif";
  ctx.fillText("SK DIGITAL", 540, 1710);
  return true;
}

/**
 * Instagram has no reliable web deep link for directly publishing a Story.
 * Offer the OS share sheet with a real PNG; fall back to downloading it.
 * The user adds their invite link using Instagram's Link sticker.
 */
export function StoryShareButton({
  url,
  title = "You are invited",
  invitationSlug,
}: {
  url: string;
  title?: string;
  invitationSlug?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      const publicUrl = invitationStoryUrl(url);
      const canvas = document.createElement("canvas");
      if (!drawStory(canvas, title, publicUrl)) throw new Error("Unable to render story");
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Unable to export story");
      const file = new File([blob], "SK-Digital-Invitation-Story.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Our invitation" });
          if (invitationSlug) trackInvitationGrowth(invitationSlug, "STORY_SHARE");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = file.name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      setDownloaded(true);
      if (invitationSlug) trackInvitationGrowth(invitationSlug, "STORY_SHARE");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => void share()}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-semibold text-[#624674] disabled:opacity-60"
      >
        {downloaded ? <ImageDown className="size-4" /> : <Share2 className="size-4" />}
        {busy ? "Preparing story…" : "Instagram Story image"}
      </button>
      <p className="text-center text-[11px] leading-4 text-[#836b90]">
        Share from your phone, or save the image. Add your invitation link as a sticker in Instagram.
      </p>
    </div>
  );
}
