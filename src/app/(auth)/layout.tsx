import Link from "next/link";
import { Gem, Sparkles } from "lucide-react";

import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_TAGLINE } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="royal-auth relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[#1c1a18] px-4 py-12 text-[#f5ead2]">
      <div className="royal-dust pointer-events-none absolute inset-0 opacity-70" />
      <div className="royal-orbit royal-orbit-a" />
      <div className="royal-orbit royal-orbit-b" />
      <div className="royal-corner royal-corner-tl" />
      <div className="royal-corner royal-corner-br" />

      <div className="relative z-10 flex w-full flex-col items-center gap-7">
        <Link href="/" className="inline-block transition duration-300 hover:scale-[1.03]">
          <SiteLogo size="lg" />
        </Link>

        <div className="flex items-center gap-2 text-[#d5b16a]">
          <Sparkles className="size-4" />
          <span className="font-display text-lg tracking-wide">{SITE_TAGLINE}</span>
          <Gem className="size-4" />
        </div>

        {children}
      </div>
    </div>
  );
}
