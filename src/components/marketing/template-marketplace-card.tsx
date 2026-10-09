import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { ThemeArtwork } from "@/components/marketing/theme-artwork";
import { PhoneMockup } from "@/components/marketing/phone-mockup";

export type MarketplaceThemeCard = {
  id: string;
  name: string;
  slug: string;
  category: string;
  eventCategory: string;
  eventCategories?: string[];
  isPremium: boolean;
  previewImage: string | null;
  revealMode?: string | null;
  revealVideoUrl?: string | null;
  revealVideoPosterUrl?: string | null;
  sectionArtwork?: string | null;
  revealAnimationPreset?: string | null;
  previewPrimary?: string | null;
  previewAccent?: string | null;
  demoSlug?: string | null;
};

export function TemplateMarketplaceCard({ theme }: { theme: MarketplaceThemeCard }) {
  return (
    <Link href={`/preview/${theme.slug}`} aria-label={`Preview ${theme.name}`} className="block rounded-3xl focus-visible:outline-2 focus-visible:outline-violet-600"><article className="group min-w-0">
      <div className="relative">
        <div className="absolute -inset-2 rounded-[2rem] bg-[linear-gradient(135deg,#dcc8e8,#b995cd,#8a68a0)] opacity-0 blur-lg transition duration-500 group-hover:opacity-30" />
        <div className="wedding-card template-preview-stage relative rounded-[1.8rem] p-2 transition duration-300 group-hover:-translate-y-1.5">
          <span className="template-mini-confetti template-mini-confetti-a" />
          <span className="template-mini-confetti template-mini-confetti-b" />
          <span className="template-mini-confetti template-mini-confetti-c" />
          <span className="wedding-petal wedding-petal-a pointer-events-none left-2 top-4 z-30 block" />
          <span className="wedding-sparkle pointer-events-none right-3 top-4 z-30 block">✦</span>
          <PhoneMockup className="template-phone-lift max-w-none shadow-none">
            <ThemeArtwork theme={theme} animate />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#4b3659]/46 to-transparent" />
            <div className="template-shimmer" />


            <div className="pointer-events-none absolute left-2 top-2 z-20">
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/80 bg-white/92 px-2.5 py-1 text-[8px] font-black tracking-[0.1em] text-[#5b4268] uppercase shadow-sm backdrop-blur">
                <Sparkles className="size-3 text-[#8a649d]" />
                {theme.isPremium ? "Premium" : "Included"}
              </span>
            </div>
          </PhoneMockup>
        </div>
      </div>

      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[17px] leading-tight text-[#4b3659]">
              {theme.name}
            </h3>
            <p className="mt-0.5 truncate text-[9px] font-bold tracking-[0.12em] text-[#806b8c] uppercase">
              {theme.category}
            </p>
          </div>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-[#76508c] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>


      </div>
    </article></Link>
  );
}
