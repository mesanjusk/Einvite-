import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, Palette, Music, ClipboardCheck, Rocket, Wand2 } from "lucide-react";

import { db } from "@/lib/db";
import { SITE_NAME } from "@/config/site";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { EventCategoryChips } from "@/components/marketing/event-category-chips";
import { InstagramBanner } from "@/components/marketing/instagram-banner";
import { SiteFooter } from "@/components/marketing/site-footer";

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

const FEATURES = [
  { icon: Wand2, title: "AI Wizard" },
  { icon: Palette, title: "One-Click Themes" },
  { icon: Music, title: "Music & Motion" },
  { icon: ClipboardCheck, title: "RSVP & Guests" },
  { icon: Sparkles, title: "Live Analytics" },
  { icon: Rocket, title: "One-Click Publish" },
];

export default async function Home() {
  const [themes, demos] = await Promise.all([
    db.theme
      .findMany({ where: { type: "WEBSITE" }, orderBy: { sortOrder: "asc" }, take: 6 })
      .catch(() => []),
    db.invitation
      .findMany({
        where: { isDemo: true, status: "PUBLISHED" },
        take: 3,
        include: { theme: true },
        orderBy: { createdAt: "asc" },
      })
      .catch(() => []),
  ]);

  return (
    <div className="flex min-h-svh flex-col">
      <InstagramBanner />
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <SiteLogo size="lg" />
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/create">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section
          className="flex flex-col items-center gap-6 px-6 py-20 text-center"
          style={{
            background:
              "radial-gradient(120% 60% at 50% 0%, oklch(0.95 0.025 340) 0%, var(--background) 60%)",
          }}
        >
          <h1 className="font-display max-w-3xl text-4xl leading-tight text-balance sm:text-6xl">
            Your wedding invite, designed by AI in{" "}
            <span className="text-primary">minutes, not months</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/create">Create your invitation — free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/themes">Browse themes</Link>
            </Button>
          </div>
          <EventCategoryChips />
        </section>

        <section className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 py-16 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center gap-2 rounded-xl border p-5 text-center">
              <feature.icon className="text-accent size-6" strokeWidth={1.5} />
              <span className="text-sm font-medium">{feature.title}</span>
            </div>
          ))}
        </section>

        {demos.length > 0 && (
          <section className="px-6 py-16" style={{ background: "color-mix(in srgb, var(--muted) 40%, transparent)" }}>
            <div className="mx-auto max-w-5xl">
              <h2 className="font-display mb-10 text-center text-3xl">See it in action</h2>
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
                {demos.map((demo) => {
                  const palette = demo.theme?.colorPalette as
                    | { primary: string; accent: string; background: string }
                    | undefined;
                  const dateDisplay = demo.weddingDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                  return (
                    <div key={demo.id} className="flex flex-col items-center gap-4">
                      <PhoneMockup>
                        <Link
                          href={`/invite/${demo.slug}`}
                          target="_blank"
                          className="flex size-full flex-col items-center justify-center gap-4 px-4 text-center"
                          style={{
                            background: `radial-gradient(120% 100% at 50% 0%, ${palette?.primary ?? "#7a2e2e"} 0%, color-mix(in srgb, ${palette?.primary ?? "#7a2e2e"} 70%, black 25%) 100%)`,
                            color: palette?.background ?? "#faf3ea",
                          }}
                        >
                          <span className="text-[10px] tracking-[0.3em] uppercase opacity-80">
                            Demo invitation
                          </span>
                          <span className="font-display text-2xl">
                            {demo.brideName}
                            <span style={{ color: palette?.accent ?? "#c9942a" }}> &amp; </span>
                            {demo.groomName}
                          </span>
                          <span className="text-xs tracking-[0.15em] opacity-80">{dateDisplay}</span>
                          <span
                            className="mt-4 rounded-full border px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase"
                            style={{ borderColor: palette?.accent ?? "#c9942a" }}
                          >
                            Tap to view
                          </span>
                        </Link>
                      </PhoneMockup>
                      <p className="text-sm font-medium">
                        {demo.brideName} &amp; {demo.groomName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {themes.length > 0 && (
          <section className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="font-display mb-6 text-center text-3xl">Themes for every wedding</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {themes.map((theme) => {
                const palette = theme.colorPalette as { primary: string; accent: string };
                return (
                  <div key={theme.id} className="overflow-hidden rounded-lg border">
                    <div
                      className="h-16"
                      style={{
                        background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                      }}
                    />
                    <p className="p-2 text-center text-xs font-medium">{theme.name}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="px-6 py-20 text-center">
          <h2 className="font-display mb-4 text-3xl">Ready to send the invite?</h2>
          <Button size="lg" asChild>
            <Link href="/create">Start for free</Link>
          </Button>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
