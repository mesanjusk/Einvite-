import Link from "next/link";
import { Gem, Sparkles } from "lucide-react";

import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";
import { LEGAL_BRAND_NAME } from "@/config/legal";

export function SiteFooter() {
  return (
    <footer className="royal-footer relative overflow-hidden border-t border-[#c8b0d8]/30 bg-[#4a3656] px-6 py-12 text-center text-[#faf2ff]">
      <div className="royal-corner royal-corner-tl" />
      <div className="royal-corner royal-corner-br" />
      <div className="royal-dust pointer-events-none absolute inset-0 opacity-45" />

      <div className="relative mx-auto max-w-5xl">
        <div className="flex justify-center">
          <SiteLogo size="lg" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[#ead083]">
          <Sparkles className="size-4" />
          <span className="font-display text-xl tracking-[0.05em]">{SITE_TAGLINE}</span>
          <Gem className="size-4" />
        </div>

        <nav className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold tracking-wide text-[#e5d8ea]/84">
          <Link href="/themes" className="transition hover:text-[#ffe9a9]">Designs</Link>
          <Link href="/privacy" className="transition hover:text-[#ffe9a9]">Privacy</Link>
          <Link href="/terms" className="transition hover:text-[#ffe9a9]">Terms</Link>
          <Link href="/contact" className="transition hover:text-[#ffe9a9]">Contact</Link>
        </nav>

        <div className="royal-divider mx-auto mt-8 max-w-sm" />

        <p className="mt-6 text-sm font-semibold tracking-[0.08em] text-[#f8e7ff] uppercase">
          {SITE_NAME}
        </p>
        <p className="mt-1 text-[9px] tracking-[0.12em] text-[#d6c4df]/68 uppercase">
          {LEGAL_BRAND_NAME}
        </p>
        <p className="mt-2 text-[9px] tracking-[0.14em] text-[#c8b7d1]/58 uppercase">
          © {new Date().getFullYear()} · crafted for beautiful celebrations
        </p>
      </div>
    </footer>
  );
}
