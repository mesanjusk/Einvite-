import Link from "next/link";
import { ArrowRight, Gem, Sparkles, WandSparkles } from "lucide-react";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { PublicMarketplaceHeader } from "@/components/marketing/public-marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import {
  TemplateMarketplaceCard,
  type MarketplaceThemeCard,
} from "@/components/marketing/template-marketplace-card";
import { AnimatedInvitationShowcase } from "@/components/marketing/animated-invitation-showcase";
import { WeddingAmbientEffects } from "@/components/marketing/wedding-ambient-effects";
import { availableEventCategorySlugs } from "@/lib/theme-display";
export function RoyalLandingPage({
  themeCards,
  catalogUnavailable = false,
}: {
  themeCards: MarketplaceThemeCard[];
  catalogUnavailable?: boolean;
}) {
  const availableCategories = availableEventCategorySlugs(themeCards);
  return (
    <div className="lavender-wedding-surface min-h-svh text-[#4b3659]">
      <PublicMarketplaceHeader />
      <main>
        <section className="royal-landing-hero relative overflow-hidden px-4 py-8 text-center sm:px-6 md:py-14">
          <WeddingAmbientEffects variant="browser" className="opacity-25" />
          <div className="royal-corner royal-corner-tl" />
          <div className="royal-corner royal-corner-br" />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-4 md:grid-cols-[1fr_1fr] md:gap-12 md:px-10 md:text-left">
            <div className="md:py-8">
              <p className="text-[11px] font-semibold tracking-[.25em] text-[#927a9c] uppercase">
                Made for your celebration
              </p>
              <h1 className="font-display mx-auto mt-2 max-w-[300px] text-[34px] leading-[1.08] text-balance md:mx-0 md:max-w-xl md:text-6xl lg:text-7xl">
                An invitation
                <br />
                <span className="font-script text-[46px] text-[#76508c] md:text-7xl">
                  to remember
                </span>
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#806b8c] md:mx-0 md:text-base">
                Choose a design, personalize the details, and share one beautiful link
                with everyone you love.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                <Link
                  href="/themes"
                  className="royal-gold-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold"
                >
                  Choose a design <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/create"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-violet-200 bg-white/80 px-7 py-3 text-sm font-semibold text-[#76508c] transition hover:bg-white"
                >
                  Start creating
                </Link>
              </div>
              <p className="mt-4 text-xs leading-5 text-[#806b8c]">
                Each design is marked Included or Premium before you choose. Need help?{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-[#76508c] underline-offset-2 hover:underline"
                >
                  Contact SK Digital
                </Link>
                .
              </p>
            </div>
            <div className="mx-auto w-full max-w-[400px] md:max-w-none">
              {themeCards.length > 0 ? (
                <AnimatedInvitationShowcase themes={themeCards.slice(0, 3)} />
              ) : (
                <div className="my-8 rounded-[2rem] border border-violet-200 bg-white/70 px-6 py-12">
                  <Sparkles className="mx-auto size-8 text-[#a987bd]" />
                  <h2
                    role={catalogUnavailable ? "alert" : undefined}
                    className="font-display mt-4 text-xl"
                  >
                    {catalogUnavailable
                      ? "Designs are temporarily unavailable"
                      : "New designs are on their way"}
                  </h2>
                  {catalogUnavailable && (
                    <p className="mt-2 text-sm">
                      Please refresh the page or try again shortly. Your invitation
                      drafts are safe.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        {availableCategories.length > 0 && (
          <section
            className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10"
            aria-label="Celebrations"
          >
            <p className="mb-2 text-xs font-semibold tracking-[.18em] text-[#927a9c] uppercase">
              Browse by celebration
            </p>
            <EventCategoryChips availableSlugs={availableCategories} />
          </section>
        )}
        <section className="mx-auto max-w-7xl px-4 pt-7 pb-10 sm:px-6 md:pt-10 lg:px-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-[25px] md:text-3xl">Featured designs</h2>
              <p className="mt-1 text-xs text-[#806b8c]">
                Preview a style to see the full invitation.
              </p>
            </div>
            <Link
              href="/themes"
              className="flex min-h-11 shrink-0 items-center gap-1 text-xs font-semibold text-[#76508c]"
            >
              View all {themeCards.length} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {themeCards.slice(0, 8).map((theme) => (
              <TemplateMarketplaceCard key={theme.id} theme={theme} />
            ))}
          </div>
        </section>
        <section
          className="border-t border-violet-200/60 bg-white/60 px-4 py-6"
          aria-label="Create your invitation"
        >
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Gem, title: "Choose" },
              { icon: WandSparkles, title: "Personalize" },
              { icon: Sparkles, title: "Share" },
            ].map(({ icon: Icon, title }, index) => (
              <div
                key={title}
                className="rounded-2xl border border-violet-100 bg-white/80 px-2 py-4"
              >
                <span className="wedding-gold mx-auto grid size-10 place-items-center rounded-full">
                  <Icon className="size-4" />
                </span>
                <p className="font-display mt-2 text-sm">{title}</p>
                <span className="text-[9px] text-[#927a9c]">0{index + 1}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
