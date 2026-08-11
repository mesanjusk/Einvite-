import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A simple CSS phone frame used to showcase invitation previews on the homepage. */
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
        "relative mx-auto aspect-[9/19] w-full max-w-[260px] rounded-[2.2rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-2xl",
        className,
      )}
    >
      <div className="absolute top-0 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-b-xl bg-neutral-900" />
      <div className="relative size-full overflow-hidden rounded-[1.7rem] bg-white">{children}</div>
      <div className="absolute bottom-1.5 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-neutral-700" />
    </div>
  );
}
