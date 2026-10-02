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
    <div className="royal-panel flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] border border-[#c8a45e]/28 bg-[#fffaf0]/72 px-5 py-4 shadow-[0_14px_38px_rgba(55,43,28,.08)] backdrop-blur">
      <div className="min-w-0">
        <div className="mb-1 text-[9px] font-bold tracking-[0.22em] text-[#a67f3f] uppercase">
          SK Digital Studio
        </div>
        <h1 className="font-display royal-title-dark truncate text-2xl sm:text-3xl">{title}</h1>
        {meta && <p className="text-muted-foreground mt-0.5 text-xs">{meta}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
