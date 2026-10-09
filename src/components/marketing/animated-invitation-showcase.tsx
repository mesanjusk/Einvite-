import Link from "next/link";
import { Play } from "lucide-react";
import { ThemeArtwork } from "@/components/marketing/theme-artwork";
import type { MarketplaceThemeCard } from "@/components/marketing/template-marketplace-card";

export function AnimatedInvitationShowcase({ themes }: { themes: MarketplaceThemeCard[] }) {
  const primary = themes[0];
  if (!primary) return null;
  return (
    <div className="royal-hero-artwork relative mx-auto my-5 h-[310px] w-full max-w-[350px]">
      <div className="royal-hero-halo" />
      {themes[1] && <div className="royal-hero-side royal-hero-side-left"><ThemeArtwork theme={themes[1]} /></div>}
      {themes[2] && <div className="royal-hero-side royal-hero-side-right"><ThemeArtwork theme={themes[2]} /></div>}
      <Link href={`/preview/${primary.slug}`} aria-label={`Preview ${primary.name}`} className="royal-hero-primary absolute left-1/2 top-0 z-20 h-[300px] w-[190px] -translate-x-1/2 overflow-hidden rounded-t-[100px] rounded-b-[24px] border-[5px] border-[#fffaf4] bg-violet-100 shadow-[0_20px_45px_rgba(91,67,107,.22)] focus-visible:outline-2 focus-visible:outline-violet-600">
        <ThemeArtwork theme={primary} animate />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#33203f]/80 to-transparent" />
        <span className="absolute left-1/2 top-[45%] grid size-12 -translate-x-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-[#76508c] shadow-lg"><Play className="ml-0.5 size-5 fill-current" /></span>
        <span className="absolute inset-x-3 bottom-5 font-display text-base leading-tight text-white">{primary.name}</span>
      </Link>
      <span className="wedding-petal wedding-petal-a left-[5%] top-[8%]" /><span className="wedding-petal wedding-petal-b right-[4%] top-[22%]" />
    </div>
  );
}

export function MobileTemplateSpotlight({ themes }: { themes: MarketplaceThemeCard[] }) {
  if (!themes.length) return null;
  return <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none]" aria-label="Invitation previews">{themes.map((theme) => <Link key={theme.id} href={`/preview/${theme.slug}`} aria-label={`Preview ${theme.name}`} className="relative h-[210px] w-[140px] shrink-0 snap-center overflow-hidden rounded-t-[70px] rounded-b-2xl border-4 border-white shadow-sm"><ThemeArtwork theme={theme} /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-3 pt-8 font-display text-sm text-white">{theme.name}</span></Link>)}</div>;
}
