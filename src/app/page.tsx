import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Gem, Sparkles, WandSparkles } from "lucide-react";

import { db } from "@/lib/db";
import {
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/config/site";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { PublicMarketplaceHeader } from "@/components/marketing/public-marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TemplateMarketplaceCard } from "@/components/marketing/template-marketplace-card";
import { AnimatedInvitationShowcase } from "@/components/marketing/animated-invitation-showcase";
import { WeddingAmbientEffects } from "@/components/marketing/wedding-ambient-effects";
import { FALLBACK_THEMES, fallbackThumbnailFor } from "@/lib/marketing-fallbacks";

const TITLE = `${SITE_NAME} — Royal Digital Wedding Invitations`;

export const metadata: Metadata = {
  title: TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [SITE_LOGO_PATH],
    type: "website",
  },
};

export default async function Home() {
  const [themes, demos] = await Promise.all([
    db.theme
      .findMany({
        where: { type: "WEBSITE" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 12,
      })
      .catch(() => []),
    db.invitation
      .findMany({
        where: { isDemo: true, status: "PUBLISHED" },
        take: 24,
        select: { slug: true, themeId: true },
        orderBy: { createdAt: "asc" },
      })
      .catch(() => []),
  ]);

  const demoSlugByThemeId = new Map(demos.map((demo) => [demo.themeId, demo.slug]));
  const themeCards =
    themes.length > 0
      ? themes.map((theme) => ({
          id: theme.id,
          name: theme.name,
          slug: theme.slug,
          category: theme.category,
          eventCategory: theme.eventCategory,
          isPremium: theme.isPremium,
          previewImage: theme.previewImage ?? fallbackThumbnailFor(theme.slug),
          demoSlug: demoSlugByThemeId.get(theme.id) ?? null,
        }))
      : FALLBACK_THEMES.map((theme) => ({
          ...theme,
          eventCategory: "wedding",
          demoSlug: null as string | null,
        }));

  const heroThemes = themeCards.slice(0, 5);

  return (
    <div className="min-h-svh bg-[#f8f1e4] text-[#2f2a25]">
      <PublicMarketplaceHeader />

      <main>
        <section className="royal-hero min-h-[78svh] overflow-hidden">
          <div className="royal-dust pointer-events-none absolute inset-0 opacity-55" />
          <WeddingAmbientEffects variant="browser" className="opacity-35" />
          <div className="royal-orbit royal-orbit-a" />
          <div className="royal-orbit royal-orbit-b" />
          <div className="royal-corner royal-corner-tl" />
          <div className="royal-corner royal-corner-br" />
          <div className="royal-hero-glow left-[8%] top-[14%] size-56 bg-[#c89d4d]/24" />
          <div className="royal-hero-glow right-[6%] top-[18%] size-64 bg-[#6e4338]/20 [animation-delay:-3s]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-4 pb-10 pt-8 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:gap-x-8 md:gap-y-4 md:py-16 lg:px-10 lg:py-20">
            <div className="relative z-10 text-center md:col-start-1 md:row-start-1 md:max-w-xl md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d6af66]/30 bg-white/[0.045] px-3.5 py-2 text-[9px] font-bold tracking-[0.18em] text-[#d9b96f] uppercase shadow-[0_10px_30px_rgba(0,0,0,.14)] backdrop-blur sm:text-[10px]">
                <Gem className="size-3.5" />
                SK Digital Signature Invitations
              </div>

              <p className="font-script mt-5 text-4xl text-[#d9b46a] sm:mt-6 sm:text-5xl">
                Shaadi, styled with grace
              </p>
              <h1 className="font-display royal-title-light mx-auto mt-1 max-w-[380px] text-[2.75rem] leading-[0.92] sm:max-w-none sm:text-6xl md:mx-0 lg:text-7xl">
                Royal invitations that feel alive.
              </h1>
              <p className="mx-auto mt-4 max-w-[330px] text-[13px] leading-6 text-[#d8c9ac]/78 sm:max-w-md sm:text-base md:mx-0">
                Elegant motion, music and meaningful details—crafted into one beautiful invitation.
              </p>
            </div>

            <div className="relative z-10 md:col-start-2 md:row-span-2 md:row-start-1">
              <AnimatedInvitationShowcase themes={heroThemes} />
            </div>

            <div className="relative z-10 mt-1 md:col-start-1 md:row-start-2 md:mt-0 md:max-w-xl">
              <div className="mx-auto grid max-w-[370px] grid-cols-2 gap-2.5 md:mx-0 md:flex md:max-w-none md:flex-wrap md:gap-3">
                <Link
                  href="/themes"
                  className="royal-gold-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[10px] font-black tracking-[0.08em] uppercase sm:px-6 sm:text-xs"
                >
                  Explore designs
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="royal-glass-dark inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[10px] font-bold transition hover:-translate-y-0.5 hover:border-[#d5ad63]/45 sm:px-5 sm:text-xs"
                >
                  <Sparkles className="size-4 text-[#d7b56f]" />
                  My invitations
                </Link>
              </div>

              <div className="mx-auto mt-5 max-w-[390px] md:mx-0 md:mt-7 md:max-w-2xl">
                <EventCategoryChips />
              </div>
            </div>
          </div>
        </section>

        <section className="royal-section relative border-y border-[#c5a15a]/22">
          <div className="royal-dust pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:px-10">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold tracking-[0.22em] text-[#a87f3e] uppercase">
                  Signature collections
                </p>
                <h2 className="font-display royal-title-dark mt-1 text-3xl sm:text-4xl">
                  Curated for every celebration
                </h2>
              </div>
              <Link
                href="/themes"
                className="hidden items-center gap-1.5 rounded-full border border-[#bf9850]/35 bg-[#fffaf0]/78 px-4 py-2 text-[10px] font-black tracking-wide text-[#5d4a2c] uppercase shadow-sm transition hover:-translate-y-0.5 hover:border-[#b98d3e]/55 sm:inline-flex"
              >
                All designs <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
              {themeCards.map((theme) => (
                <TemplateMarketplaceCard key={theme.id} theme={theme} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/themes"
                className="royal-gold-button inline-flex items-center gap-2 rounded-full px-6 py-3 text-[10px] font-black uppercase"
              >
                See all designs <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#211f1c] px-5 py-14 text-[#eadfc8] sm:px-8 lg:px-10">
          <div className="royal-dust pointer-events-none absolute inset-0 opacity-35" />
          <div className="royal-orbit royal-orbit-a opacity-50" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-7 text-center">
              <p className="royal-kicker text-[9px] font-bold">Simple to create</p>
              <h2 className="font-display royal-title-light mt-2 text-3xl sm:text-4xl">
                Your celebration, beautifully digital.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Moment icon={<Gem className="size-6" />} title="Choose" note="A design with your vibe" />
              <Moment icon={<WandSparkles className="size-6" />} title="Personalize" note="Names, photos, moments" />
              <Moment icon={<Sparkles className="size-6" />} title="Share" note="One elegant invitation link" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Moment({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="royal-glass-dark rounded-[1.8rem] px-5 py-6 text-center transition duration-300 hover:-translate-y-1">
      <div className="wedding-gold mx-auto grid size-12 place-items-center rounded-full shadow-[0_12px_28px_rgba(190,148,68,.2)]">
        {icon}
      </div>
      <p className="font-display mt-4 text-xl text-[#f2dfb8]">{title}</p>
      <p className="mt-1 text-xs font-semibold text-[#cdbd9f]/72">{note}</p>
    </div>
  );
}
