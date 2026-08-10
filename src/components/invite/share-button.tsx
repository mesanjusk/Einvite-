"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { useLocale } from "@/lib/i18n/locale-context";

function WhatsAppIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3C4 14.9 3.6 13.5 3.6 12c0-4.6 3.8-8.4 8.4-8.4s8.4 3.8 8.4 8.4-3.8 8.2-8.4 8.2z" />
    </svg>
  );
}

export function ShareButton({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed — fall back to the menu below
      }
    }
    setOpen((o) => !o);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t.linkCopied);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleNativeShare}
        className="pill-button inline-flex items-center gap-2"
        style={{ background: "var(--inv-accent)", color: "var(--inv-primary)" }}
      >
        <Share2 className="size-4" />
        {t.shareInvite}
      </button>

      {open && (
        <div
          className="mt-3 flex flex-col gap-2 rounded-2xl border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--inv-accent) 30%, transparent)",
            background: "color-mix(in srgb, var(--inv-background) 92%, white 8%)",
          }}
        >
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            style={{ color: "var(--inv-foreground)" }}
          >
            <WhatsAppIcon className="size-4 shrink-0" style={{ color: "#25D366" }} />
            {t.shareOnWhatsApp}
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-left text-sm"
            style={{ color: "var(--inv-foreground)" }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {t.copyLink}
          </button>
        </div>
      )}
    </div>
  );
}
