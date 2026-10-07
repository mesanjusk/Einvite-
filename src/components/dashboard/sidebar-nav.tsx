"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/dashboard-nav";

export function SidebarNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const base = item.match ?? item.href;
        const isActive = item.exact
          ? pathname === base
          : pathname === base || pathname.startsWith(`${base}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
              isActive
                ? "border border-violet-300/70 bg-violet-100 text-[#5a3d6d] shadow-[0_8px_24px_rgba(103,75,123,.10)]"
                : "border border-transparent text-[#695478] hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-[#4b3659]",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
