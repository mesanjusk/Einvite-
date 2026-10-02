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
    <nav className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-stretch overflow-hidden rounded-[1.4rem] border border-[#efc778]/40 bg-[#fff9ed]/92 shadow-[0_16px_38px_rgba(92,30,49,.18)] backdrop-blur-2xl lg:hidden">
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
              active ? "bg-gradient-to-t from-[#ffe4c2] to-transparent text-[#991b4d]" : "text-[#8b6b62]",
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
