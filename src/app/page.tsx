import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, Palette, Music, ClipboardCheck, Rocket, Wand2 } from "lucide-react";

import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";

export const metadata: Metadata = {
  title: "AI-Generated Wedding Invitations",
  description:
    "Answer a few questions and get a premium, animated wedding invitation website — envelope reveal, countdown, RSVP, and more — live in minutes.",
};

const FEATURES = [
  {
    icon: Wand2,
    title: "AI Wizard",
    description: "Answer questions about your day — AI writes the copy and lays out every section.",
  },
  {
    icon: Palette,
    title: "One-Click Themes",
    description: "Royal, Traditional, Minimal, Beach, and more — colors, fonts, and motifs change together.",
  },
  {
    icon: Music,
    title: "Music & Motion",
    description: "Background music, scroll-triggered reveals, shimmer text, and falling petals.",
  },
  {
    icon: ClipboardCheck,
    title: "RSVP & Guests",
    description: "Collect responses with meal preferences, export to CSV, manage your guest list.",
  },
  {
    icon: Sparkles,
    title: "Live Analytics",
    description: "See views, shares, and RSVPs roll in as guests open your invitation.",
  },
  {
    icon: Rocket,
    title: "One-Click Publish",
    description: "Verify your WhatsApp number and go live instantly with a shareable link and QR code.",
  },
];

export default async function Home() {
  const [themes, demos] = await Promise.all([
    db.theme.findMany({ orderBy: { sortOrder: "asc" }, take: 6 }).catch(() => []),
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
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <span className="font-display text-lg text-primary">AI Wedding Invitation Studio</span>
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
              "radial-gradient(120% 60% at 50% 0%, oklch(0.94 0.03 40) 0%, var(--background) 60%)",
          }}
        >
          <span className="text-accent text-xs tracking-[0.3em] uppercase">
            Premium invites, generated in minutes
          </span>
          <h1 className="font-display max-w-3xl text-4xl leading-tight text-balance sm:text-6xl">
            Your wedding invite, designed by AI in{" "}
            <span className="text-primary">minutes, not months</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Answer a few questions about your day. We generate the copy, the theme, the
            countdown, the RSVP — a full animated wedding website, live at your own link. No
            account needed to start — we only ask for your WhatsApp number when you&apos;re ready
            to publish.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/create">Create your invitation — free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard/templates">Browse themes</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border p-6">
              <feature.icon className="text-accent mb-3 size-6" strokeWidth={1.5} />
              <h3 className="mb-1 font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </section>

        {demos.length > 0 && (
          <section className="px-6 py-16" style={{ background: "color-mix(in srgb, var(--muted) 40%, transparent)" }}>
            <div className="mx-auto max-w-5xl">
              <h2 className="font-display mb-2 text-center text-3xl">See it in action</h2>
              <p className="text-muted-foreground mx-auto mb-10 max-w-lg text-center text-sm">
                Real invitations built on the platform — tap through one to see the envelope
                reveal, countdown, and gallery for yourself.
              </p>
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

      <footer className="text-muted-foreground border-t px-6 py-8 text-center text-sm">
        AI Wedding Invitation Studio
      </footer>
    </div>
  );
}
