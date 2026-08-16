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
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t backdrop-blur lg:hidden">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href !== "/dashboard" && pathname.startsWith(tab.href.split("/").slice(0, 3).join("/")));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
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
