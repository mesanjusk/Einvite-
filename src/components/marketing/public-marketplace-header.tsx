import Link from "next/link";
import { Gem, Sparkles } from "lucide-react";

import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_NAME } from "@/config/site";

export function PublicMarketplaceHeader() {
  return (
    <header className="royal-nav sticky top-0 z-50 border-b border-[#c9a35b]/25 bg-[#1f1d1a]/92 text-[#f7ecd4] backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.35rem] max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className="relative z-10 transition duration-300 hover:scale-[1.025]"
        >
          <SiteLogo size="md" showName />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-[#c9a35b]/22 bg-white/[0.045] p-1.5 shadow-[0_14px_38px_rgba(0,0,0,.22)] md:flex">
          {[
            ["Home", "/"],
            ["Designs", "/themes"],
            ["My invites", "/dashboard"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-[#e7d5ad] transition duration-300 hover:bg-[#d4ac62]/12 hover:text-[#f6dda1]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/themes"
            className="royal-gold-button inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold tracking-[0.08em] uppercase"
          >
            <Gem className="size-4" />
            Explore designs
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-[#d0ad6b]/40 bg-[#302b25] text-[#e6c47c] shadow-[0_8px_24px_rgba(0,0,0,.28)] transition hover:border-[#e6c47c]/70 [&::-webkit-details-marker]:hidden">
            <span className="flex w-4 flex-col gap-[3px]" aria-hidden="true">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
            </span>
            <span className="sr-only">Open menu</span>
          </summary>

          <div className="royal-menu absolute right-0 top-12 w-[min(86vw,320px)] overflow-hidden rounded-[1.8rem] border border-[#c9a35b]/28 bg-[#211e1b]/96 p-4 shadow-[0_26px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-center gap-2 text-[#d9b46b]">
              <Sparkles className="size-4" />
              <span className="font-display text-lg tracking-wide">SK Digital</span>
            </div>
            <nav className="grid gap-1 text-center font-display text-lg text-[#f0dfbc]">
              <Link href="/" className="rounded-2xl px-4 py-3 transition hover:bg-[#d4ac62]/10">Home</Link>
              <Link href="/themes" className="rounded-2xl px-4 py-3 transition hover:bg-[#d4ac62]/10">Designs</Link>
              <Link href="/dashboard" className="rounded-2xl px-4 py-3 transition hover:bg-[#d4ac62]/10">My invitations</Link>
              <Link href="/contact" className="rounded-2xl px-4 py-3 transition hover:bg-[#d4ac62]/10">Contact</Link>
            </nav>
            <Link
              href="/themes"
              className="royal-gold-button mt-4 flex w-full items-center justify-center rounded-full px-5 py-3 text-xs font-extrabold uppercase"
            >
              Find your invitation
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
