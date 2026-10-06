"use client";

import Link from "next/link";

import { dashboardNav, adminNav } from "@/config/dashboard-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SiteLogo } from "@/components/brand/site-logo";
import { Separator } from "@/components/ui/separator";

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-[#cbb6da]/30 bg-[linear-gradient(180deg,#4d3a59_0%,#634a72_52%,#4b3856_100%)] p-4 text-[#f5eafd] lg:flex">
      <div className="royal-dust pointer-events-none absolute inset-0 opacity-35" />
      <div className="royal-orbit royal-orbit-sidebar pointer-events-none" />

      <Link href="/" className="relative z-10 mb-7 flex px-2">
        <SiteLogo size="md" showName />
      </Link>

      <div className="relative z-10">
        <SidebarNav items={dashboardNav} />
      </div>

      {isAdmin && (
        <>
          <Separator className="my-4 bg-[#d9c6e6]/22" />
          <div className="relative z-10">
            <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.18em] text-[#e4c980]/80 uppercase">
              Admin
            </p>
            <SidebarNav items={adminNav} />
          </div>
        </>
      )}
    </aside>
  );
}
