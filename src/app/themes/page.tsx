import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SiteLogo } from "@/components/brand/site-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Themes",
  description: "Browse every invitation theme, preview a live demo, and create your own.",
};

export default async function PublicThemesPage() {
  const [themes, demos] = await Promise.all([
    db.theme.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
    db.invitation
      .findMany({
        where: { isDemo: true, status: "PUBLISHED" },
        select: { slug: true, themeId: true },
      })
      .catch(() => []),
  ]);

  const demoSlugByThemeId = new Map(demos.map((d) => [d.themeId, d.slug]));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
      <div>
        <Link href="/" className="inline-block">
          <SiteLogo size="md" />
        </Link>
        <h1 className="font-display mt-4 text-2xl">Themes</h1>
        <p className="text-muted-foreground text-sm">
          Preview a live demo, then create your own with the same theme.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const palette = theme.colorPalette as {
            primary: string;
            accent: string;
            background: string;
          };
          const demoSlug = demoSlugByThemeId.get(theme.id);
          return (
            <Card key={theme.id} className="overflow-hidden py-0">
              <div
                className="flex h-28 items-end p-4"
                style={{
                  background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                }}
              >
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: palette.background, color: palette.primary }}
                >
                  Aa
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display">{theme.name}</CardTitle>
                  {theme.isPremium && <Badge variant="gold">Premium</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pb-6">
                <p className="text-muted-foreground text-sm">{theme.description}</p>
                <div className="flex gap-2">
                  {demoSlug && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/invite/${demoSlug}`} target="_blank" rel="noreferrer">
                        View demo
                      </a>
                    </Button>
                  )}
                  <Button size="sm" asChild>
                    <Link href={`/create?theme=${theme.slug}`}>Use this theme</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
