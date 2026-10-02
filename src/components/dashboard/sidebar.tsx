"use client";

import Link from "next/link";

import { dashboardNav, adminNav } from "@/config/dashboard-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SiteLogo } from "@/components/brand/site-logo";
import { Separator } from "@/components/ui/separator";

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-[#f1c777]/30 bg-[linear-gradient(180deg,#fff8e9_0%,#fff0e5_48%,#fbe9ee_100%)] p-4 text-[#5a2936] lg:flex">
      <div className="wedding-orb pointer-events-none -left-16 top-24 size-36 bg-[#f0a42e]/20" />
      <div className="wedding-orb pointer-events-none -right-20 bottom-24 size-40 bg-[#d92e66]/15" />
      <Link href="/" className="relative z-10 mb-6 flex px-2">
        <SiteLogo size="md" />
      </Link>

      <div className="relative z-10"><SidebarNav items={dashboardNav} /></div>

      {isAdmin && (
        <>
          <Separator className="my-4" />
          <div className="relative z-10"><SidebarNav items={adminNav} /></div>
        </>
      )}
    </aside>
  );
}
