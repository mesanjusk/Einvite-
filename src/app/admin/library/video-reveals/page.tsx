import type { Metadata } from "next";

import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeAssetLibraryManager } from "@/components/admin/theme-asset-library-manager";

export const metadata: Metadata = { title: "Reveal Video Gallery" };

export default async function RevealVideoGalleryPage() {
  const assets = await db.themeLibraryAsset.findMany({
    where: { kind: "REVEAL_VIDEO" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reveal Video Gallery" meta={`${assets.length} videos`} />
      <ThemeAssetLibraryManager
        kind="REVEAL_VIDEO"
        initialAssets={assets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          kind: asset.kind,
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl,
          category: asset.category,
          community: asset.community,
          sortOrder: asset.sortOrder,
        }))}
      />
    </div>
  );
}
