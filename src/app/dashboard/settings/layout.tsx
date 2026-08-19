"use client";

import { usePathname } from "next/navigation";

import { TabNav } from "@/components/dashboard/tab-nav";

// Billing is one page about the signed-in account, the same as the profile
// form — one sidebar entry, two tabs, rather than two entries.
const TABS = [
  { href: "/dashboard/settings", label: "Profile" },
  { href: "/dashboard/settings/billing", label: "Billing" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Settings</h1>
        <div className="mt-4">
          <TabNav
            items={TABS.map((tab) => ({ ...tab, active: pathname === tab.href }))}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
