import Link from "next/link";
import { Gem, Sparkles } from "lucide-react";

import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";
import { LEGAL_BRAND_NAME } from "@/config/legal";

export function SiteFooter() {
  return (
    <footer className="royal-footer relative overflow-hidden border-t border-violet-200/70 bg-white px-6 py-12 text-center text-[#4b3659]">
      <div className="royal-corner royal-corner-tl" />
      <div className="royal-corner royal-corner-br" />
      <div className="royal-dust pointer-events-none absolute inset-0 opacity-45" />

      <div className="relative mx-auto max-w-5xl">
        <div className="flex justify-center">
          <SiteLogo size="lg" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[#76508c]">
          <Sparkles className="size-4" />
          <span className="font-display text-xl tracking-[0.05em]">{SITE_TAGLINE}</span>
          <Gem className="size-4" />
        </div>

        <nav className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold tracking-wide text-[#75617f]">
          <Link href="/themes" className="transition hover:text-[#76508c]">Designs</Link>
          <Link href="/privacy" className="transition hover:text-[#76508c]">Privacy</Link>
          <Link href="/terms" className="transition hover:text-[#76508c]">Terms</Link>
          <Link href="/contact" className="transition hover:text-[#76508c]">Contact</Link>
        </nav>

        <div className="royal-divider mx-auto mt-8 max-w-sm" />

        <p className="mt-6 text-sm font-semibold tracking-[0.08em] text-[#4b3659] uppercase">
          {SITE_NAME}
        </p>
        <p className="mt-1 text-[9px] tracking-[0.12em] text-[#8c7897] uppercase">
          {LEGAL_BRAND_NAME}
        </p>
        <p className="mt-2 text-[9px] tracking-[0.14em] text-[#9a87a4] uppercase">
          © {new Date().getFullYear()} · crafted for beautiful celebrations
        </p>
      </div>
    </footer>
  );
}
