import type { Metadata } from "next";

import { db } from "@/lib/db";
import { eventCategoryFor } from "@/lib/event-categories";
import { ThemeFormDialog } from "@/components/admin/theme-form-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { deleteThemeAction, deleteThemeColorwayAction } from "@/lib/actions/admin";
import { ThemeColorwayDialog } from "@/components/admin/theme-colorway-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Manage Themes" };

export default async function AdminThemesPage() {
  const [themes, videoTemplates] = await Promise.all([
    db.theme.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    include: {
      templates: true,
      colorways: { orderBy: { sortOrder: "asc" } },
      _count: { select: { invitations: true, pdfInvitations: true } },
    },
  }),
    db.videoTemplate.findMany({
      where: { previewImage: { not: null } },
      orderBy: { sortOrder: "asc" },
      select: { name: true, previewImage: true },
    }),
  ]);

  const revealVideoLibrary = [
    ...themes
    .filter((theme) => Boolean(theme.revealVideoUrl))
    .map((theme) => ({
      label: `Theme · ${theme.name}`,
      url: theme.revealVideoUrl as string,
    })),
    ...videoTemplates
      .filter((template) => {
        const url = template.previewImage ?? "";
        return url.includes("/video/upload/") || /\.(mp4|webm)(\?|$)/i.test(url);
      })
      .map((template) => ({
        label: `Video library · ${template.name}`,
        url: template.previewImage as string,
      })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Theme Studio" meta={`${themes.length} themes`}>
        <ThemeFormDialog type="WEBSITE" revealVideoLibrary={revealVideoLibrary} />
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
                    <p className="text-muted-foreground text-xs">
                      {eventCategoryFor(theme.eventCategory).label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary">
                      {theme.type === "WEBSITE" ? "Web + PDF" : "Legacy PDF"}
                    </Badge>
                    {theme.isPremium && <Badge variant="gold">Premium</Badge>}
                    <ThemeFormDialog
                      type={theme.type === "PDF" ? "PDF" : "WEBSITE"}
                      theme={{
                        id: theme.id,
                        name: theme.name,
                        slug: theme.slug,
                        description: theme.description,
                        previewImage: theme.previewImage,
                        revealMode: theme.revealMode,
                        revealVideoUrl: theme.revealVideoUrl,
                        category: theme.category,
                        eventCategory: theme.eventCategory,
                        isPremium: theme.isPremium,
                        sortOrder: theme.sortOrder,
                        colorPalette: theme.colorPalette as never,
                        fontPairing: theme.fontPairing as never,
                        decorAssets: theme.decorAssets as never,
                        sectionOrder,
                      }}
                      revealVideoLibrary={revealVideoLibrary}
                    />
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
