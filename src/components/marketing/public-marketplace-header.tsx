import Link from "next/link";
import { Sparkles } from "lucide-react";

import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_NAME } from "@/config/site";

export function PublicMarketplaceHeader() {
  return (
    <header className="royal-nav sticky top-0 z-50 border-b border-violet-200/70 bg-white/95 text-[#4b3659] shadow-[0_8px_28px_rgba(103,75,123,.06)] backdrop-blur-2xl">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className="relative z-10 transition duration-300 hover:scale-[1.025]"
        >
          <SiteLogo size="sm" showName />
        </Link>

        <details className="group relative">
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
