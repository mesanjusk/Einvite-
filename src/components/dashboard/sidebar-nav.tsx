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
                ? "border border-[#d9c3e7]/45 bg-[linear-gradient(135deg,#8e6aa3,#b590c7_55%,#d8b56d)] text-white shadow-[0_10px_28px_rgba(111,77,132,.2)]"
                : "border border-transparent text-[#eadff0] hover:-translate-y-0.5 hover:border-[#d8c2e5]/25 hover:bg-white/[0.07] hover:text-white",
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
