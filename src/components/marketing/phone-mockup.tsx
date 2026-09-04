import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Slim CSS phone frame for marketplace invitation previews. */
export function PhoneMockup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[9/18.8] w-full max-w-[260px] rounded-[1.55rem] border-[3px] border-[#2d2929] bg-[#2d2929] shadow-xl",
        className,
      )}
    >
      <div className="absolute left-1/2 top-1.5 z-30 size-1.5 -translate-x-1/2 rounded-full bg-[#151313] ring-1 ring-white/25" />
      <div className="relative size-full overflow-hidden rounded-[1.35rem] bg-white">{children}</div>
    </div>
  );
}
