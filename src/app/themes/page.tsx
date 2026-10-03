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
        where: {
          type: "WEBSITE",
          ...(activeSlug ? { eventCategory: activeSlug } : {}),
        },
        orderBy: { sortOrder: "asc" },
        include: { colorways: { orderBy: { sortOrder: "asc" } } },
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
  const demoSlugByThemeId = new Map(demos.map((demo) => [demo.themeId, demo.slug]));

  let themes = baseThemes.flatMap((theme) => {
    const base = {
      id: theme.id,
      name: theme.name,
      slug: theme.slug,
      category: theme.category,
      eventCategory: theme.eventCategory,
      isPremium: theme.isPremium,
      previewImage: theme.previewImage ?? fallbackThumbnailFor(theme.slug),
      demoSlug: demoSlugByThemeId.get(theme.id) ?? null,
      variantSlug: null as string | null,
      baseThemeName: null as string | null,
      createdAt: theme.createdAt,
      sortOrder: theme.sortOrder * 1000,
      description: theme.description ?? "",
    };
    const variants = theme.colorways.map((variant, index) => ({
      id: `${theme.id}:${variant.id}`,
      name: `${theme.name} · ${variant.name}`,
      slug: theme.slug,
      category: theme.category,
      eventCategory: theme.eventCategory,
      isPremium: theme.isPremium || variant.isPremium,
      previewImage:
        variant.previewImage ??
        theme.previewImage ??
        fallbackThumbnailFor(theme.slug),
      demoSlug: null as string | null,
      variantSlug: variant.slug,
      baseThemeName: theme.name,
      createdAt: variant.createdAt,
      sortOrder: theme.sortOrder * 1000 + variant.sortOrder + index + 1,
      description: `${theme.description ?? ""} ${variant.name}`,
    }));
    return [base, ...variants];
  });

  themes = themes.filter((theme) => {
    if (tier === "premium" && !theme.isPremium) return false;
    if (activeStyle && theme.category !== activeStyle) return false;
    if (!query) return true;
    return [
      theme.name,
      theme.slug,
      theme.variantSlug ?? "",
      theme.description,
      theme.category,
      theme.eventCategory,
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

  const mobilePreviewThemes = themes.slice(0, 5).map((theme) => ({
    id: theme.id,
    name: theme.name,
    previewImage: theme.previewImage,
    demoSlug: theme.demoSlug,
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
    <div className="min-h-svh bg-[#f8f1e4] text-[#2f2a25]">
      <PublicMarketplaceHeader />

      <main>
        <section className="royal-hero relative overflow-hidden border-b border-[#c8a45e]/20">
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

            <p className="mt-5 text-[9px] font-extrabold tracking-[0.18em] text-[#c9b690] uppercase">
              Select collection
            </p>
            <div className="royal-glass-dark mx-auto mt-2 grid max-w-md grid-cols-2 rounded-full p-1.5">
              <Link
                href={hrefFor({ tier: null })}
                className={cn(
                  "rounded-full px-4 py-2.5 text-[9px] font-extrabold tracking-wide uppercase transition sm:text-[10px]",
                  tier === "all"
                    ? "royal-gold-button text-[#211d18]"
                    : "text-[#d7c7a6] hover:text-[#f0d48f]",
                )}
              >
                All designs
              </Link>
              <Link
                href={hrefFor({ tier: "premium" })}
                className={cn(
                  "rounded-full px-4 py-2.5 text-[9px] font-extrabold tracking-wide uppercase transition sm:text-[10px]",
                  tier === "premium"
                    ? "royal-gold-button text-[#211d18]"
                    : "text-[#d7c7a6] hover:text-[#f0d48f]",
                )}
              >
                Premium designs
              </Link>
            </div>

            <p className="mt-5 text-[9px] font-extrabold tracking-[0.18em] text-[#8d756b] uppercase">
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
              <span className="text-[#b09b91]" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                name="q"
                defaultValue={rawQuery ?? ""}
                placeholder="Search templates by style or name..."
                className="min-w-0 flex-1 bg-transparent py-2 text-xs text-[#efe2c7] outline-none placeholder:text-[#aa9a7d] sm:text-sm"
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
            <span className="rounded-full border border-[#c7a15a]/30 bg-[#fffaf0]/80 px-3 py-1.5 text-[9px] font-extrabold tracking-wide text-[#675538] uppercase shadow-sm sm:text-[10px]">
              {themes.length} {themes.length === 1 ? "template" : "templates"}
            </span>

            <details className="group relative">
              <summary className="cursor-pointer list-none rounded-full border border-[#c7a15a]/30 bg-[#fffaf0]/85 px-3.5 py-1.5 text-[9px] font-extrabold tracking-wide text-[#675538] uppercase shadow-sm [&::-webkit-details-marker]:hidden sm:text-[10px]">
                Sort: {sortLabel(sort)} ▾
              </summary>
              <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-2xl border border-[#c7a15a]/28 bg-[#fffaf0] p-1.5 text-left shadow-[0_18px_45px_rgba(50,40,27,0.15)]">
                <SortLink href={hrefFor({ sort: null })} label="Popular" active={sort === "popular"} />
                <SortLink href={hrefFor({ sort: "newest" })} label="Newest" active={sort === "newest"} />
                <SortLink href={hrefFor({ sort: "premium" })} label="Premium first" active={sort === "premium"} />
                <SortLink href={hrefFor({ sort: "name" })} label="Name A–Z" active={sort === "name"} />
              </div>
            </details>
          </div>

          <div className="relative mx-auto max-w-7xl">
          {themes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#c9aa6c]/40 bg-[#fffaf0] px-6 py-16 text-center">
              <p className="font-display text-2xl text-[#342c24]">No matching designs yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756348]">
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
                <TemplateMarketplaceCard key={theme.id} theme={theme} />
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
          ? "border-[#e0c17e]/30 bg-gradient-to-r from-[#d3ae64] via-[#e6ca8b] to-[#9e7738] text-[#221e19] shadow-sm"
          : "border-[#d3b474]/28 bg-white/[0.05] text-[#dfcfad] hover:border-[#d3b474]/46 hover:bg-[#d3b474]/10 hover:text-[#f1dcaa]",
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
          ? "bg-gradient-to-r from-[#d3ae64] to-[#9c7132] text-[#211d18] shadow-sm"
          : "bg-white/[0.06] text-[#d8c8a7] hover:bg-[#d2ae68]/10 hover:text-[#f0d58f]",
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
          ? "bg-[#efe0bd] text-[#3b3021]"
          : "text-[#6f6048] hover:bg-[#f7edd8]",
      )}
    >
      {label}
    </Link>
  );
}
