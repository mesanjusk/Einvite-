import type { Metadata } from "next";

import { db } from "@/lib/db";
import { ThemeFormDialog } from "@/components/admin/theme-form-dialog";

export const metadata: Metadata = { title: "New Theme" };

export default async function NewThemePage() {
  const [revealAssets, imageAssets, contentItems] = await Promise.all([
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

  return (
    <ThemeFormDialog
      standalone
      type="WEBSITE"
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
