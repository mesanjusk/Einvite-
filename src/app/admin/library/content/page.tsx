import type { Metadata } from "next";

import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeContentLibraryManager } from "@/components/admin/theme-content-library-manager";

export const metadata: Metadata = { title: "Content Library" };

export default async function ThemeContentLibraryPage() {
  const items = await db.themeContentItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Content Library" meta={`${items.length} saved items`} />
      <ThemeContentLibraryManager
        initialItems={items.map((item) => ({
          id: item.id,
          title: item.title,
          community: item.community,
          section: item.section,
          role: item.role,
          text: item.text,
          previewImage: item.previewImage,
          sortOrder: item.sortOrder,
        }))}
      />
    </div>
  );
}
