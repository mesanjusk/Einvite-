import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";

import { SITE_NAME } from "@/config/site";
import { LEGAL_BRAND_NAME } from "@/config/legal";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[linear-gradient(135deg,#4a0e21,#7f1739_55%,#a74625)] px-6 py-10 text-center text-[#fff4dc]">
      <div className="pointer-events-none absolute -left-12 -top-12 size-44 rounded-full border border-[#f7c768]/25" />
      <div className="pointer-events-none absolute -right-16 bottom-[-60px] size-52 rounded-full border border-[#f7c768]/25" />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-2 text-[#f4c96f]">
          <Sparkles className="size-4" />
          <span className="font-script text-3xl">Made for celebrations</span>
          <Heart className="size-4 fill-current" />
        </div>

        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[#f9e5c0]/85">
          <Link href="/themes" className="transition hover:text-white">Designs</Link>
          <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
          <Link href="/terms" className="transition hover:text-white">Terms</Link>
          <Link href="/contact" className="transition hover:text-white">Contact</Link>
        </nav>

        <p className="mt-6 text-sm font-semibold text-white">
          {SITE_NAME} · {LEGAL_BRAND_NAME}
        </p>
        <p className="mt-1 text-[10px] tracking-[0.14em] text-[#f6dbaa]/65 uppercase">
          © {new Date().getFullYear()} · Love, colour & a little sparkle
        </p>
      </div>
    </footer>
  );
}
