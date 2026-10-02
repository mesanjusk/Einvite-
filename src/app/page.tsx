import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Heart, Sparkles, WandSparkles } from "lucide-react";

import { db } from "@/lib/db";
import { SITE_NAME } from "@/config/site";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { PublicMarketplaceHeader } from "@/components/marketing/public-marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TemplateMarketplaceCard } from "@/components/marketing/template-marketplace-card";
import { AnimatedInvitationShowcase } from "@/components/marketing/animated-invitation-showcase";
import { FALLBACK_THEMES, fallbackThumbnailFor } from "@/lib/marketing-fallbacks";

const TITLE = `${SITE_NAME} — Wedding Invitations That Feel Alive`;
const DESCRIPTION =
  "Vibrant, animated digital invitations for weddings and celebrations.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    images: ["/favicon.ico"],
    type: "website",
  },
};

export default async function Home() {
  const [themes, demos] = await Promise.all([
    db.theme
      .findMany({ where: { type: "WEBSITE" }, orderBy: { sortOrder: "asc" }, take: 8 })
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
    <div className="wedding-shell min-h-svh text-[#4d2530]">
      <PublicMarketplaceHeader />

      <main>
        <section className="relative min-h-[78svh] overflow-hidden">
          <div className="wedding-pattern pointer-events-none absolute inset-0 opacity-45" />
          <div className="wedding-orb left-[4%] top-[10%] size-44 bg-[#f3a92f]/35" />
          <div className="wedding-orb right-[8%] top-[16%] size-56 bg-[#d92f68]/26" />
          <div className="wedding-orb bottom-[8%] left-[36%] size-36 bg-[#0f9b8a]/18" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-4 pb-10 pt-8 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:gap-x-8 md:gap-y-4 md:py-16 lg:px-10 lg:py-20">
            <div className="relative z-10 text-center md:col-start-1 md:row-start-1 md:max-w-xl md:text-left">
              <div className="wedding-badge inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[9px] font-black tracking-[0.13em] uppercase sm:text-[10px]">
                <Sparkles className="size-3.5" />
                Made for big celebrations
              </div>

              <p className="font-script mt-4 text-4xl text-[#d07b1f] sm:mt-6 sm:text-5xl">
                Shaadi starts here
              </p>
              <h1 className="font-display wedding-title mx-auto mt-1 max-w-[360px] text-[2.8rem] leading-[0.9] sm:max-w-none sm:text-6xl md:mx-0 lg:text-7xl">
                Invitations that feel alive.
              </h1>
              <p className="mx-auto mt-4 max-w-[320px] text-[13px] leading-5 text-[#7c5454] sm:max-w-md sm:text-base sm:leading-6 md:mx-0">
                Pick a vibe. Add your story. Send a celebration.
              </p>
            </div>

            <div className="relative z-10 md:col-start-2 md:row-span-2 md:row-start-1">
              <AnimatedInvitationShowcase themes={heroThemes} />
            </div>

            <div className="relative z-10 mt-1 md:col-start-1 md:row-start-2 md:mt-0 md:max-w-xl">
              <div className="mx-auto grid max-w-[370px] grid-cols-2 gap-2.5 md:mx-0 md:flex md:max-w-none md:flex-wrap md:gap-3">
                <Link
                  href="/themes"
                  className="wedding-cta inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[10px] font-black tracking-[0.07em] uppercase transition sm:px-6 sm:text-xs"
                >
                  Explore designs
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="wedding-glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-[10px] font-bold text-[#7b2b3c] transition hover:-translate-y-0.5 sm:px-5 sm:text-xs"
                >
                  <Heart className="size-4 fill-[#f2a2b1] text-[#b62350]" />
                  My invites
                </Link>
              </div>

              <div className="mx-auto mt-5 max-w-[390px] md:mx-0 md:mt-7 md:max-w-2xl">
                <EventCategoryChips />
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-[#efc879]/35 bg-white/45">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:px-10">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="font-script text-3xl text-[#d07b1f]">Pick your vibe</p>
                <h2 className="font-display text-3xl text-[#681d35] sm:text-4xl">
                  Made to feel special
                </h2>
              </div>
              <Link
                href="/themes"
                className="hidden items-center gap-1.5 rounded-full border border-[#dfb561]/45 bg-white/75 px-4 py-2 text-[10px] font-black tracking-wide text-[#8f1537] uppercase shadow-sm sm:inline-flex"
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
                className="wedding-cta inline-flex items-center gap-2 rounded-full px-6 py-3 text-[10px] font-black uppercase"
              >
                See all designs <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-12 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#ffd98a33,transparent_55%)]" />
          <div className="relative mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
            <Moment icon={<Heart className="size-6" />} title="Choose" note="A vibe you love" />
            <Moment icon={<WandSparkles className="size-6" />} title="Make it yours" note="Names, photos, moments" />
            <Moment icon={<Sparkles className="size-6" />} title="Share" note="One beautiful link" />
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
    <div className="wedding-card rounded-[1.8rem] px-5 py-6 text-center">
      <div className="wedding-gold mx-auto grid size-12 place-items-center rounded-full shadow-lg">
        {icon}
      </div>
      <p className="font-display mt-4 text-xl text-[#642236]">{title}</p>
      <p className="mt-1 text-xs font-semibold text-[#8d655b]">{note}</p>
    </div>
  );
}
