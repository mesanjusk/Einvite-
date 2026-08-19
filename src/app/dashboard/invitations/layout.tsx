"use client";

import { usePathname } from "next/navigation";

import { TabNav } from "@/components/dashboard/tab-nav";

// Browsing templates is how an invitation starts, so it belongs with the
// invitations rather than as its own place in the sidebar.
const TABS = [
  { href: "/dashboard/invitations", label: "My Invitations" },
  { href: "/dashboard/invitations/templates", label: "Templates" },
];

export default function InvitationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The create wizard is a flow, not a tab: showing the bar above it would
  // invite someone to navigate away mid-way through.
  if (pathname.startsWith("/dashboard/invitations/new")) return <>{children}</>;

  return (
    <div className="flex flex-col gap-6">
      <TabNav items={TABS.map((tab) => ({ ...tab, active: pathname === tab.href }))} />
      {children}
    </div>
  );
}
