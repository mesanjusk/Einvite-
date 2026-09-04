import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SITE_NAME } from "@/config/site";
import { PublicMarketplaceHeader } from "@/components/marketing/public-marketplace-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TemplateMarketplaceCard } from "@/components/marketing/template-marketplace-card";
import { categoryIcon } from "@/components/marketing/category-icon";
import {
  EVENT_CATEGORIES,
  eventCategoryFor,
  isEventCategorySlug,
} from "@/lib/event-categories";
import { fallbackThumbnailFor } from "@/lib/marketing-fallbacks";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Invitation Templates",
  description:
    "Choose a celebration, preview invitation templates live, then edit your selected design directly on screen.",
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
    return [theme.name, theme.slug, theme.description ?? "", theme.category, theme.eventCategory]
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
    <div className="min-h-svh bg-[#fffdf8] text-[#3f302d]">
      <PublicMarketplaceHeader />

      <main>
        <section className="relative overflow-hidden border-b border-[#eee5dc] bg-[#fffaf2]">
          <div className="pointer-events-none absolute -left-20 top-6 size-52 rounded-full bg-[#f5d9cb]/45 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -top-10 size-56 rounded-full bg-[#f0dfad]/35 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 pb-6 pt-8 text-center sm:px-8 sm:pb-9 sm:pt-11">
            <p className="text-[9px] font-extrabold tracking-[0.24em] text-[#9b755e] uppercase sm:text-[10px]">
              Curated digital invitations
            </p>
            <h1 className="font-display mx-auto mt-3 text-[2.2rem] leading-[0.98] text-[#592b35] sm:text-5xl">
              Explore Our {headingCategory ? `${headingCategory} ` : ""}
              <span className="italic text-[#7b2942]">Templates</span>
            </h1>

            <p className="mt-5 text-[9px] font-extrabold tracking-[0.18em] text-[#8d756b] uppercase">
              Select collection
            </p>
            <div className="mx-auto mt-2 grid max-w-md grid-cols-2 rounded-full border border-[#e7dcd2] bg-white p-1 shadow-sm">
              <Link
                href={hrefFor({ tier: null })}
                className={cn(
                  "rounded-full px-4 py-2.5 text-[9px] font-extrabold tracking-wide uppercase transition sm:text-[10px]",
                  tier === "all"
                    ? "bg-[#65172e] text-white shadow-sm"
                    : "text-[#8b756d] hover:text-[#65172e]",
                )}
              >
                All designs
              </Link>
              <Link
                href={hrefFor({ tier: "premium" })}
                className={cn(
                  "rounded-full px-4 py-2.5 text-[9px] font-extrabold tracking-wide uppercase transition sm:text-[10px]",
                  tier === "premium"
                    ? "bg-[#65172e] text-white shadow-sm"
                    : "text-[#8b756d] hover:text-[#65172e]",
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
              className="mx-auto mt-4 flex max-w-3xl items-center gap-2 rounded-full border border-[#eadfd5] bg-white px-4 py-1.5 shadow-[0_10px_35px_rgba(92,51,55,0.05)]"
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
                className="min-w-0 flex-1 bg-transparent py-2 text-xs text-[#4f403b] outline-none placeholder:text-[#b4a39a] sm:text-sm"
              />
              <button
                type="submit"
                className="rounded-full bg-[#65172e] px-4 py-2 text-[9px] font-extrabold tracking-[0.12em] text-white uppercase sm:text-[10px]"
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

        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="rounded-full border border-[#e6dbd1] bg-white px-3 py-1.5 text-[9px] font-extrabold tracking-wide text-[#80675e] uppercase shadow-sm sm:text-[10px]">
              {themes.length} {themes.length === 1 ? "template" : "templates"}
            </span>

            <details className="group relative">
              <summary className="cursor-pointer list-none rounded-full border border-[#e6dbd1] bg-white px-3.5 py-1.5 text-[9px] font-extrabold tracking-wide text-[#80675e] uppercase shadow-sm [&::-webkit-details-marker]:hidden sm:text-[10px]">
                Sort: {sortLabel(sort)} ▾
              </summary>
              <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-2xl border border-[#eadfd5] bg-white p-1.5 text-left shadow-[0_18px_45px_rgba(94,45,54,0.16)]">
                <SortLink href={hrefFor({ sort: null })} label="Popular" active={sort === "popular"} />
                <SortLink href={hrefFor({ sort: "newest" })} label="Newest" active={sort === "newest"} />
                <SortLink href={hrefFor({ sort: "premium" })} label="Premium first" active={sort === "premium"} />
                <SortLink href={hrefFor({ sort: "name" })} label="Name A–Z" active={sort === "name"} />
              </div>
            </details>
          </div>

          {themes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#dccdc1] bg-[#fff9f0] px-6 py-16 text-center">
              <p className="font-display text-2xl text-[#5d2032]">No matching designs yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7c685f]">
                Try another celebration, style or search term.
              </p>
              <Link
                href="/themes"
                className="mt-5 inline-flex rounded-full bg-[#65172e] px-5 py-2.5 text-[10px] font-extrabold tracking-wide text-white uppercase"
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
                    eventCategory: theme.eventCategory,
                    isPremium: theme.isPremium,
                    previewImage: theme.previewImage ?? fallbackThumbnailFor(theme.slug),
                    demoSlug: demoSlugByThemeId.get(theme.id) ?? null,
                  }}
                />
              ))}
            </div>
          )}
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
          ? "border-[#65172e] bg-[#65172e] text-white"
          : "border-[#e6dbd1] bg-white text-[#7d655d] hover:border-[#a57380] hover:text-[#65172e]",
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
        active ? "bg-[#65172e] text-white" : "bg-[#f6ede5] text-[#7d655d] hover:text-[#65172e]",
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
        active ? "bg-[#fff3e8] text-[#65172e]" : "text-[#745f57] hover:bg-[#fff7ef]",
      )}
    >
      {label}
    </Link>
  );
}
