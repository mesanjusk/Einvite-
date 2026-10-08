import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { db } from "@/lib/db";
import { eventCategoryFor } from "@/lib/event-categories";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { deleteThemeAction, deleteThemeColorwayAction } from "@/lib/actions/admin";
import { ThemeColorwayDialog } from "@/components/admin/theme-colorway-dialog";
import { ThemePublicationToggle } from "@/components/admin/theme-publication-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Manage Themes" };

export default async function AdminThemesPage() {
  const themes = await db.theme.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      templates: true,
      colorways: { orderBy: { sortOrder: "asc" } },
      _count: { select: { invitations: true, pdfInvitations: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Theme Studio" meta={`${themes.length} themes`}>
        <Button asChild>
          <Link href="/admin/library/themes/new">
            <Plus className="size-4" />
            New theme
          </Link>
        </Button>
      </PageHeader>

      <Card className="border-violet-200/70 bg-violet-50/50">
        <CardContent className="py-4 text-sm text-violet-950">
          One theme now drives the live website and can also be exported as PDF. Legacy PDF-only
          themes remain listed below for compatibility, but new designs should be created once here.
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const palette = theme.colorPalette as {
            primary: string;
            secondary: string;
            accent: string;
            background: string;
            foreground: string;
          };
          return (
            <Card key={theme.id} className="overflow-hidden py-0">
              {theme.previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={theme.previewImage}
                  alt={`${theme.name} thumbnail`}
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : (
                <div
                  className="aspect-[16/9]"
                  style={{
                    background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                  }}
                />
              )}
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-muted-foreground text-xs capitalize">
                      {theme.slug} · {theme.category}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {eventCategoryFor(theme.eventCategory).label}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <ThemePublicationToggle
                      themeId={theme.id}
                      isPublished={theme.isPublished}
                      type={theme.type}
                    />
                    <Badge variant="secondary">
                      {theme.type === "WEBSITE" ? "Web + PDF" : "Legacy PDF"}
                    </Badge>
                    {theme.isPremium && <Badge variant="gold">Premium</Badge>}
                    <Button asChild variant="ghost" size="icon" className="size-8">
                      <Link href={`/admin/library/themes/${theme.id}/edit`} aria-label={`Edit ${theme.name}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <DeleteEntityButton
                      id={theme.id}
                      confirmLabel={`Delete the ${theme.name} theme? This can't be undone.`}
                      action={deleteThemeAction}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {theme.colorways.map((colorway) => {
                      const cw = colorway.colorPalette as typeof palette;
                      return (
                        <span
                          key={colorway.id}
                          className="flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-1.5 text-xs"
                        >
                          <span
                            className="size-3.5 rounded-full"
                            style={{
                              background: `linear-gradient(135deg, ${cw.primary}, ${cw.accent})`,
                            }}
                          />
                          {colorway.name}
                          <ThemeColorwayDialog
                            themeId={theme.id}
                            themeName={theme.name}
                            fallbackPalette={palette}
                            colorway={{
                              id: colorway.id,
                              name: colorway.name,
                              slug: colorway.slug,
                              colorPalette: cw,
                              sortOrder: colorway.sortOrder,
                            }}
                          />
                          <DeleteEntityButton
                            id={colorway.id}
                            confirmLabel={`Delete the ${colorway.name} colour?`}
                            action={deleteThemeColorwayAction}
                          />
                        </span>
                      );
                    })}
                    <ThemeColorwayDialog
                      themeId={theme.id}
                      themeName={theme.name}
                      fallbackPalette={palette}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {theme._count.invitations} website invitation(s) · {theme._count.pdfInvitations} PDF selection(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
