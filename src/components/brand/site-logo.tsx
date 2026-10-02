import Image from "next/image";

import { SITE_LOGO_PATH, SITE_NAME } from "@/config/site";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { frame: "size-8", pixels: 32 },
  md: { frame: "size-11", pixels: 44 },
  lg: { frame: "size-[4.75rem]", pixels: 76 },
} as const;

export function SiteLogo({
  size = "md",
  className,
  showName = false,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  showName?: boolean;
}) {
  const s = SIZES[size];

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className={cn("royal-logo-frame group relative shrink-0 overflow-hidden rounded-[22%]", s.frame)}>
        <Image
          src={SITE_LOGO_PATH}
          alt={SITE_NAME}
          width={s.pixels}
          height={s.pixels}
          priority={size !== "sm"}
          className="size-full object-cover"
        />
        <span className="royal-logo-glint" aria-hidden="true" />
      </span>

      {showName && (
        <span className="royal-wordmark">
          <span className="block text-[0.58em] font-semibold tracking-[0.28em] uppercase text-[#b78c45]">
            SK
          </span>
          <span className="block -mt-0.5 font-display leading-none text-[#f4dfae]">
            Digital
          </span>
        </span>
      )}
      <span className="sr-only">{SITE_NAME}</span>
    </span>
  );
}
