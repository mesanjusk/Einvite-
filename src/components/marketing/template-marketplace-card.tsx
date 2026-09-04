import Link from "next/link";

import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";

export type MarketplaceThemeCard = {
  id: string;
  name: string;
  slug: string;
  category: string;
  eventCategory: string;
  isPremium: boolean;
  previewImage: string | null;
  demoSlug?: string | null;
};

export function TemplateMarketplaceCard({ theme }: { theme: MarketplaceThemeCard }) {
  return (
    <article className="min-w-0">
      <div className="relative rounded-[1.45rem] border border-[#e9dfd5] bg-white p-2 shadow-[0_12px_35px_rgba(94,45,54,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(94,45,54,0.13)] sm:p-3">
        <PhoneMockup className="max-w-none shadow-none">
          {theme.previewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={theme.previewImage}
              alt={`${theme.name} invitation preview`}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f9ead8,#e3c5b1_45%,#754052)]" />
          )}

          {theme.demoSlug && (
            <Link
              href={`/invite/${theme.demoSlug}`}
              aria-label={`Preview ${theme.name}`}
              className="absolute inset-0 z-10 grid place-items-center"
            >
              <span className="grid size-10 place-items-center rounded-full border border-white/70 bg-white/90 text-[#681a31] shadow-lg backdrop-blur sm:size-11">
                <span className="ml-0.5 text-sm">▶</span>
              </span>
            </Link>
          )}

          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 flex justify-center">
            <span className="rounded-full bg-[#fffaf4]/92 px-2.5 py-1 text-[8px] font-extrabold tracking-[0.12em] text-[#682039] uppercase shadow-sm backdrop-blur sm:text-[9px]">
              {theme.isPremium ? "Premium" : "Included"}
            </span>
          </div>
        </PhoneMockup>
      </div>

      <div className="px-1 pt-3 text-center">
        <h3 className="truncate font-display text-[15px] leading-tight text-[#4f2b31] sm:text-lg">
          {theme.name}
        </h3>
        <div className="mt-1 flex items-center justify-center gap-2 text-[9px] font-semibold tracking-wide text-[#8b746b] uppercase sm:text-[10px]">
          <span className="truncate">{theme.category}</span>
          <span aria-hidden="true">•</span>
          <span>{theme.isPremium ? "Premium design" : "Included design"}</span>
        </div>

        {theme.demoSlug ? (
          <Link
            href={`/invite/${theme.demoSlug}`}
            className="mt-3 flex w-full items-center justify-center rounded-full bg-[#65172e] px-3 py-2.5 text-[9px] font-extrabold tracking-[0.12em] text-white uppercase shadow-sm transition hover:bg-[#541326] sm:text-[10px]"
          >
            See live preview
          </Link>
        ) : (
          <StartLiveInvitationButton
            category={theme.eventCategory}
            themeSlug={theme.slug}
            className="mt-3 flex w-full items-center justify-center rounded-full bg-[#65172e] px-3 py-2.5 text-[9px] font-extrabold tracking-[0.12em] text-white uppercase shadow-sm transition hover:bg-[#541326] sm:text-[10px]"
          >
            Preview & edit
          </StartLiveInvitationButton>
        )}
      </div>
    </article>
  );
}
