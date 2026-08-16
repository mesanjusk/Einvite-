"use client";

import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "Wedding", href: "/create", live: true },
  { label: "Ring Ceremony", live: false },
  { label: "Engagement", live: false },
  { label: "Birthday", live: false },
  { label: "Naming Ceremony", live: false },
  { label: "Anniversary", live: false },
  { label: "Housewarming", live: false },
  { label: "Baby Shower", live: false },
] as const;

export function EventCategoryChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {CATEGORIES.map((category) =>
        category.live ? (
          <Link
            key={category.label}
            href={category.href}
            className="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors bg-primary text-primary-foreground border-primary"
          >
            {category.label}
          </Link>
        ) : (
          <button
            key={category.label}
            type="button"
            onClick={() =>
              toast(`${category.label} invitations are coming soon`, {
                description: "Wedding invitations are live today — more event types are on the way.",
              })
            }
            className={cn(
              "text-muted-foreground hover:border-primary hover:text-foreground rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            )}
          >
            {category.label}
          </button>
        ),
      )}
    </div>
  );
}
