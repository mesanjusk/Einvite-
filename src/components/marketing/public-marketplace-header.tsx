import Link from "next/link";
import { Sparkles } from "lucide-react";

import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_NAME } from "@/config/site";

export function PublicMarketplaceHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#f0c97d]/35 bg-[#fff8ec]/82 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10">
        <Link href="/" aria-label={`${SITE_NAME} home`} className="relative z-10">
          <SiteLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-[#f0c97d]/35 bg-white/65 p-1.5 shadow-[0_10px_30px_rgba(113,33,55,.08)] md:flex">
          {[
            ["Home", "/"],
            ["Designs", "/themes"],
            ["My invites", "/dashboard"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-xs font-bold text-[#6b3540] transition hover:bg-[#fff0c9] hover:text-[#8f1537]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/themes"
            className="wedding-cta inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold tracking-[0.08em] uppercase transition"
          >
            <Sparkles className="size-4" />
            Find a design
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-[#e8b95d]/45 bg-white/80 text-[#8f1537] shadow-sm [&::-webkit-details-marker]:hidden">
            <span className="flex w-4 flex-col gap-[3px]" aria-hidden="true">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
            </span>
            <span className="sr-only">Open menu</span>
          </summary>

          <div className="wedding-glass absolute right-0 top-12 w-[min(84vw,310px)] overflow-hidden rounded-[2rem] p-4">
            <div className="mb-3 flex items-center justify-center gap-2 text-[#b66c1b]">
              <Sparkles className="size-4" />
              <span className="font-script text-2xl">Celebrate beautifully</span>
            </div>
            <nav className="grid gap-1 text-center font-display text-lg text-[#6b2438]">
              <Link href="/" className="rounded-2xl px-4 py-3 hover:bg-[#fff0ca]">Home</Link>
              <Link href="/themes" className="rounded-2xl px-4 py-3 hover:bg-[#fff0ca]">Designs</Link>
              <Link href="/dashboard" className="rounded-2xl px-4 py-3 hover:bg-[#fff0ca]">My invitations</Link>
              <Link href="/contact" className="rounded-2xl px-4 py-3 hover:bg-[#fff0ca]">Contact</Link>
            </nav>
            <Link
              href="/themes"
              className="wedding-cta mt-4 flex w-full items-center justify-center rounded-full px-5 py-3 text-xs font-extrabold uppercase"
            >
              Start with a design
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
