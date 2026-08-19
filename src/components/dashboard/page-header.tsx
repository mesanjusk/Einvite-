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
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display truncate text-2xl">{title}</h1>
        {meta && <p className="text-muted-foreground mt-0.5 text-xs">{meta}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
