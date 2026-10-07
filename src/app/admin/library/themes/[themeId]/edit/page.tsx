import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { ThemeFormDialog } from "@/components/admin/theme-form-dialog";

export const metadata: Metadata = { title: "Edit Theme" };

export default async function EditThemePage({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = await params;

  const [theme, revealAssets, imageAssets, contentItems] = await Promise.all([
    db.theme.findUnique({
      where: { id: themeId },
      include: { templates: { orderBy: { createdAt: "asc" } } },
    }),
    db.themeLibraryAsset.findMany({
      where: { kind: "REVEAL_VIDEO" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    db.themeLibraryAsset.findMany({
      where: { kind: "IMAGE" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    db.themeContentItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!theme) notFound();

  const sectionOrder =
    (theme.templates[0]?.sectionOrder as string[] | undefined) ?? [
      "ENVELOPE",
      "HERO",
      "COUNTDOWN",
      "TIMELINE",
      "GALLERY",
      "VENUE",
      "RSVP",
      "THANK_YOU",
    ];

  return (
    <ThemeFormDialog
      standalone
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
        eventCategories: theme.eventCategories,
        isPremium: theme.isPremium,
        sortOrder: theme.sortOrder,
        colorPalette: theme.colorPalette as never,
        fontPairing: theme.fontPairing as never,
        content: theme.content as never,
        decorAssets: theme.decorAssets as never,
        sectionOrder,
      }}
      revealVideoLibrary={revealAssets.map((asset) => ({
        label: asset.name,
        url: asset.url,
        thumbnailUrl: asset.thumbnailUrl,
      }))}
      imageLibrary={imageAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        url: asset.url,
        thumbnailUrl: asset.thumbnailUrl,
        category: asset.category,
      }))}
      contentLibrary={contentItems.map((item) => ({
        id: item.id,
        title: item.title,
        text: item.text,
        community: item.community,
        section: item.section,
        role: item.role,
        previewImage: item.previewImage,
      }))}
    />
  );
}
