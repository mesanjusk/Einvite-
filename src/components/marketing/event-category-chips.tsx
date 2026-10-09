import Link from "next/link";

import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { categoryIcon } from "@/components/marketing/category-icon";

const palette = [
  "from-[#d6b36d] to-[#8f6a32] text-[#211d18]",
  "from-[#5d3935] to-[#96645b] text-[#fff0d5]",
  "from-[#40544a] to-[#70816f] text-[#fff0d5]",
  "from-[#3d485d] to-[#72809a] text-[#fff0d5]",
  "from-[#604a31] to-[#a77d43] text-[#fff0d5]",
  "from-[#583c48] to-[#8a6272] text-[#fff0d5]",
  "from-[#50563b] to-[#7e865d] text-[#fff0d5]",
  "from-[#483d53] to-[#776487] text-[#fff0d5]",
];

export function EventCategoryChips({ activeSlug }: { activeSlug?: string }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {EVENT_CATEGORIES.map((category, index) => {
        const Icon = categoryIcon(category.icon);
        const isActive = category.slug === activeSlug;
        const tone = palette[index % palette.length];

        return (
          <Link
            key={category.slug}
            href={`/themes?category=${category.slug}`}
            className={[
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] font-bold tracking-wide uppercase shadow-sm transition duration-300 hover:-translate-y-0.5",
              isActive
                ? `border-[#ead193]/25 bg-gradient-to-r ${tone} shadow-[0_10px_24px_rgba(0,0,0,.18)]`
                : "border-violet-200 bg-white/80 text-[#6b5179] hover:border-violet-300 hover:bg-violet-50",
            ].join(" ")}
          >
            <span className={isActive ? "" : "text-[#a7844f]"}>
              <Icon className="size-3.5" strokeWidth={1.9} />
            </span>
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}
