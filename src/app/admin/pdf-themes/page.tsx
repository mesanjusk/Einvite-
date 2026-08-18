import Link from "next/link";
import type { Metadata } from "next";
import { LayoutTemplate } from "lucide-react";

import { db } from "@/lib/db";
import { ThemeFormDialog } from "@/components/admin/theme-form-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { deleteThemeAction } from "@/lib/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PdfTemplatePage } from "@/lib/validations/pdf-template";

export const metadata: Metadata = { title: "Manage PDF Themes" };

export default async function AdminPdfThemesPage() {
  const themes = await db.theme.findMany({
    where: { type: "PDF" },
    orderBy: { sortOrder: "asc" },
    include: { templates: true, _count: { select: { pdfInvitations: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Manage PDF Themes</h1>
          <p className="text-muted-foreground text-sm">
            Design the multi-page layout couples download as a PDF — background images/colors
            plus text boxes bound to their details, independent from the website theme.
          </p>
        </div>
        <ThemeFormDialog type="PDF" />
      </div>

      {themes.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No PDF themes yet. Couples printing their invitation fall back to their website
            theme until you add one.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const palette = theme.colorPalette as { primary: string; accent: string };
          const sectionOrder = (theme.templates[0]?.sectionOrder as string[] | undefined) ?? [];
          const pageCount = ((theme.templates[0]?.pages as PdfTemplatePage[] | null) ?? []).length;
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
                      type="PDF"
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
                      confirmLabel={`Delete the ${theme.name} PDF theme? This can't be undone.`}
                      action={deleteThemeAction}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {theme._count.pdfInvitations} invitation(s) using this PDF theme ·{" "}
                  {pageCount} page{pageCount === 1 ? "" : "s"} designed
                </p>
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href={`/admin/pdf-themes/${theme.id}`}>
                    <LayoutTemplate className="size-4" />
                    Design pages
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
