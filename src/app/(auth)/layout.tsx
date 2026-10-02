import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";

import { SiteLogo } from "@/components/brand/site-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wedding-shell relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="wedding-pattern pointer-events-none absolute inset-0 opacity-35" />
      <div className="wedding-orb -left-16 top-16 size-48 bg-[#f2a42e]/30" />
      <div className="wedding-orb -right-20 bottom-10 size-56 bg-[#d82e66]/24" />

      <div className="relative z-10 flex w-full flex-col items-center gap-7">
        <Link href="/" className="inline-block">
          <SiteLogo size="lg" />
        </Link>

        <div className="flex items-center gap-2 text-[#b55f1b]">
          <Sparkles className="size-4" />
          <span className="font-script text-3xl">Your celebration, your way</span>
          <Heart className="size-4 fill-current text-[#c62959]" />
        </div>

        {children}
      </div>
    </div>
  );
}
