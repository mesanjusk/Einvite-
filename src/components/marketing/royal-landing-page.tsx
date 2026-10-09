import Link from "next/link";
import { ArrowRight, Gem, Sparkles, WandSparkles } from "lucide-react";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { PublicMarketplaceHeader } from "@/components/marketing/public-marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TemplateMarketplaceCard, type MarketplaceThemeCard } from "@/components/marketing/template-marketplace-card";
import { AnimatedInvitationShowcase } from "@/components/marketing/animated-invitation-showcase";
import { WeddingAmbientEffects } from "@/components/marketing/wedding-ambient-effects";
export function RoyalLandingPage({ themeCards }: { themeCards: MarketplaceThemeCard[] }) {
  return (
    <div className="lavender-wedding-surface min-h-svh text-[#4b3659]">
      <PublicMarketplaceHeader />
      <main>
        <section className="royal-landing-hero relative overflow-hidden px-4 pt-6 pb-5 text-center">
          <WeddingAmbientEffects variant="browser" className="opacity-25" />
          <div className="royal-corner royal-corner-tl" />
          <div className="royal-corner royal-corner-br" />
          <div className="relative z-10">
            <p className="text-[9px] font-semibold uppercase tracking-[.25em] text-[#927a9c]">Made for your celebration</p>
            <h1 className="font-display mx-auto mt-2 max-w-[300px] text-[34px] leading-[1.08]">An invitation<br /><span className="font-script text-[46px] text-[#76508c]">to remember</span></h1>
            <p className="mt-2 text-xs text-[#806b8c]">Choose. Make it yours. Share the joy.</p>
            {themeCards.length > 0 ? <AnimatedInvitationShowcase themes={themeCards.slice(0, 3)} /> : (
              <div className="my-8 rounded-[2rem] border border-violet-200 bg-white/70 px-6 py-12">
                <Sparkles className="mx-auto size-8 text-[#a987bd]" />
                <h2 className="font-display mt-4 text-xl">New designs are on their way</h2>
              </div>
            )}
            <Link href="/themes" className="royal-gold-button inline-flex min-h-11 items-center gap-2 rounded-full px-7 py-3 text-xs font-bold">Explore designs <ArrowRight className="size-4" /></Link>
          </div>
        </section>
        <section className="px-4 py-4" aria-label="Celebrations"><EventCategoryChips /></section>
        <section className="px-4 pb-7 pt-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-[25px]">Find your style</h2>
            <Link href="/themes" className="flex min-h-11 items-center gap-1 text-xs font-semibold text-[#76508c]">View all <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {themeCards.slice(0, 6).map((theme) => <TemplateMarketplaceCard key={theme.id} theme={theme} />)}
          </div>
        </section>
        <section className="border-t border-violet-200/60 bg-white/60 px-4 py-6" aria-label="Create your invitation">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[{ icon: Gem, title: "Choose" }, { icon: WandSparkles, title: "Personalize" }, { icon: Sparkles, title: "Share" }].map(({ icon: Icon, title }, index) => (
              <div key={title} className="rounded-2xl border border-violet-100 bg-white/80 px-2 py-4">
                <span className="wedding-gold mx-auto grid size-10 place-items-center rounded-full"><Icon className="size-4" /></span>
                <p className="font-display mt-2 text-sm">{title}</p><span className="text-[9px] text-[#927a9c]">0{index + 1}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
