import * as React from "react";

/**
 * Standard page heading: title on the left, actions on the right. `meta` is
 * for a short factual line (a count, a status) — not explanatory prose, which
 * these pages deliberately don't carry.
 */
export function PageHeader({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] border border-[#efc778]/30 bg-white/58 px-5 py-4 shadow-[0_12px_32px_rgba(108,38,56,.07)] backdrop-blur">
      <div className="min-w-0">
        <div className="mb-1 font-script text-2xl text-[#d17f1f]">Celebrate beautifully</div>
        <h1 className="font-display wedding-title truncate text-2xl sm:text-3xl">{title}</h1>
        {meta && <p className="text-muted-foreground mt-0.5 text-xs">{meta}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
