"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { useLocale } from "@/lib/i18n/locale-context";

export function GuestNameGate({
  initials,
  onSubmit,
}: {
  initials: string;
  onSubmit: (name: string) => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(name.trim());
  }

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden px-8 text-center"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--inv-primary) 80%, white 8%) 0%, var(--inv-primary) 45%, color-mix(in srgb, var(--inv-primary) 70%, black 30%) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex w-full max-w-xs flex-col items-center"
      >
        <div
          className="mb-6 flex size-16 items-center justify-center rounded-full border text-2xl"
          style={{
            borderColor: "var(--inv-accent)",
            fontFamily: "var(--inv-font-script)",
            color: "var(--inv-secondary)",
          }}
        >
          {initials}
        </div>

        <p
          className="mb-1 text-xs tracking-[0.3em] uppercase"
          style={{ color: "var(--inv-accent)" }}
        >
          {t.guestNamePromptEyebrow}
        </p>
        <h2
          className="mb-6 text-2xl"
          style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-secondary)" }}
        >
          {t.guestNamePromptTitle}
        </h2>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.guestNamePromptPlaceholder}
            className="w-full rounded-full border bg-transparent px-5 py-3 text-center text-sm outline-none"
            style={{
              borderColor: "color-mix(in srgb, var(--inv-accent) 50%, transparent)",
              color: "var(--inv-secondary)",
            }}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="pill-button disabled:opacity-40"
            style={{ background: "var(--inv-accent)", color: "var(--inv-primary)" }}
          >
            {t.guestNamePromptCta}
          </button>
          <button
            type="button"
            onClick={() => onSubmit("")}
            className="text-xs opacity-70 underline-offset-4 hover:underline"
            style={{ color: "var(--inv-secondary)" }}
          >
            {t.guestNamePromptSkip}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
