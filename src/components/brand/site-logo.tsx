import { Heart } from "lucide-react";

import { SITE_NAME } from "@/config/site";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { icon: "size-4", iconWrap: "size-6", text: "text-sm" },
  md: { icon: "size-4.5", iconWrap: "size-8", text: "text-lg" },
  lg: { icon: "size-5", iconWrap: "size-10", text: "text-2xl" },
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
          "bg-primary text-primary-foreground inline-flex shrink-0 items-center justify-center rounded-full",
          s.iconWrap,
        )}
      >
        <Heart className={s.icon} fill="currentColor" strokeWidth={0} />
      </span>
      <span className={cn("font-display text-primary", s.text)}>{SITE_NAME}</span>
    </span>
  );
}
