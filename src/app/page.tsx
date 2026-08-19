import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Globe, Video } from "lucide-react";

import { db } from "@/lib/db";
import { SITE_NAME } from "@/config/site";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { InstagramBanner } from "@/components/marketing/instagram-banner";
import { SiteFooter } from "@/components/marketing/site-footer";
import {
  FALLBACK_SLIDES,
  FALLBACK_THEMES,
  fallbackThumbnailFor,
} from "@/lib/marketing-fallbacks";

const TITLE = `${SITE_NAME} — AI-Generated Wedding Invitations`;
const DESCRIPTION =
  "Answer a few questions and get a premium, animated wedding invitation website — envelope reveal, countdown, RSVP, and more — live in minutes.";

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

const FORMATS = [
  { label: "Video", icon: Video, href: "/create" },
  { label: "PDF", icon: FileText, href: "/create" },
  { label: "eInvite", icon: Globe, href: "/create" },
];

type Palette = { primary: string; accent: string; background: string };

export default async function Home() {
  const [themes, demos] = await Promise.all([
    db.theme
      .findMany({ where: { type: "WEBSITE" }, orderBy: { sortOrder: "asc" }, take: 8 })
      .catch(() => []),
    db.invitation
      .findMany({
        where: { isDemo: true, status: "PUBLISHED" },
        take: 4,
        include: { theme: true },
        orderBy: { createdAt: "asc" },
      })
      .catch(() => []),
  ]);

  // Real published demos make the best carousel; when there are none (a fresh
  // deploy, or the database is unreachable) the themes carry it instead so the
  // page never opens on an empty frame.
  const demoSlides = demos.map((demo) => {
    const palette = demo.theme?.colorPalette as Palette | undefined;
    return {
      id: demo.id,
      eyebrow: "Live invitation",
      title: `${demo.brideName} & ${demo.groomName}`,
      href: `/invite/${demo.slug}`,
      cta: "View invitation",
      primary: palette?.primary ?? "#7a2e2e",
      accent: palette?.accent ?? "#c9942a",
      background: palette?.background ?? "#faf3ea",
      image: demo.theme?.previewImage ?? fallbackThumbnailFor(demo.slug),
    };
  });

  // Placeholder slides and themes only stand in while the database has
  // nothing published yet, so a fresh deploy still looks like a shop.
  const slides = demoSlides.length > 0 ? demoSlides : FALLBACK_SLIDES;

  const themeCards =
    themes.length > 0
      ? themes.map((theme) => {
          const palette = theme.colorPalette as Palette;
          return {
            id: theme.id,
            name: theme.name,
            slug: theme.slug,
            category: theme.category,
            isPremium: theme.isPremium,
            previewImage: theme.previewImage ?? fallbackThumbnailFor(theme.slug),
            colorPalette: palette,
          };
        })
      : FALLBACK_THEMES;

  return (
    <div className="flex min-h-svh flex-col">
      <InstagramBanner />

      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <SiteLogo size="lg" />
        <Button asChild>
          <Link href="/create">Get started</Link>
        </Button>
      </header>

      <main className="flex-1">
        {slides.length > 0 ? (
          <HeroCarousel slides={slides} />
        ) : (
          <section className="px-6 py-16 text-center">
            <h1 className="font-display mx-auto max-w-2xl text-4xl leading-tight text-balance sm:text-5xl">
              Your wedding invite, designed in{" "}
              <span className="text-primary">minutes, not months</span>
            </h1>
          </section>
        )}

        <section className="mx-auto max-w-5xl px-6 py-12">
          <EventCategoryChips />
        </section>

        {themeCards.length > 0 && (
          <section className="mx-auto max-w-5xl px-6 pb-14">
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl sm:text-3xl">Themes</h2>
              <Link
                href="/themes"
                className="text-primary text-sm underline underline-offset-4"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {themeCards.map((theme) => {
                const palette = theme.colorPalette;
                return (
                  <Link
                    key={theme.id}
                    href={`/create?theme=${theme.slug}`}
                    className="group focus-visible:ring-primary hover:border-primary/60 overflow-hidden rounded-xl border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {/* The gradient always sits underneath, so a thumbnail that
                        fails to load degrades to the theme's colours rather
                        than a broken-image icon. */}
                    <div
                      className="relative flex aspect-[4/3] items-end overflow-hidden sm:aspect-[16/10]"
                      style={{
                        background: `linear-gradient(140deg, ${palette.primary}, ${palette.accent})`,
                      }}
                    >
                      {theme.previewImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={theme.previewImage}
                          alt=""
                          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      {theme.isPremium && (
                        <span className="absolute top-2.5 right-2.5 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
                          Premium
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{theme.name}</p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {theme.category}
                        </p>
                      </div>
                      <span className="text-primary shrink-0 text-xs font-semibold">Free</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="bg-muted/40 border-y px-6 py-10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-4 text-center sm:justify-between sm:text-left">
            <h2 className="font-display text-2xl sm:text-3xl">Ready to send the invite?</h2>
            <Button size="lg" asChild>
              <Link href="/create">Start for free</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14">
          <div className="flex flex-wrap items-start justify-center gap-10 sm:gap-16">
            {FORMATS.map((format) => (
              <Link
                key={format.label}
                href={format.href}
                className="group focus-visible:ring-primary flex flex-col items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="border-primary/25 bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-20 items-center justify-center rounded-full border transition-all group-hover:scale-105 sm:size-24">
                  <format.icon className="size-8" strokeWidth={1.5} />
                </span>
                <span className="text-sm font-medium">{format.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
