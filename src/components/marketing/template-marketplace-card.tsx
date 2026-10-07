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
  eventCategories?: string[];
  isPremium: boolean;
  previewImage: string | null;
  revealMode?: string | null;
  revealVideoUrl?: string | null;
  revealAnimationPreset?: string | null;
  previewPrimary?: string | null;
  previewAccent?: string | null;
  demoSlug?: string | null;
};

export function TemplateMarketplaceCard({ theme }: { theme: MarketplaceThemeCard }) {
  return (
    <article className="group min-w-0">
      <div className="relative">
        <div className="absolute -inset-2 rounded-[2rem] bg-[linear-gradient(135deg,#dcc8e8,#b995cd,#8a68a0)] opacity-0 blur-lg transition duration-500 group-hover:opacity-30" />
        <div className="wedding-card template-preview-stage relative rounded-[1.8rem] p-2 transition duration-300 group-hover:-translate-y-1.5 sm:p-2.5">
          <span className="template-mini-confetti template-mini-confetti-a" />
          <span className="template-mini-confetti template-mini-confetti-b" />
          <span className="template-mini-confetti template-mini-confetti-c" />
          <span className="wedding-petal wedding-petal-a pointer-events-none left-2 top-4 z-30 hidden sm:block" />
          <span className="wedding-sparkle pointer-events-none right-3 top-4 z-30 hidden sm:block">✦</span>
          <PhoneMockup className="template-phone-lift max-w-none shadow-none">
            {theme.revealMode === "VIDEO" && theme.revealVideoUrl ? (
              <video
                src={theme.revealVideoUrl}
                poster={theme.previewImage ?? undefined}
                className="absolute inset-0 size-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 50% 24%, color-mix(in srgb, ${theme.previewAccent || "#a987bd"} 28%, white), transparent 34%), linear-gradient(160deg, #ffffff, color-mix(in srgb, ${theme.previewPrimary || "#76508c"} 18%, white))`,
                }}
              >
                {theme.revealAnimationPreset === "PETALS" && (
                  <>
                    <span className="wedding-petal wedding-petal-a left-[18%] top-[12%]" />
                    <span className="wedding-petal wedding-petal-b right-[14%] top-[26%]" />
                    <span className="wedding-petal wedding-petal-c bottom-[22%] left-[28%]" />
                  </>
                )}
                {theme.revealAnimationPreset === "CONFETTI" && (
                  <>
                    <span className="template-mini-confetti template-mini-confetti-a" />
                    <span className="template-mini-confetti template-mini-confetti-b" />
                    <span className="template-mini-confetti template-mini-confetti-c" />
                  </>
                )}
                {theme.revealAnimationPreset === "SPARKLES" && (
                  <>
                    <span className="wedding-sparkle left-[20%] top-[20%]">✦</span>
                    <span className="wedding-sparkle wedding-sparkle-delay right-[18%] top-[34%]">✦</span>
                  </>
                )}
                {(!theme.revealAnimationPreset || theme.revealAnimationPreset === "MAGIC_BLOOM") && (
                  <>
                    <span className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-violet-300/60 bg-violet-100/30" />
                    <span className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-violet-300/70 bg-white/45 [animation-delay:-.7s]" />
                  </>
                )}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center">
                  <Sparkles className="mx-auto size-5 text-[#76508c]" />
                  <p className="mt-2 font-display text-sm leading-tight text-[#4b3659]">{theme.name}</p>
                  <p className="mt-1 text-[8px] font-bold tracking-[0.12em] text-[#8a7397] uppercase">
                    {theme.revealAnimationPreset?.replaceAll("_", " ") || "Magic bloom"}
                  </p>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#4b3659]/46 to-transparent" />
            <div className="template-shimmer" />

            {theme.demoSlug && (
              <Link
                href={`/invite/${theme.demoSlug}`}
                aria-label={`Preview ${theme.name}`}
                className="absolute inset-0 z-10 grid place-items-center"
              >
                <span className="grid size-12 place-items-center rounded-full border border-violet-200 bg-white/92 text-[#76508c] shadow-[0_12px_28px_rgba(91,67,107,.16)] backdrop-blur transition group-hover:scale-110">
                  <Play className="ml-0.5 size-4 fill-current" />
                </span>
              </Link>
            )}

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
            <h3 className="truncate font-display text-[17px] leading-tight text-[#4b3659] sm:text-xl">
              {theme.name}
            </h3>
            <p className="mt-0.5 truncate text-[9px] font-bold tracking-[0.12em] text-[#806b8c] uppercase">
              {theme.category}
            </p>
          </div>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-[#76508c] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
