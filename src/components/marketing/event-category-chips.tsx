import Link from "next/link";

import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { categoryIcon } from "@/components/marketing/category-icon";

/** Compact celebration filters for the public template marketplace. */
export function EventCategoryChips({ activeSlug }: { activeSlug?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {EVENT_CATEGORIES.map((category) => {
        const Icon = categoryIcon(category.icon);
        const isActive = category.slug === activeSlug;

        return (
          <Link
            key={category.slug}
            href={`/themes?category=${category.slug}`}
            className={
              isActive
                ? "flex shrink-0 items-center gap-1.5 rounded-full border border-[#65172e] bg-[#65172e] px-4 py-2 text-[10px] font-extrabold tracking-wide text-white uppercase shadow-sm transition sm:text-xs"
                : "flex shrink-0 items-center gap-1.5 rounded-full border border-[#eadfd5] bg-white px-4 py-2 text-[10px] font-bold tracking-wide text-[#745c55] uppercase shadow-sm transition hover:border-[#9f6977] hover:text-[#65172e] sm:text-xs"
            }
          >
            <Icon className="size-3.5" strokeWidth={1.7} />
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}
