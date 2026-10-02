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
                ? "bg-gradient-to-r from-[#8f1537] via-[#c3275d] to-[#df7b28] text-white shadow-[0_10px_24px_rgba(143,21,55,.18)]"
                : "text-[#6e3c42] hover:-translate-y-0.5 hover:bg-white/70 hover:text-[#8f1537] hover:shadow-sm",
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
