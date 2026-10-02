import Link from "next/link";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";

import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";

export type MarketplaceThemeCard = {
  id: string;
  name: string;
  slug: string;
  category: string;
  eventCategory: string;
  isPremium: boolean;
  previewImage: string | null;
  demoSlug?: string | null;
};

export function TemplateMarketplaceCard({ theme }: { theme: MarketplaceThemeCard }) {
  return (
    <article className="group min-w-0">
      <div className="relative">
        <div className="absolute -inset-2 rounded-[2rem] bg-[linear-gradient(135deg,#e1bf77,#6d5030,#2c2925)] opacity-0 blur-lg transition duration-500 group-hover:opacity-25" />
        <div className="wedding-card template-preview-stage relative rounded-[1.8rem] p-2 transition duration-300 group-hover:-translate-y-1.5 sm:p-2.5">
          <span className="template-mini-confetti template-mini-confetti-a" />
          <span className="template-mini-confetti template-mini-confetti-b" />
          <span className="template-mini-confetti template-mini-confetti-c" />
          <span className="wedding-petal wedding-petal-a pointer-events-none left-2 top-4 z-30 hidden sm:block" />
          <span className="wedding-sparkle pointer-events-none right-3 top-4 z-30 hidden sm:block">✦</span>
          <PhoneMockup className="template-phone-lift max-w-none shadow-none">
            {theme.previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={theme.previewImage}
                alt={`${theme.name} invitation preview`}
                className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.045]"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#efd99e,#9d7844_45%,#2b2723)]" />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#181511]/72 to-transparent" />
            <div className="template-shimmer" />

            {theme.demoSlug && (
              <Link
                href={`/invite/${theme.demoSlug}`}
                aria-label={`Preview ${theme.name}`}
                className="absolute inset-0 z-10 grid place-items-center"
              >
                <span className="grid size-12 place-items-center rounded-full border border-white/60 bg-[#211f1c]/88 text-[#e4bf76] shadow-[0_12px_28px_rgba(0,0,0,.28)] backdrop-blur transition group-hover:scale-110">
                  <Play className="ml-0.5 size-4 fill-current" />
                </span>
              </Link>
            )}

            <div className="pointer-events-none absolute left-2 top-2 z-20">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e4c27e]/35 bg-[#211f1c]/86 px-2.5 py-1 text-[8px] font-black tracking-[0.1em] text-[#f1dcae] uppercase shadow-sm backdrop-blur">
                <Sparkles className="size-3 text-[#d7af63]" />
                {theme.isPremium ? "Premium" : "Included"}
              </span>
            </div>
          </PhoneMockup>
        </div>
      </div>

      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[17px] leading-tight text-[#312a24] sm:text-xl">
              {theme.name}
            </h3>
            <p className="mt-0.5 truncate text-[9px] font-bold tracking-[0.12em] text-[#9b773b] uppercase">
              {theme.category}
            </p>
          </div>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-[#b98d43] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>

        {theme.demoSlug ? (
          <Link
            href={`/invite/${theme.demoSlug}`}
            className="wedding-cta mt-3 flex w-full items-center justify-center rounded-full px-3 py-2.5 text-[9px] font-extrabold tracking-[0.1em] uppercase transition sm:text-[10px]"
          >
            Open invitation
          </Link>
        ) : (
          <StartLiveInvitationButton
            category={theme.eventCategory}
            themeSlug={theme.slug}
            className="wedding-cta mt-3 flex w-full items-center justify-center rounded-full px-3 py-2.5 text-[9px] font-extrabold tracking-[0.1em] uppercase transition sm:text-[10px]"
          >
            Make it mine
          </StartLiveInvitationButton>
        )}
      </div>
    </article>
  );
}
