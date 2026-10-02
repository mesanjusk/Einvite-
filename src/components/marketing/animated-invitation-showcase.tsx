import Link from "next/link";
import { Heart, Play, Sparkles } from "lucide-react";

import { PhoneMockup } from "@/components/marketing/phone-mockup";
import type { MarketplaceThemeCard } from "@/components/marketing/template-marketplace-card";

type PreviewTheme = Pick<
  MarketplaceThemeCard,
  "id" | "name" | "previewImage" | "demoSlug"
>;

function PreviewArtwork({ theme }: { theme: PreviewTheme }) {
  return (
    <>
      {theme.previewImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={theme.previewImage}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#ecd18c,#9f7b45_48%,#2c2824)]" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#171411]/78 via-[#171411]/22 to-transparent" />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 text-white">
        <p className="font-display line-clamp-2 text-sm leading-tight drop-shadow sm:text-base">
          {theme.name}
        </p>
      </div>
    </>
  );
}

function TapOverlay({ theme }: { theme: PreviewTheme }) {
  if (!theme.demoSlug) return null;

  return (
    <Link
      href={`/invite/${theme.demoSlug}`}
      aria-label={`Preview ${theme.name}`}
      className="absolute inset-0 z-20 grid place-items-center"
    >
      <span className="grid size-11 place-items-center rounded-full border border-white/60 bg-[#211f1c]/90 text-[#e2bd72] shadow-[0_12px_30px_rgba(0,0,0,.3)] backdrop-blur transition hover:scale-110">
        <Play className="ml-0.5 size-4 fill-current" />
      </span>
    </Link>
  );
}

export function AnimatedInvitationShowcase({
  themes,
}: {
  themes: PreviewTheme[];
}) {
  const visible = themes.slice(0, 5);
  if (visible.length === 0) return null;

  const primary = visible[0];
  const left = visible[1] ?? primary;
  const right = visible[2] ?? primary;
  const farLeft = visible[3] ?? left;
  const farRight = visible[4] ?? right;

  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      {/* Mobile-first composition: one obvious primary preview, supporting cards behind it. */}
      <div className="relative mx-auto h-[430px] w-full max-w-[390px] md:hidden">
        <div className="wedding-preview-halo absolute left-1/2 top-[46%] size-[285px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0b754]/35" />
        <div className="wedding-preview-halo wedding-preview-halo-delayed absolute left-1/2 top-[46%] size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8a6741]/30" />

        <span className="wedding-petal wedding-petal-a left-[5%] top-[8%]" />
        <span className="wedding-petal wedding-petal-b right-[4%] top-[22%]" />
        <span className="wedding-petal wedding-petal-c bottom-[20%] left-[8%]" />
        <span className="wedding-sparkle left-[16%] top-[28%]">✦</span>
        <span className="wedding-sparkle wedding-sparkle-delay right-[13%] top-[10%]">✦</span>

        <div className="wedding-mockup-side wedding-mockup-left absolute left-[2%] top-[92px] z-10 w-[34%] max-w-[126px]">
          <div className="relative aspect-[3/5] overflow-hidden rounded-[1.35rem] border-[5px] border-[#ead9b3] bg-[#ead9b3] shadow-[0_20px_45px_rgba(0,0,0,.2)]">
            <PreviewArtwork theme={left} />
          </div>
        </div>

        <div className="wedding-mockup-side wedding-mockup-right absolute right-[2%] top-[112px] z-10 w-[34%] max-w-[126px]">
          <div className="relative aspect-[3/5] overflow-hidden rounded-[1.35rem] border-[5px] border-[#ead9b3] bg-[#ead9b3] shadow-[0_20px_45px_rgba(0,0,0,.2)]">
            <PreviewArtwork theme={right} />
          </div>
        </div>

        <div className="wedding-mockup-primary absolute left-1/2 top-4 z-30 w-[56%] max-w-[214px] -translate-x-1/2">
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-[linear-gradient(135deg,#e5c27055,#7a5d3d44,#2b292633)] blur-xl" />
            <PhoneMockup className="relative max-w-none border-[#b78e49] bg-[#201e1b] shadow-[0_30px_65px_rgba(91,18,47,.32)]">
              <PreviewArtwork theme={primary} />
              <TapOverlay theme={primary} />
            </PhoneMockup>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#d0aa62]/45 bg-[#211f1c]/92 px-4 py-2 text-[9px] font-black tracking-[0.11em] text-[#efd79f] uppercase shadow-[0_10px_24px_rgba(115,48,34,.14)] backdrop-blur">
          <Sparkles className="size-3.5 text-[#d8b366]" />
          Tap to preview
        </div>

        <div className="absolute bottom-14 right-7 z-40 grid size-10 place-items-center rounded-full bg-[#c29a4e] text-[#221e19] shadow-lg">
          <Heart className="size-4 fill-current" />
        </div>
      </div>

      {/* Desktop/tablet composition: five independently floating invitation surfaces. */}
      <div className="relative hidden h-[560px] w-full md:block">
        <div className="wedding-preview-halo absolute left-1/2 top-1/2 size-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0b754]/30" />
        <div className="wedding-preview-halo wedding-preview-halo-delayed absolute left-1/2 top-1/2 size-[355px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7b5c3c]/24" />

        <span className="wedding-petal wedding-petal-a left-[5%] top-[12%]" />
        <span className="wedding-petal wedding-petal-b right-[6%] top-[18%]" />
        <span className="wedding-petal wedding-petal-c bottom-[14%] left-[16%]" />
        <span className="wedding-sparkle left-[12%] top-[32%]">✦</span>
        <span className="wedding-sparkle wedding-sparkle-delay right-[14%] top-[10%]">✦</span>

        <div className="wedding-float-far-left absolute left-[2%] top-[28%] z-0 w-[19%] max-w-[125px]">
          <div className="relative aspect-[3/5] overflow-hidden rounded-[1.35rem] border-[5px] border-[#ead9b3] bg-[#ead9b3] shadow-[0_22px_48px_rgba(0,0,0,.18)]">
            <PreviewArtwork theme={farLeft} />
          </div>
        </div>

        <div className="wedding-float-left absolute left-[15%] top-[16%] z-10 w-[28%] max-w-[190px]">
          <div className="relative aspect-[3/5] overflow-hidden rounded-[1.6rem] border-[6px] border-[#ead9b3] bg-[#ead9b3] shadow-[0_25px_58px_rgba(0,0,0,.22)]">
            <PreviewArtwork theme={left} />
          </div>
        </div>

        <div className="wedding-mockup-primary absolute left-1/2 top-[2%] z-30 w-[34%] max-w-[230px] -translate-x-1/2">
          <PhoneMockup className="max-w-none border-[#b78e49] bg-[#201e1b] shadow-[0_34px_75px_rgba(91,18,47,.32)]">
            <PreviewArtwork theme={primary} />
            <TapOverlay theme={primary} />
          </PhoneMockup>
        </div>

        <div className="wedding-float-right absolute right-[15%] top-[18%] z-20 w-[28%] max-w-[190px]">
          <div className="relative aspect-[3/5] overflow-hidden rounded-[1.6rem] border-[6px] border-[#ead9b3] bg-[#ead9b3] shadow-[0_25px_58px_rgba(0,0,0,.22)]">
            <PreviewArtwork theme={right} />
          </div>
        </div>

        <div className="wedding-float-far-right absolute right-[2%] top-[30%] z-0 w-[19%] max-w-[125px]">
          <div className="relative aspect-[3/5] overflow-hidden rounded-[1.35rem] border-[5px] border-[#ead9b3] bg-[#ead9b3] shadow-[0_22px_48px_rgba(0,0,0,.18)]">
            <PreviewArtwork theme={farRight} />
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#edc06b]/55 bg-[#fff8df]/94 px-5 py-2.5 text-[10px] font-black tracking-[0.12em] text-[#efd79f] uppercase shadow-[0_12px_28px_rgba(115,48,34,.14)] backdrop-blur">
          ✦ Tap · animate · celebrate ✦
        </div>
      </div>
    </div>
  );
}

export function MobileTemplateSpotlight({
  themes,
}: {
  themes: PreviewTheme[];
}) {
  const visible = themes.slice(0, 5);
  if (visible.length === 0) return null;

  return (
    <div className="md:hidden">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <p className="font-display text-xl text-[#a77d3e]">See them move</p>
          <p className="text-[9px] font-black tracking-[0.12em] text-[#6f5a3d] uppercase">
            Swipe invitation previews
          </p>
        </div>
        <Sparkles className="size-5 text-[#b18843]" />
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((theme, index) => (
          <div
            key={theme.id}
            className="wedding-preview-snap relative w-[58vw] max-w-[220px] shrink-0 snap-center"
            style={{ animationDelay: `${index * -0.55}s` }}
          >
            <div className="wedding-card relative rounded-[1.8rem] p-2.5">
              <PhoneMockup className="max-w-none shadow-[0_20px_44px_rgba(96,24,51,.2)]">
                <PreviewArtwork theme={theme} />
                <TapOverlay theme={theme} />
              </PhoneMockup>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
