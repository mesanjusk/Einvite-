import type { Metadata } from "next";

import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Templates" };

const paletteSchema = (colorPalette: unknown) => {
  const p = colorPalette as {
    primary?: string;
    accent?: string;
    background?: string;
  } | null;
  return {
    primary: p?.primary ?? "#7a2e2e",
    accent: p?.accent ?? "#c9942a",
    background: p?.background ?? "#faf3ea",
  };
};

export default async function TemplatesPage() {
  const themes = await db.theme.findMany({
    orderBy: { sortOrder: "asc" },
    include: { templates: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Templates</h1>
        <p className="text-muted-foreground text-sm">
          One-click themes — each changes colors, fonts, and decoration across your
          invitation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const palette = paletteSchema(theme.colorPalette);
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
              <CardContent className="pb-6">
                <p className="text-muted-foreground text-sm">{theme.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {themes.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No themes seeded yet — run <code className="font-mono">npm run db:seed</code>.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
