import * as React from "react";

import { formatMoney, formatPercent, type GroupRow, type Totals } from "@/lib/reports";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The furniture every report page is built from. Kept as server components
 * with no state: a report is a rendered fact, and making the tables
 * interactive would mean shipping the whole dataset to the browser to
 * re-sort what the server already sorted.
 */

export function StatTiles({
  totals,
  currency,
  extra = [],
}: {
  totals: Totals;
  currency: string;
  extra?: { label: string; value: string }[];
}) {
  const tiles = [
    { label: "Revenue", value: formatMoney(totals.revenue, currency) },
    { label: "Cost", value: formatMoney(totals.cost, currency) },
    {
      label: "Profit",
      value: formatMoney(totals.profit, currency),
      // A loss should be visible before the minus sign is read.
      tone: totals.profit < 0 ? ("negative" as const) : ("positive" as const),
    },
    { label: "Margin", value: formatPercent(totals.margin) },
    { label: "Orders", value: String(totals.orders) },
    { label: "Items sold", value: String(totals.quantity) },
    ...extra,
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {tile.label}
            </p>
            <p
              className={cn(
                "font-display mt-1 text-xl",
                "tone" in tile && tile.tone === "negative" && "text-destructive",
              )}
            >
              {tile.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReportTable({
  headers,
  children,
  empty,
  isEmpty,
}: {
  headers: { label: string; align?: "left" | "right" }[];
  children: React.ReactNode;
  empty: string;
  isEmpty: boolean;
}) {
  return (
    <Card className="py-0">
      <CardContent className="overflow-x-auto p-0">
        {isEmpty ? (
          <p className="text-muted-foreground p-8 text-center text-sm">{empty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-left text-xs uppercase">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.label}
                    className={cn(
                      "px-4 py-3 font-medium whitespace-nowrap",
                      header.align === "right" && "text-right",
                    )}
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export function Money({
  minorUnits,
  currency,
}: {
  minorUnits: number;
  currency: string;
}) {
  return (
    <span className={cn("tabular-nums", minorUnits < 0 && "text-destructive")}>
      {formatMoney(minorUnits, currency)}
    </span>
  );
}

/**
 * The share bar behind a row's label. Deliberately a background rather than a
 * separate column: the eye picks the big earners out of forty rows far faster
 * from a bar than from forty percentages.
 */
export function ShareBar({ share }: { share: number }) {
  const percent = Math.max(0, Math.min(1, share)) * 100;
  return (
    <span
      className="bg-muted mt-1 flex h-1 w-24 overflow-hidden rounded-full"
      aria-hidden
    >
      <span className="bg-accent h-full" style={{ width: `${percent}%` }} />
    </span>
  );
}

/**
 * The body shared by the four "…wise" reports. They differ only in what a row
 * is called and what the label links to, so the columns — quantity, revenue,
 * cost, profit, margin, share — live here once.
 */
export function GroupRows({
  rows,
  currency,
  renderLabel,
}: {
  rows: GroupRow[];
  currency: string;
  renderLabel?: (row: GroupRow) => React.ReactNode;
}) {
  return (
    <>
      {rows.map((row) => (
        <tr key={row.key} className="border-b last:border-0">
          <td className="px-4 py-3">
            <div className="font-medium">
              {renderLabel ? renderLabel(row) : row.label}
            </div>
            {row.detail && (
              <div className="text-muted-foreground text-xs">
                {humanKind(row.detail)}
              </div>
            )}
            <ShareBar share={row.revenueShare} />
          </td>
          <td className="px-4 py-3 text-right tabular-nums">{row.orders}</td>
          <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
          <td className="px-4 py-3 text-right">
            <Money minorUnits={row.revenue} currency={currency} />
          </td>
          <td className="text-muted-foreground px-4 py-3 text-right">
            <Money minorUnits={row.cost} currency={currency} />
          </td>
          <td className="px-4 py-3 text-right font-medium">
            <Money minorUnits={row.profit} currency={currency} />
          </td>
          <td className="px-4 py-3 text-right tabular-nums">
            {formatPercent(row.margin)}
          </td>
        </tr>
      ))}
    </>
  );
}

export const GROUP_HEADERS = (first: string) =>
  [
    { label: first },
    { label: "Orders", align: "right" as const },
    { label: "Qty", align: "right" as const },
    { label: "Revenue", align: "right" as const },
    { label: "Cost", align: "right" as const },
    { label: "Profit", align: "right" as const },
    { label: "Margin", align: "right" as const },
  ] satisfies { label: string; align?: "left" | "right" }[];

/** `PDF_THEME` reads as machinery; `PDF theme` reads as a thing that was sold. */
export function humanKind(kind: string): string {
  return kind.charAt(0) + kind.slice(1).toLowerCase().replaceAll("_", " ");
}

/**
 * The banner shown when the range holds more lines than were read. Silence
 * here would mean an admin acting on a total that is quietly short.
 */
export function TruncationNotice({ shown }: { shown: number }) {
  return (
    <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-4 py-3 text-sm">
      This range holds more order lines than one report can read. The totals below cover
      the {shown.toLocaleString()} most recent lines only — narrow the dates for exact
      figures.
    </p>
  );
}
