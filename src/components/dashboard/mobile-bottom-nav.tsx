"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LayoutTemplate, Users, Rocket } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/invitations", label: "Invites", icon: LayoutTemplate },
  { href: "/dashboard/manage/guests", label: "Manage", icon: Users },
  { href: "/dashboard/publish/deploy", label: "Publish", icon: Rocket },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-stretch overflow-hidden rounded-[1.4rem] border border-[#c8a45e]/35 bg-[#211f1c]/94 shadow-[0_18px_44px_rgba(0,0,0,.3)] backdrop-blur-2xl lg:hidden">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href !== "/dashboard" && pathname.startsWith(tab.href.split("/").slice(0, 3).join("/")));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all",
              active
                ? "bg-gradient-to-t from-[#d4ad63]/25 to-transparent text-[#f0cf89]"
                : "text-[#b8a98e]",
            )}
          >
            <tab.icon className="size-5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
