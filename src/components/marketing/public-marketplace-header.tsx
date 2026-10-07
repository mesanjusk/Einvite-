import Link from "next/link";
import { Gem, Sparkles } from "lucide-react";

import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_NAME } from "@/config/site";

export function PublicMarketplaceHeader() {
  return (
    <header className="royal-nav sticky top-0 z-50 border-b border-violet-200/70 bg-white/95 text-[#4b3659] shadow-[0_8px_28px_rgba(103,75,123,.06)] backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.35rem] max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className="relative z-10 transition duration-300 hover:scale-[1.025]"
        >
          <SiteLogo size="md" showName />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-violet-200/80 bg-violet-50/60 p-1.5 shadow-sm md:flex">
          {[
            ["Home", "/"],
            ["Designs", "/themes"],
            ["My invites", "/dashboard"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-[#6b5578] transition duration-300 hover:bg-violet-100 hover:text-[#4b3659]"
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
          <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-violet-200 bg-white text-[#5b4268] shadow-sm transition hover:bg-violet-50 [&::-webkit-details-marker]:hidden">
            <span className="flex w-4 flex-col gap-[3px]" aria-hidden="true">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
            </span>
            <span className="sr-only">Open menu</span>
          </summary>

          <div className="royal-menu absolute right-0 top-12 w-[min(86vw,320px)] overflow-hidden rounded-[1.8rem] border border-violet-200 bg-white/98 p-4 shadow-[0_26px_80px_rgba(84,59,101,.18)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-center gap-2 text-[#76508c]">
              <Sparkles className="size-4" />
              <span className="font-display text-lg tracking-wide">SK Digital</span>
            </div>
            <nav className="grid gap-1 text-center font-display text-lg text-[#4b3659]">
              <Link href="/" className="rounded-2xl px-4 py-3 transition hover:bg-violet-50">Home</Link>
              <Link href="/themes" className="rounded-2xl px-4 py-3 transition hover:bg-violet-50">Designs</Link>
              <Link href="/dashboard" className="rounded-2xl px-4 py-3 transition hover:bg-violet-50">My invitations</Link>
              <Link href="/contact" className="rounded-2xl px-4 py-3 transition hover:bg-violet-50">Contact</Link>
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
