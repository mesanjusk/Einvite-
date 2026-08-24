"use client";

import { useState } from "react";
import { Languages } from "lucide-react";

import { LANGUAGES } from "@/lib/i18n/languages";
import { useLocale } from "@/lib/i18n/locale-context";

export function LanguageToggle() {
  const { code, setCode } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="no-print inv-float fixed top-4 left-4 z-[99999]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-full border backdrop-blur"
        style={{
          background: "color-mix(in srgb, var(--inv-primary) 85%, transparent)",
          borderColor: "color-mix(in srgb, var(--inv-accent) 50%, transparent)",
          color: "var(--inv-secondary)",
        }}
      >
        <Languages className="size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
          <div
            className="mt-2 grid max-h-[70svh] w-44 grid-cols-2 gap-1 overflow-y-auto rounded-xl border p-1.5 shadow-xl backdrop-blur"
            style={{
              background: "color-mix(in srgb, var(--inv-background) 96%, transparent)",
              borderColor: "color-mix(in srgb, var(--inv-accent) 30%, transparent)",
            }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setCode(lang.code);
                  setOpen(false);
                }}
                className="rounded-lg px-2 py-1.5 text-left text-sm"
                style={{
                  background:
                    lang.code === code
                      ? "color-mix(in srgb, var(--inv-primary) 15%, transparent)"
                      : "transparent",
                  color: "var(--inv-foreground)",
                  fontWeight: lang.code === code ? 600 : 400,
                }}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
