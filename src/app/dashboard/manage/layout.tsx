"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { TabNav } from "@/components/dashboard/tab-nav";

const TABS = [
  { href: "/dashboard/manage/guests", label: "Guests" },
  { href: "/dashboard/manage/rsvp", label: "RSVP" },
  { href: "/dashboard/manage/analytics", label: "Analytics" },
];

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Manage</h1>
        <div className="mt-4">
          <TabNav
            items={TABS.map((tab) => ({
              // The invitation being managed rides in the query string, so it
              // has to survive a tab switch.
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
