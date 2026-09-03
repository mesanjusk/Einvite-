import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SITE_NAME } from "@/config/site";
import { SiteLogo } from "@/components/brand/site-logo";
import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
import { SiteFooter } from "@/components/marketing/site-footer";
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

export default async function PublicThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category: categoryParam, q: rawQuery } = await searchParams;
  const activeSlug = isEventCategorySlug(categoryParam) ? categoryParam : null;
  const query = rawQuery?.trim().toLowerCase() ?? "";

  const [allThemes, demos] = await Promise.all([
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

  const themes = query
    ? allThemes.filter((theme) =>
        [theme.name, theme.slug, theme.description ?? "", theme.category, theme.eventCategory]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : allThemes;

  const demoSlugByThemeId = new Map(demos.map((demo) => [demo.themeId, demo.slug]));

  return (
    <div className="min-h-svh bg-[#fffdf9] text-[#342a27]">
      <header className="sticky top-0 z-50 border-b border-[#eadfd3] bg-[#fffdf9]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label={`${SITE_NAME} home`}>
            <SiteLogo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-[#ddcfc2] px-4 py-2 text-xs font-semibold text-[#651d33] transition hover:border-[#651d33]/40 sm:inline-flex"
            >
              My invitations
            </Link>
            <a
              href="#templates"
              className="rounded-full bg-[#651d33] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#54172a]"
            >
              Choose design
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[#eadfd3] bg-[#fff9f0]">
          <div className="mx-auto max-w-6xl px-5 py-10 text-center sm:px-8 sm:py-14 lg:px-10">
            <p className="text-[10px] font-semibold tracking-[0.24em] text-[#9a6c48] uppercase">
              Step 1 · Choose your celebration
            </p>
            <h1 className="font-display mx-auto mt-2 max-w-3xl text-4xl leading-tight text-[#5d2032] text-balance sm:text-5xl">
              Choose a design before you start editing
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#7b665d] sm:text-base">
              Select the invitation type, browse matching templates, preview a real invitation,
              then edit that design live. No step-by-step form comes first.
            </p>

            <div className="mx-auto mt-7 max-w-2xl rounded-3xl border border-[#e2d5c8] bg-white p-3 shadow-[0_12px_40px_rgba(93,32,50,0.05)]">
              <p className="mb-3 text-[10px] font-bold tracking-[0.18em] text-[#8d7166] uppercase">
                Select invitation type
              </p>
              <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <FilterChip href="/themes" label="All designs" active={activeSlug === null} />
                {EVENT_CATEGORIES.map((category) => {
                  const Icon = categoryIcon(category.icon);
                  return (
                    <FilterChip
                      key={category.slug}
                      href={`/themes?category=${category.slug}`}
                      label={category.label}
                      active={activeSlug === category.slug}
                      icon={<Icon className="size-3.5" strokeWidth={1.75} />}
                    />
                  );
                })}
              </nav>
            </div>

            <form className="mx-auto mt-4 flex max-w-2xl gap-2" action="/themes" method="get">
              {activeSlug && <input type="hidden" name="category" value={activeSlug} />}
              <input
                type="search"
                name="q"
                defaultValue={rawQuery ?? ""}
                placeholder="Search templates by style or name..."
                className="min-w-0 flex-1 rounded-full border border-[#e2d5c8] bg-white px-5 py-3 text-sm text-[#4a3a34] outline-none transition placeholder:text-[#ad9a91] focus:border-[#8b4557] focus:ring-2 focus:ring-[#8b4557]/10"
              />
              <button
                type="submit"
                className="rounded-full bg-[#651d33] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#54172a]"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        <section id="templates" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-[#9a6c48] uppercase">
                Step 2 · Preview and choose
              </p>
              <p className="mt-1 text-sm font-semibold text-[#5d2032]">
                {themes.length} {themes.length === 1 ? "design" : "designs"} available
              </p>
            </div>
            <span className="rounded-full border border-[#e5d8cc] bg-white px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#785f56] uppercase">
              Live editable
            </span>
          </div>

          {themes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#dccdc1] bg-[#fff9f0] px-6 py-16 text-center">
              <p className="font-display text-2xl text-[#5d2032]">No matching designs yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7c685f]">
                Try another category or search term. New themes added by the admin will appear
                here automatically.
              </p>
              <Link
                href="/themes"
                className="mt-5 inline-flex rounded-full bg-[#651d33] px-5 py-2.5 text-xs font-bold text-white"
              >
                Show all templates
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {themes.map((theme) => {
                const palette = theme.colorPalette as {
                  primary: string;
                  accent: string;
                  background: string;
                };
                const themeCategory = eventCategoryFor(theme.eventCategory);
                const demoSlug = demoSlugByThemeId.get(theme.id);
                const image = theme.previewImage ?? fallbackThumbnailFor(theme.slug);

                return (
                  <article
                    key={theme.id}
                    className="group overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-[0_10px_35px_rgba(93,32,50,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(93,32,50,0.11)]"
                  >
                    <div
                      className="relative aspect-[3/4] overflow-hidden"
                      style={{
                        background: `linear-gradient(145deg, ${palette.background}, ${palette.accent})`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={`${theme.name} invitation template preview`}
                        className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.035]"
                      />
                      <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#651d33] uppercase shadow-sm backdrop-blur">
                          {theme.isPremium ? "Premium" : "Popular"}
                        </span>
                        <span className="rounded-full bg-black/35 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur">
                          {themeCategory.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4">
                      <h2 className="truncate font-display text-base text-[#4e2630] sm:text-lg">
                        {theme.name}
                      </h2>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] text-[#8b756c] capitalize sm:text-xs">
                          {theme.category}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-[#651d33] sm:text-xs">
                          {theme.isPremium ? "Premium" : "Included"}
                        </span>
                      </div>

                      {theme.description && (
                        <p className="mt-2 hidden line-clamp-2 text-xs leading-5 text-[#8a746b] sm:block">
                          {theme.description}
                        </p>
                      )}

                      <div className="mt-3 grid gap-2">
                        {demoSlug ? (
                          <a
                            href={`/invite/${demoSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#d8c8bc] px-3 py-2 text-center text-[10px] font-bold tracking-wide text-[#651d33] uppercase transition hover:border-[#651d33]/50 hover:bg-[#fff9f0] sm:text-xs"
                          >
                            Live preview
                          </a>
                        ) : null}

                        <StartLiveInvitationButton
                          fromSlug={demoSlug}
                          category={themeCategory.slug}
                          themeSlug={theme.slug}
                          className="w-full rounded-full bg-[#651d33] px-3 py-2 text-center text-[10px] font-bold tracking-wide text-white uppercase transition hover:bg-[#54172a] sm:text-xs"
                        >
                          {demoSlug ? "Edit this design" : "Preview & edit"}
                        </StartLiveInvitationButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
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
        "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-bold tracking-wide uppercase transition-colors sm:text-xs",
        active
          ? "border-[#651d33] bg-[#651d33] text-white"
          : "border-[#e2d5c8] bg-[#fffdf9] text-[#6f5a52] hover:border-[#8b4557]/50 hover:text-[#651d33]",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
