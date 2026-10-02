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
                ? "border border-[#d7b36c]/35 bg-[linear-gradient(135deg,#cda65d,#f0d18d_55%,#b8893e)] text-[#241f19] shadow-[0_10px_28px_rgba(201,163,91,.18)]"
                : "border border-transparent text-[#d8c7a7] hover:-translate-y-0.5 hover:border-[#c8a45e]/20 hover:bg-white/[0.05] hover:text-[#f3d99d]",
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
