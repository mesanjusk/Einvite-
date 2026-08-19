"use client";

import { usePathname } from "next/navigation";

import { TabNav } from "@/components/dashboard/tab-nav";

// Four separate sidebar entries for what is one job — curating the designs
// couples pick from — now sit behind one entry and these tabs.
const TABS = [
  { href: "/admin/library/themes", label: "Website Themes" },
  { href: "/admin/library/pdf-themes", label: "PDF Themes" },
  { href: "/admin/library/video-templates", label: "Video Templates" },
  { href: "/admin/library/music", label: "Music" },
];

export default function AdminLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Content Library</h1>
        <div className="mt-4">
          <TabNav
            items={TABS.map((tab) => ({
              ...tab,
              active: pathname.startsWith(tab.href),
            }))}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
