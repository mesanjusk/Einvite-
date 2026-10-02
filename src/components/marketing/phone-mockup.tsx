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
        "relative mx-auto aspect-[9/18.8] w-full max-w-[260px] rounded-[1.7rem] border-[3px] border-[#8d6b34] bg-[linear-gradient(180deg,#3a342c,#171513)] shadow-xl",
        className,
      )}
    >
      <div className="absolute left-1/2 top-1.5 z-30 flex h-2.5 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-[#11100e] shadow-inner">
        <span className="size-1.5 rounded-full bg-[#050505] ring-1 ring-white/20" />
      </div>
      <div className="relative size-full overflow-hidden rounded-[1.5rem] bg-white">{children}</div>
    </div>
  );
}
