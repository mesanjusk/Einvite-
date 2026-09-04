import { Heart } from "lucide-react";

import { SITE_NAME } from "@/config/site";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { icon: "size-3.5", iconWrap: "size-6", text: "text-sm" },
  md: { icon: "size-4", iconWrap: "size-8", text: "text-lg" },
  lg: { icon: "size-4.5", iconWrap: "size-10", text: "text-2xl" },
} as const;

export function SiteLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-[#d8c2b3] bg-[#fff8ef] text-[#6b1d35] shadow-[0_3px_12px_rgba(98,42,55,0.08)]",
          s.iconWrap,
        )}
      >
        <Heart className={s.icon} fill="none" strokeWidth={1.5} />
      </span>
      <span className={cn("font-display tracking-[-0.02em] text-[#61223a]", s.text)}>{SITE_NAME}</span>
    </span>
  );
}
