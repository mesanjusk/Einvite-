import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SITE_NAME } from "@/config/site";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { PublicMarketplaceHeader } from "@/components/marketing/public-marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TemplateMarketplaceCard } from "@/components/marketing/template-marketplace-card";
import { FALLBACK_THEMES, fallbackThumbnailFor } from "@/lib/marketing-fallbacks";

const TITLE = `${SITE_NAME} — Premium Digital Invitations`;
const DESCRIPTION =
  "Browse premium invitation designs, preview them live, then edit your chosen invitation directly on screen.";

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

  return (
    <div className="min-h-svh bg-[#fffdf8] text-[#3f302d]">
      <PublicMarketplaceHeader />

      <main>
        <section className="relative overflow-hidden border-b border-[#eee5dc] bg-[#fffaf2]">
          <div className="pointer-events-none absolute -left-28 -top-24 size-72 rounded-full bg-[#f5d9cb]/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-10 size-64 rounded-full bg-[#f0dfad]/30 blur-3xl" />

          <div className="relative mx-auto max-w-5xl px-5 pb-8 pt-9 text-center sm:px-8 sm:pb-11 sm:pt-12">
            <p className="text-[9px] font-extrabold tracking-[0.26em] text-[#9b755e] uppercase sm:text-[10px]">
              Premium digital invitations
            </p>
            <h1 className="font-display mx-auto mt-3 max-w-3xl text-[2.35rem] leading-[0.98] text-[#592b35] sm:text-6xl">
              Explore Our
              <span className="block italic text-[#7b2942]">Invitation Templates</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[13px] leading-6 text-[#806b63] sm:text-sm">
              Choose your celebration, preview the invitation exactly as guests will see it,
              then edit that design live.
            </p>

            <div id="categories" className="mx-auto mt-7 max-w-3xl text-left">
              <p className="mb-2 text-center text-[9px] font-extrabold tracking-[0.18em] text-[#8e776d] uppercase">
                Select invitation category
              </p>
              <div className="rounded-3xl border border-[#eadfd5] bg-white/90 p-2.5 shadow-[0_10px_35px_rgba(92,51,55,0.05)]">
                <EventCategoryChips />
              </div>
            </div>

            <form
              action="/themes"
              method="get"
              className="mx-auto mt-4 flex max-w-3xl items-center gap-2 rounded-full border border-[#eadfd5] bg-white px-4 py-1.5 shadow-[0_10px_35px_rgba(92,51,55,0.05)]"
            >
              <span className="text-[#b09b91]" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                name="q"
                placeholder="Search templates by style or name..."
                className="min-w-0 flex-1 bg-transparent py-2 text-xs text-[#4f403b] outline-none placeholder:text-[#b4a39a] sm:text-sm"
              />
              <button
                type="submit"
                className="rounded-full bg-[#65172e] px-4 py-2 text-[9px] font-extrabold tracking-[0.12em] text-white uppercase sm:text-[10px]"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10 lg:px-10">
          <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7">
            <div>
              <p className="text-[9px] font-extrabold tracking-[0.2em] text-[#a17b63] uppercase sm:text-[10px]">
                Curated collection
              </p>
              <h2 className="font-display mt-1 text-2xl text-[#592b35] sm:text-3xl">
                Popular templates
              </h2>
            </div>
            <Link
              href="/themes"
              className="rounded-full border border-[#dccdc4] bg-white px-3.5 py-2 text-[9px] font-extrabold tracking-wide text-[#65172e] uppercase sm:text-[10px]"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-6 sm:gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {themeCards.map((theme) => (
              <TemplateMarketplaceCard key={theme.id} theme={theme} />
            ))}
          </div>
        </section>

        <section className="border-y border-[#eee4db] bg-[#fff8ee]">
          <div className="mx-auto grid max-w-5xl gap-3 px-5 py-7 text-center sm:grid-cols-3 sm:px-8 sm:py-9">
            <MarketplaceStep number="01" title="Choose" text="Pick a celebration and a design." />
            <MarketplaceStep number="02" title="Preview" text="Open the real mobile invitation." />
            <MarketplaceStep number="03" title="Edit live" text="Tap names, dates, photos and events." />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function MarketplaceStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfd5] bg-white px-4 py-4 shadow-[0_8px_25px_rgba(94,45,54,0.04)]">
      <p className="text-[9px] font-extrabold tracking-[0.18em] text-[#b18467]">{number}</p>
      <p className="font-display mt-1 text-lg text-[#5e2d37]">{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-[#8b756d]">{text}</p>
    </div>
  );
}
