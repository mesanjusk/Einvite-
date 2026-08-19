"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { TabNav } from "@/components/dashboard/tab-nav";

const TABS = [
  { href: "/dashboard/publish/theme", label: "Theme" },
  { href: "/dashboard/publish/sections", label: "Sections" },
  { href: "/dashboard/publish/pdf", label: "PDF" },
  { href: "/dashboard/publish/video", label: "Video" },
  { href: "/dashboard/publish/deploy", label: "Deploy & Share" },
];

export default function PublishLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Publish</h1>
        <div className="mt-4">
          <TabNav
            items={TABS.map((tab) => ({
              // The invitation being published rides in the query string, so
              // it has to survive a tab switch.
              href: qs ? `${tab.href}?${qs}` : tab.href,
              label: tab.label,
              active: pathname === tab.href,
            }))}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
