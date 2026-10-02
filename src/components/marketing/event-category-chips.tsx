import Link from "next/link";

import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { categoryIcon } from "@/components/marketing/category-icon";

const palette = [
  "from-[#8f1537] to-[#c72c61] text-white",
  "from-[#ee8b24] to-[#f2bd4f] text-[#542516]",
  "from-[#0f766e] to-[#22a38b] text-white",
  "from-[#7c2d92] to-[#bd3f8b] text-white",
  "from-[#b45309] to-[#f59e0b] text-white",
  "from-[#be123c] to-[#fb7185] text-white",
  "from-[#166534] to-[#65a30d] text-white",
  "from-[#6d28d9] to-[#a855f7] text-white",
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
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] font-black tracking-wide uppercase shadow-sm transition duration-200 hover:-translate-y-0.5 sm:text-xs",
              isActive
                ? `border-transparent bg-gradient-to-r ${tone} shadow-[0_10px_24px_rgba(111,35,53,.2)]`
                : "border-[#efcf94]/55 bg-white/78 text-[#754038] backdrop-blur hover:bg-[#fff0c5]",
            ].join(" ")}
          >
            <span className={isActive ? "" : "text-[#d17f1f]"}>
              <Icon className="size-3.5" strokeWidth={1.9} />
            </span>
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}
