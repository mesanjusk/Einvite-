import Link from "next/link";

import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { categoryIcon } from "@/components/marketing/category-icon";

const circle =
  "flex size-16 items-center justify-center rounded-full border transition-transform sm:size-18";

/**
 * Every celebration the studio has designs for. Choosing a category now opens
 * the template browser first, so visitors see and preview real designs before
 * they create anything. The live editor starts only after a design is chosen.
 */
export function EventCategoryChips({ activeSlug }: { activeSlug?: string }) {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:flex sm:flex-wrap sm:justify-center sm:gap-6">
      {EVENT_CATEGORIES.map((category) => {
        const Icon = categoryIcon(category.icon);
        const isActive = category.slug === activeSlug;

        return (
          <Link
            key={category.slug}
            href={`/themes?category=${category.slug}`}
            className="group focus-visible:ring-primary flex flex-col items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span
              className={
                isActive
                  ? `${circle} border-primary bg-primary text-primary-foreground group-hover:scale-105`
                  : `${circle} bg-card text-muted-foreground group-hover:border-primary group-hover:text-foreground group-hover:scale-105`
              }
            >
              <Icon className="size-6" strokeWidth={1.5} />
            </span>
            <span className="text-center text-xs font-medium">{category.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
