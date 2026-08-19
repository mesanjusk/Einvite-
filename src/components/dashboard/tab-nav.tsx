import Link from "next/link";

import { cn } from "@/lib/utils";

export type TabNavItem = {
  href: string;
  label: string;
  active: boolean;
};

/**
 * The one tab bar. Sections that used to be separate sidebar entries are
 * grouped behind these instead, so the sidebar lists places rather than every
 * page in the app.
 *
 * Deliberately presentational — it takes `active` rather than reading the
 * pathname — so a client layout can drive it from `usePathname` and a server
 * page can drive it from its own search params without two components.
 *
 * The row bleeds to the screen edge on small viewports and scrolls sideways,
 * rather than wrapping five labels onto three lines on a phone.
 */
export function TabNav({ items }: { items: TabNavItem[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <nav className="flex w-max min-w-full gap-1 border-b">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              item.active
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
