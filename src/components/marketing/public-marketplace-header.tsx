import Link from "next/link";

import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_NAME } from "@/config/site";

export function PublicMarketplaceHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#eee6dc] bg-[#fffdf9]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-8 lg:px-10">
        <Link href="/" aria-label={`${SITE_NAME} home`}>
          <SiteLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#694d47] md:flex">
          <Link href="/" className="transition hover:text-[#5f1730]">
            Home
          </Link>
          <Link href="/themes" className="transition hover:text-[#5f1730]">
            Templates
          </Link>
          <Link href="/dashboard" className="transition hover:text-[#5f1730]">
            My invitations
          </Link>
          <Link href="/contact" className="transition hover:text-[#5f1730]">
            Contact
          </Link>
        </nav>

        <details className="group relative md:hidden">
          <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full border border-[#e6ddd4] bg-white text-[#5f1730] shadow-sm [&::-webkit-details-marker]:hidden">
            <span className="flex w-4 flex-col gap-[3px]" aria-hidden="true">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
            </span>
            <span className="sr-only">Open menu</span>
          </summary>

          <div className="absolute right-0 top-12 w-[min(82vw,300px)] overflow-hidden rounded-3xl border border-[#eadfd6] bg-[#fffdf9] p-4 shadow-[0_24px_70px_rgba(80,39,47,0.18)]">
            <nav className="grid gap-1 text-center font-display text-lg text-[#5b2a34]">
              <Link href="/" className="rounded-2xl px-4 py-2.5 hover:bg-[#fff5ea]">
                Home
              </Link>
              <Link href="/themes" className="rounded-2xl px-4 py-2.5 hover:bg-[#fff5ea]">
                Browse templates
              </Link>
              <Link href="/dashboard" className="rounded-2xl px-4 py-2.5 hover:bg-[#fff5ea]">
                My invitations
              </Link>
              <Link href="/contact" className="rounded-2xl px-4 py-2.5 hover:bg-[#fff5ea]">
                Contact
              </Link>
            </nav>

            <Link
              href="/themes"
              className="mt-4 flex w-full items-center justify-center rounded-full bg-[#65172e] px-5 py-3 text-xs font-extrabold tracking-[0.14em] text-white uppercase shadow-sm"
            >
              Browse templates
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
