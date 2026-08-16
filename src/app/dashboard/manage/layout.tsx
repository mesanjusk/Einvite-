"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/manage/guests", label: "Guests" },
  { href: "/dashboard/manage/rsvp", label: "RSVP" },
  { href: "/dashboard/manage/analytics", label: "Analytics" },
];

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Manage</h1>
        <div className="mt-4 flex gap-1 border-b">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={qs ? `${tab.href}?${qs}` : tab.href}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
