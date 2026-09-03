import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SITE_NAME } from "@/config/site";
import { SiteLogo } from "@/components/brand/site-logo";
import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { SiteFooter } from "@/components/marketing/site-footer";
import {
  FALLBACK_SLIDES,
  FALLBACK_THEMES,
  fallbackThumbnailFor,
} from "@/lib/marketing-fallbacks";

const TITLE = `${SITE_NAME} — Premium Digital Invitations`;
const DESCRIPTION =
  "Create premium animated invitation websites with beautiful themes, event details, RSVP, photos and instant sharing.";

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

type Palette = { primary: string; accent: string; background: string };

export default async function Home() {
  const [themes, demos] = await Promise.all([
    db.theme
      .findMany({ where: { type: "WEBSITE" }, orderBy: { sortOrder: "asc" }, take: 8 })
      .catch(() => []),
    db.invitation
      .findMany({
        where: { isDemo: true, status: "PUBLISHED" },
        take: 8,
        include: { theme: true },
        orderBy: { createdAt: "asc" },
      })
      .catch(() => []),
  ]);

  const demoSlides = demos.slice(0, 4).map((demo) => {
    const palette = demo.theme?.colorPalette as Palette | undefined;
    return {
      id: demo.id,
      eyebrow: "Live invitation",
      title: `${demo.brideName} & ${demo.groomName}`,
      href: `/invite/${demo.slug}`,
      cta: "View invitation",
      primary: palette?.primary ?? "#651d33",
      accent: palette?.accent ?? "#d8b16c",
      background: palette?.background ?? "#fff9f0",
      image: demo.theme?.previewImage ?? fallbackThumbnailFor(demo.slug),
    };
  });

  const slides = demoSlides.length > 0 ? demoSlides : FALLBACK_SLIDES;
  const demoSlugByThemeId = new Map(demos.map((demo) => [demo.themeId, demo.slug]));

  const themeCards =
    themes.length > 0
      ? themes.map((theme) => ({
          id: theme.id,
          name: theme.name,
          slug: theme.slug,
          category: theme.category,
          isPremium: theme.isPremium,
          previewImage: theme.previewImage ?? fallbackThumbnailFor(theme.slug),
          colorPalette: theme.colorPalette as Palette,
          demoSlug: demoSlugByThemeId.get(theme.id) ?? null,
        }))
      : FALLBACK_THEMES.map((theme) => ({ ...theme, demoSlug: null as string | null }));

  return (
    <div className="min-h-svh bg-[#fffdf9] text-[#342a27]">
      <header className="sticky top-0 z-50 border-b border-[#eadfd3] bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label={`${SITE_NAME} home`}>
            <SiteLogo size="md" />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#6f5b54] md:flex">
            <Link href="/themes" className="transition hover:text-[#651d33]">
              Templates
            </Link>
            <Link href="/create" className="transition hover:text-[#651d33]">
              Create
            </Link>
            <Link href="/dashboard" className="transition hover:text-[#651d33]">
              My invitations
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/themes"
              className="hidden rounded-full border border-[#ddcfc2] px-4 py-2 text-xs font-semibold text-[#651d33] transition hover:border-[#651d33]/40 sm:inline-flex"
            >
              Browse designs
            </Link>
            <Link
              href="/create"
              className="rounded-full bg-[#651d33] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#54172a]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <HeroCarousel slides={slides} />

        <section className="border-b border-[#eee4db] bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-[#eee4db] px-4 py-5 sm:px-8">
            <FeatureStat value="Beautiful" label="mobile-first designs" />
            <FeatureStat value="Interactive" label="events, RSVP & gallery" />
            <FeatureStat value="Instant" label="shareable invitation link" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="mb-5 text-center">
            <p className="text-[10px] font-semibold tracking-[0.24em] text-[#9a6c48] uppercase">
              Find your style
            </p>
            <h2 className="font-display mt-2 text-3xl text-[#5d2032] sm:text-4xl">
              Invitations for every celebration
            </h2>
          </div>
          <div className="rounded-3xl border border-[#eadfd3] bg-[#fff9f0] p-4 sm:p-5">
            <EventCategoryChips />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-8 lg:px-10">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.24em] text-[#9a6c48] uppercase">
                Curated collection
              </p>
              <h2 className="font-display mt-1 text-3xl text-[#5d2032] sm:text-4xl">
                Popular invitation themes
              </h2>
            </div>
            <Link
              href="/themes"
              className="shrink-0 text-sm font-semibold text-[#651d33] underline decoration-[#caa899] underline-offset-4"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {themeCards.map((theme) => (
              <article
                key={theme.id}
                className="group overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-[0_10px_35px_rgba(93,32,50,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(93,32,50,0.11)]"
              >
                <div
                  className="relative aspect-[3/4] overflow-hidden bg-[#f4ece3]"
                  style={{
                    background: `linear-gradient(145deg, ${theme.colorPalette.background}, ${theme.colorPalette.accent})`,
                  }}
                >
                  {theme.previewImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={theme.previewImage}
                      alt={`${theme.name} invitation theme preview`}
                      className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.035]"
                    />
                  )}
                  <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#651d33] uppercase shadow-sm backdrop-blur">
                      {theme.isPremium ? "Premium" : "Popular"}
                    </span>
                    <span className="rounded-full bg-black/35 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur">
                      Website
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <p className="truncate font-display text-base text-[#4e2630] sm:text-lg">
                    {theme.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-medium text-[#8b756c] capitalize sm:text-xs">
                      {theme.category}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-[#651d33] sm:text-xs">
                      {theme.isPremium ? "Premium" : "Included"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {theme.demoSlug ? (
                      <Link
                        href={`/invite/${theme.demoSlug}`}
                        className="rounded-full border border-[#d8c8bc] px-3 py-2 text-center text-[10px] font-bold tracking-wide text-[#651d33] uppercase transition hover:border-[#651d33]/50 hover:bg-[#fff9f0] sm:text-xs"
                      >
                        See live preview
                      </Link>
                    ) : (
                      <Link
                        href={`/create?theme=${theme.slug}`}
                        className="rounded-full border border-[#d8c8bc] px-3 py-2 text-center text-[10px] font-bold tracking-wide text-[#651d33] uppercase transition hover:border-[#651d33]/50 hover:bg-[#fff9f0] sm:text-xs"
                      >
                        Preview design
                      </Link>
                    )}
                    <Link
                      href={`/create?theme=${theme.slug}`}
                      className="rounded-full bg-[#651d33] px-3 py-2 text-center text-[10px] font-bold tracking-wide text-white uppercase transition hover:bg-[#54172a] sm:text-xs"
                    >
                      Use this theme
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[#eadfd3] bg-[#651d33]">
          <div className="mx-auto grid max-w-6xl items-center gap-7 px-5 py-12 text-white sm:px-8 md:grid-cols-[1fr_auto] lg:px-10">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.24em] text-[#e6c98e] uppercase">
                Your story, beautifully presented
              </p>
              <h2 className="font-display mt-2 max-w-2xl text-3xl leading-tight sm:text-4xl">
                Turn your celebration into an invitation guests remember.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                Start with a theme, personalize every important detail and publish a polished
                mobile invitation link when you are ready.
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex rounded-full bg-[#e1bd72] px-7 py-3 text-sm font-bold text-[#4c1627] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#efcc82]"
            >
              Create invitation →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FeatureStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 text-center sm:px-5">
      <p className="font-display text-sm text-[#651d33] sm:text-xl">{value}</p>
      <p className="mt-1 text-[9px] leading-tight text-[#8b756c] sm:text-xs">{label}</p>
    </div>
  );
}
