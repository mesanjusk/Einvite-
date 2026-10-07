import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SITE_NAME } from "@/config/site";
import { PublicMarketplaceHeader } from "@/components/marketing/public-marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TemplateMarketplaceCard } from "@/components/marketing/template-marketplace-card";
import { MobileTemplateSpotlight } from "@/components/marketing/animated-invitation-showcase";
import { WeddingAmbientEffects } from "@/components/marketing/wedding-ambient-effects";
import { categoryIcon } from "@/components/marketing/category-icon";
import {
  EVENT_CATEGORIES,
  eventCategoryFor,
  isEventCategorySlug,
} from "@/lib/event-categories";
import { fallbackThumbnailFor } from "@/lib/marketing-fallbacks";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Royal Invitation Designs · ${SITE_NAME}`,
  description:
    "Explore premium animated wedding invitation designs by SK Digital, preview them live, and personalize your chosen experience.",
};

type SortMode = "popular" | "newest" | "premium" | "name";

export default async function PublicThemesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    style?: string;
    sort?: string;
    tier?: string;
  }>;
}) {
  const {
    category: categoryParam,
    q: rawQuery,
    style: rawStyle,
    sort: rawSort,
    tier: rawTier,
  } = await searchParams;

  const activeSlug = isEventCategorySlug(categoryParam) ? categoryParam : null;
  const query = rawQuery?.trim().toLowerCase() ?? "";
  const sort: SortMode =
    rawSort === "newest" || rawSort === "premium" || rawSort === "name"
      ? rawSort
      : "popular";
  const tier = rawTier === "premium" ? "premium" : "all";

  const [baseThemes, demos] = await Promise.all([
    db.theme
      .findMany({
        where: activeSlug
          ? {
              OR: [
                { eventCategory: activeSlug },
                { eventCategories: { has: activeSlug } },
              ],
            }
          : {},
        orderBy: { sortOrder: "asc" },
      })
      .catch(() => []),
    db.invitation
      .findMany({
        where: { isDemo: true, status: "PUBLISHED" },
        select: { slug: true, themeId: true },
      })
      .catch(() => []),
  ]);

  const styleOptions = [...new Set(baseThemes.map((theme) => theme.category).filter(Boolean))];
  const activeStyle = rawStyle && styleOptions.includes(rawStyle) ? rawStyle : null;

  let themes = baseThemes.filter((theme) => {
    if (tier === "premium" && !theme.isPremium) return false;
    if (activeStyle && theme.category !== activeStyle) return false;
    if (!query) return true;
    return [
      theme.name,
      theme.slug,
      theme.description ?? "",
      theme.category,
      theme.eventCategory,
      ...(theme.eventCategories ?? []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  themes = [...themes].sort((a, b) => {
    if (sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
    if (sort === "premium") {
      const premiumDiff = Number(b.isPremium) - Number(a.isPremium);
      return premiumDiff || a.sortOrder - b.sortOrder;
    }
    if (sort === "name") return a.name.localeCompare(b.name);
    return a.sortOrder - b.sortOrder;
  });

  const demoSlugByThemeId = new Map(demos.map((demo) => [demo.themeId, demo.slug]));
  const mobilePreviewThemes = themes.slice(0, 5).map((theme) => ({
    id: theme.id,
    name: theme.name,
    previewImage: theme.previewImage ?? fallbackThumbnailFor(theme.slug),
    demoSlug: demoSlugByThemeId.get(theme.id) ?? null,
  }));
  const headingCategory = activeSlug ? eventCategoryFor(activeSlug).label : null;

  const hrefFor = (changes: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams();
    if (activeSlug) params.set("category", activeSlug);
    if (rawQuery) params.set("q", rawQuery);
    if (activeStyle) params.set("style", activeStyle);
    if (sort !== "popular") params.set("sort", sort);
    if (tier !== "all") params.set("tier", tier);

    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    const suffix = params.toString();
    return suffix ? `/themes?${suffix}` : "/themes";
  };

  return (
    <div className="min-h-svh bg-white text-[#4b3659]">
      <PublicMarketplaceHeader />

      <main>
        <section className="royal-hero relative overflow-hidden border-b border-violet-200/70">
          <div className="royal-dust pointer-events-none absolute inset-0 opacity-55" />
          <WeddingAmbientEffects variant="browser" className="opacity-30" />
          <div className="royal-orbit royal-orbit-a" />
          <div className="royal-orbit royal-orbit-b" />
          <div className="royal-corner royal-corner-tl" />
          <div className="royal-corner royal-corner-br" />

          <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-8 text-center sm:px-8 sm:pb-9 sm:pt-11">
            <p className="royal-kicker text-[9px] font-bold">
              SK Digital signature collection
            </p>
            <h1 className="font-display royal-title-light mx-auto mt-2 text-[2.45rem] leading-[0.95] sm:text-5xl">
              Explore {headingCategory ? `${headingCategory} ` : ""}
              <span className="italic">invitation designs</span>
            </h1>

            <div className="mx-auto mt-6 max-w-[430px] text-left">
              <MobileTemplateSpotlight themes={mobilePreviewThemes} />
            </div>

            <p className="mt-5 text-[9px] font-extrabold tracking-[0.18em] text-[#806b8c] uppercase">
              Select collection
            </p>
            <div className="royal-glass-dark mx-auto mt-2 grid max-w-md grid-cols-2 rounded-full p-1.5">
              <Link
                href={hrefFor({ tier: null })}
                className={cn(
                  "rounded-full px-4 py-2.5 text-[9px] font-extrabold tracking-wide uppercase transition sm:text-[10px]",
                  tier === "all"
                    ? "royal-gold-button text-[#4b3659]"
                    : "text-[#765f81] hover:text-[#4b3659]",
                )}
              >
                All designs
              </Link>
              <Link
                href={hrefFor({ tier: "premium" })}
                className={cn(
                  "rounded-full px-4 py-2.5 text-[9px] font-extrabold tracking-wide uppercase transition sm:text-[10px]",
                  tier === "premium"
                    ? "royal-gold-button text-[#4b3659]"
                    : "text-[#765f81] hover:text-[#4b3659]",
                )}
              >
                Premium designs
              </Link>
            </div>

            <p className="mt-5 text-[9px] font-extrabold tracking-[0.18em] text-[#806b8c] uppercase">
              Celebration
            </p>
            <nav className="mx-auto mt-2 flex max-w-3xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip href={hrefFor({ category: null, style: null })} label="All" active={activeSlug === null} />
              {EVENT_CATEGORIES.map((category) => {
                const Icon = categoryIcon(category.icon);
                return (
                  <FilterChip
                    key={category.slug}
                    href={hrefFor({ category: category.slug, style: null })}
                    label={category.label}
                    active={activeSlug === category.slug}
                    icon={<Icon className="size-3.5" strokeWidth={1.7} />}
                  />
                );
              })}
            </nav>

            <form
              className="royal-glass-dark mx-auto mt-4 flex max-w-3xl items-center gap-2 rounded-full px-4 py-1.5"
              action="/themes"
              method="get"
            >
              {activeSlug && <input type="hidden" name="category" value={activeSlug} />}
              {activeStyle && <input type="hidden" name="style" value={activeStyle} />}
              {sort !== "popular" && <input type="hidden" name="sort" value={sort} />}
              {tier !== "all" && <input type="hidden" name="tier" value={tier} />}
              <span className="text-[#927c9d]" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                name="q"
                defaultValue={rawQuery ?? ""}
                placeholder="Search templates by style or name..."
                className="min-w-0 flex-1 bg-transparent py-2 text-xs text-[#4b3659] outline-none placeholder:text-[#a28dab] sm:text-sm"
              />
              <button
                type="submit"
                className="royal-gold-button rounded-full px-4 py-2 text-[9px] font-extrabold tracking-[0.12em] uppercase sm:text-[10px]"
              >
                Search
              </button>
            </form>

            {styleOptions.length > 0 && (
              <nav className="mx-auto mt-4 flex max-w-3xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <StyleChip href={hrefFor({ style: null })} label="All styles" active={!activeStyle} />
                {styleOptions.map((style) => (
                  <StyleChip
                    key={style}
                    href={hrefFor({ style })}
                    label={style}
                    active={activeStyle === style}
                  />
                ))}
              </nav>
            )}
          </div>
        </section>

        <section className="royal-section relative mx-auto max-w-none px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="relative mx-auto mb-5 flex max-w-7xl items-center justify-between gap-3">
            <span className="rounded-full border border-violet-200/80 bg-white px-3 py-1.5 text-[9px] font-extrabold tracking-wide text-[#6a5377] uppercase shadow-sm sm:text-[10px]">
              {themes.length} {themes.length === 1 ? "template" : "templates"}
            </span>

            <details className="group relative">
              <summary className="cursor-pointer list-none rounded-full border border-violet-200/80 bg-white px-3.5 py-1.5 text-[9px] font-extrabold tracking-wide text-[#6a5377] uppercase shadow-sm [&::-webkit-details-marker]:hidden sm:text-[10px]">
                Sort: {sortLabel(sort)} ▾
              </summary>
              <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-2xl border border-violet-200 bg-white p-1.5 text-left shadow-[0_18px_45px_rgba(50,40,27,0.15)]">
                <SortLink href={hrefFor({ sort: null })} label="Popular" active={sort === "popular"} />
                <SortLink href={hrefFor({ sort: "newest" })} label="Newest" active={sort === "newest"} />
                <SortLink href={hrefFor({ sort: "premium" })} label="Premium first" active={sort === "premium"} />
                <SortLink href={hrefFor({ sort: "name" })} label="Name A–Z" active={sort === "name"} />
              </div>
            </details>
          </div>

          <div className="relative mx-auto max-w-7xl">
          {themes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/30 px-6 py-16 text-center">
              <p className="font-display text-2xl text-[#4b3659]">No matching designs yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#806b8c]">
                Try another celebration, style or search term.
              </p>
              <Link
                href="/themes"
                className="mt-5 inline-flex rounded-full royal-gold-button px-5 py-2.5 text-[10px] font-extrabold tracking-wide uppercase"
              >
                Show all templates
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-6 sm:gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {themes.map((theme) => (
                <TemplateMarketplaceCard
                  key={theme.id}
                  theme={{
                    id: theme.id,
                    name: theme.name,
                    slug: theme.slug,
                    category: theme.category,
                    eventCategory: activeSlug ?? theme.eventCategory,
                    eventCategories: theme.eventCategories,
                    isPremium: theme.isPremium,
                    previewImage: theme.previewImage ?? null,
                    revealMode: theme.revealMode,
                    revealVideoUrl: theme.revealVideoUrl,
                    revealAnimationPreset:
                      ((theme.decorAssets ?? {}) as { revealAnimation?: { preset?: string } })
                        .revealAnimation?.preset ?? "MAGIC_BLOOM",
                    previewPrimary:
                      (theme.colorPalette as { primary?: string }).primary ?? "#76508c",
                    previewAccent:
                      (theme.colorPalette as { accent?: string }).accent ?? "#a987bd",
                    demoSlug: demoSlugByThemeId.get(theme.id) ?? null,
                  }}
                />
              ))}
            </div>
          )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function sortLabel(sort: SortMode) {
  if (sort === "newest") return "Newest";
  if (sort === "premium") return "Premium";
  if (sort === "name") return "Name";
  return "Popular";
}

function FilterChip({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[9px] font-extrabold tracking-wide uppercase transition sm:text-[10px]",
        active
          ? "border-violet-300 bg-violet-100 text-[#5a3d6d] shadow-sm"
          : "border-violet-200 bg-white text-[#765f81] hover:border-violet-300 hover:bg-violet-50 hover:text-[#4b3659]",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function StyleChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-2 text-[9px] font-extrabold tracking-wide capitalize transition sm:text-[10px]",
        active
          ? "bg-violet-100 text-[#5a3d6d] shadow-sm"
          : "bg-white text-[#765f81] hover:bg-violet-50 hover:text-[#4b3659]",
      )}
    >
      {label}
    </Link>
  );
}

function SortLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl px-3 py-2 text-[10px] font-bold transition",
        active
          ? "bg-violet-100 text-[#5a3d6d]"
          : "text-[#765f81] hover:bg-violet-50",
      )}
    >
      {label}
    </Link>
  );
}
