"use client";

import Link from "next/link";

import { dashboardNav, adminNav } from "@/config/dashboard-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SiteLogo } from "@/components/brand/site-logo";
import { Separator } from "@/components/ui/separator";

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 flex-col border-r p-4 lg:flex">
      <Link href="/" className="mb-6 flex px-2">
        <SiteLogo size="md" />
      </Link>

      <SidebarNav items={dashboardNav} />

      {isAdmin && (
        <>
          <Separator className="my-4" />
          <SidebarNav items={adminNav} />
        </>
      )}
    </aside>
  );
}
