"use client";

import Link from "next/link";

import { dashboardNav, adminNav } from "@/config/dashboard-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SiteLogo } from "@/components/brand/site-logo";
import { Separator } from "@/components/ui/separator";

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-violet-200/70 bg-white p-4 text-[#4b3659] lg:flex">
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
          <Separator className="my-4 bg-violet-200/70" />
          <div className="relative z-10">
            <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.18em] text-[#8a6d9d] uppercase">
              Admin
            </p>
            <SidebarNav items={adminNav} />
          </div>
        </>
      )}
    </aside>
  );
}
