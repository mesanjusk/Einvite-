"use client";

import Link from "next/link";

import { dashboardNav, adminNav } from "@/config/dashboard-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SiteLogo } from "@/components/brand/site-logo";
import { Separator } from "@/components/ui/separator";

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-[#c6a15b]/20 bg-[linear-gradient(180deg,#1b1a18_0%,#24211e_50%,#171614_100%)] p-4 text-[#eadaba] lg:flex">
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
          <Separator className="my-4 bg-[#c6a15b]/18" />
          <div className="relative z-10">
            <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.18em] text-[#b99a5d]/70 uppercase">
              Admin
            </p>
            <SidebarNav items={adminNav} />
          </div>
        </>
      )}
    </aside>
  );
}
