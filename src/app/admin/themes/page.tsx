import type { Metadata } from "next";

import { db } from "@/lib/db";
import { ThemeFormDialog } from "@/components/admin/theme-form-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { deleteThemeAction } from "@/lib/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Manage Themes" };

export default async function AdminThemesPage() {
  const themes = await db.theme.findMany({
    orderBy: { sortOrder: "asc" },
    include: { templates: true, _count: { select: { invitations: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Manage Themes</h1>
          <p className="text-muted-foreground text-sm">
            Colors, fonts, and default section layout for each one-click theme.
          </p>
        </div>
        <ThemeFormDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const palette = theme.colorPalette as { primary: string; accent: string };
          const sectionOrder = (theme.templates[0]?.sectionOrder as string[] | undefined) ?? [];
          return (
            <Card key={theme.id} className="overflow-hidden py-0">
              <div
                className="h-16"
                style={{
                  background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                }}
              />
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-muted-foreground text-xs capitalize">
                      {theme.slug} · {theme.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {theme.isPremium && <Badge variant="gold">Premium</Badge>}
                    <ThemeFormDialog
                      theme={{
                        id: theme.id,
                        name: theme.name,
                        slug: theme.slug,
                        description: theme.description,
                        revealMode: theme.revealMode,
                        revealVideoUrl: theme.revealVideoUrl,
                        category: theme.category,
                        isPremium: theme.isPremium,
                        sortOrder: theme.sortOrder,
                        colorPalette: theme.colorPalette as never,
                        fontPairing: theme.fontPairing as never,
                        sectionOrder,
                      }}
                    />
                    <DeleteEntityButton
                      id={theme.id}
                      confirmLabel={`Delete the ${theme.name} theme? This can't be undone.`}
                      action={deleteThemeAction}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {theme._count.invitations} invitation(s) using this theme
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
