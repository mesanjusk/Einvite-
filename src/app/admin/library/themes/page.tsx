import type { Metadata } from "next";

import { db } from "@/lib/db";
import { eventCategoryFor } from "@/lib/event-categories";
import { ThemeFormDialog } from "@/components/admin/theme-form-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { deleteThemeAction, deleteThemeColorwayAction } from "@/lib/actions/admin";
import {
  ThemeColorwayDialog,
  type ThemeMixerSource,
} from "@/components/admin/theme-colorway-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { normalizeThemeDecor } from "@/lib/theme-recipe";

export const metadata: Metadata = { title: "Manage Themes" };

export default async function AdminThemesPage() {
  const [themes, musicTracks] = await Promise.all([
    db.theme.findMany({
      where: { type: "WEBSITE" },
      orderBy: { sortOrder: "asc" },
      include: {
        templates: true,
        colorways: { orderBy: { sortOrder: "asc" } },
        _count: { select: { invitations: true } },
      },
    }),
    db.musicTrack.findMany({ orderBy: { title: "asc" } }),
  ]);

  const trackOptions = musicTracks.map((track) => ({
    id: track.id,
    title: track.title,
    mood: track.mood,
  }));

  const mixerSources: ThemeMixerSource[] = themes.map((theme) => ({
    id: theme.id,
    name: theme.name,
    colorPalette: theme.colorPalette as ThemeMixerSource["colorPalette"],
    fontPairing: theme.fontPairing as ThemeMixerSource["fontPairing"],
    decorAssets: normalizeThemeDecor(theme.decorAssets),
    revealMode: theme.revealMode,
    revealVideoUrl: theme.revealVideoUrl,
    defaultMusicTrackId: theme.defaultMusicTrackId,
    galleryAnimation: theme.galleryAnimation,
    sectionOrder:
      (theme.templates[0]?.sectionOrder as string[] | undefined) ?? [],
    previewImage: theme.previewImage,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Themes" meta={`${themes.length} themes`}>
        <ThemeFormDialog musicTracks={trackOptions} />
      </PageHeader>

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
                    {theme.isPremium && <Badge variant="gold">Premium</Badge>}
                    <ThemeFormDialog
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
                        decorAssets: normalizeThemeDecor(theme.decorAssets),
                        defaultMusicTrackId: theme.defaultMusicTrackId,
                        galleryAnimation: theme.galleryAnimation,
                        sectionOrder,
                      }}
                      musicTracks={trackOptions}
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
                          {colorway.isPremium && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                              Premium
                            </span>
                          )}
                          <ThemeColorwayDialog
                            themeId={theme.id}
                            themeName={theme.name}
                            fallbackPalette={palette}
                            fallbackFonts={theme.fontPairing as ThemeMixerSource["fontPairing"]}
                            fallbackDecor={normalizeThemeDecor(theme.decorAssets)}
                            fallbackSectionOrder={sectionOrder}
                            donorThemes={mixerSources}
                            musicTracks={trackOptions}
                            colorway={{
                              id: colorway.id,
                              name: colorway.name,
                              slug: colorway.slug,
                              colorPalette: cw,
                              previewImage: colorway.previewImage,
                              fontPairing:
                                (colorway.fontPairing as ThemeMixerSource["fontPairing"] | null) ?? null,
                              decorAssets: colorway.decorAssets
                                ? normalizeThemeDecor(colorway.decorAssets)
                                : null,
                              revealMode: colorway.revealMode,
                              revealVideoUrl: colorway.revealVideoUrl,
                              musicTrackId: colorway.musicTrackId,
                              galleryAnimation: colorway.galleryAnimation,
                              sectionOrder:
                                (colorway.sectionOrder as string[] | null) ?? null,
                              isPremium: colorway.isPremium,
                              sortOrder: colorway.sortOrder,
                            }}
                          />
                          <DeleteEntityButton
                            id={colorway.id}
                            confirmLabel={`Delete the ${colorway.name} variant?`}
                            action={deleteThemeColorwayAction}
                          />
                        </span>
                      );
                    })}
                    <ThemeColorwayDialog
                      themeId={theme.id}
                      themeName={theme.name}
                      fallbackPalette={palette}
                      fallbackFonts={theme.fontPairing as ThemeMixerSource["fontPairing"]}
                      fallbackDecor={normalizeThemeDecor(theme.decorAssets)}
                      fallbackSectionOrder={sectionOrder}
                      donorThemes={mixerSources}
                      musicTracks={trackOptions}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {theme.colorways.length} variant(s) · {theme._count.invitations} invitation(s) using this base theme
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
