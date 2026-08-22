import Link from "next/link";

import {
  parseReportParams,
  withReportQuery,
  type ReportSearchParams,
} from "@/lib/report-params";
import { dominantCurrency, loadReportLines } from "@/lib/reports-data";
import {
  employeeWise,
  formatPercent,
  groupByPeriod,
  itemWise,
  summarize,
  vendorWise,
} from "@/lib/reports";
import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  Money,
  ReportTable,
  StatTiles,
  TruncationNotice,
} from "@/components/admin/reports/report-tables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * The profit report: what the period earned, what it cost, and what is left,
 * broken down by day, week or month. Everything else in this section is the
 * same money sliced a different way, so this page leads with the totals and
 * then points at the three biggest slices rather than repeating all of them.
 */
export default async function ReportsSummaryPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const filter = parseReportParams(await searchParams);
  const { lines, truncated } = await loadReportLines(filter.range);

  const currency = dominantCurrency(lines);
  const totals = summarize(lines);
  const periods = groupByPeriod(
    lines,
    filter.range,
    filter.granularity,
    filter.offsetMinutes,
  );

  // The "…wise" reports order by revenue, but this is the profit page and
  // these three cards print profit — so they are re-sorted by the number they
  // actually show. A top-five list ordered by a column it does not display is
  // a small way to mislead.
  const best = (rows: { label: string; profit: number }[]) =>
    [...rows].sort((a, b) => b.profit - a.profit).slice(0, 5);
  const topItems = best(itemWise(lines));
  const topVendors = best(vendorWise(lines));
  const topEmployees = best(employeeWise(lines));

  // Newest period first: the question a summary is opened with is almost
  // always "how are we doing now", not "how did we start".
  const rows = [...periods].reverse();

  return (
    <ReportShell active="summary" filter={filter}>
      {truncated && <TruncationNotice shown={lines.length} />}

      <StatTiles totals={totals} currency={currency} />

      <ReportTable
        headers={[
          { label: "Period" },
          { label: "Orders", align: "right" },
          { label: "Qty", align: "right" },
          { label: "Revenue", align: "right" },
          { label: "Cost", align: "right" },
          { label: "Profit", align: "right" },
          { label: "Margin", align: "right" },
        ]}
        isEmpty={rows.length === 0}
        empty="No periods in this range."
      >
        {rows.map((period) => (
          <tr key={period.key} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium whitespace-nowrap">{period.label}</td>
            <td className="px-4 py-3 text-right tabular-nums">{period.orders}</td>
            <td className="px-4 py-3 text-right tabular-nums">{period.quantity}</td>
            <td className="px-4 py-3 text-right">
              <Money minorUnits={period.revenue} currency={currency} />
            </td>
            <td className="text-muted-foreground px-4 py-3 text-right">
              <Money minorUnits={period.cost} currency={currency} />
            </td>
            <td className="px-4 py-3 text-right font-medium">
              <Money minorUnits={period.profit} currency={currency} />
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatPercent(period.margin)}
            </td>
          </tr>
        ))}
      </ReportTable>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopList
          title="Top items"
          href={withReportQuery("/admin/reports/items", filter)}
          rows={topItems}
          currency={currency}
        />
        <TopList
          title="Top vendors"
          href={withReportQuery("/admin/reports/vendors", filter)}
          rows={topVendors}
          currency={currency}
        />
        <TopList
          title="Top performers"
          href={withReportQuery("/admin/reports/employees", filter)}
          rows={topEmployees}
          currency={currency}
        />
      </div>
    </ReportShell>
  );
}

function TopList({
  title,
  href,
  rows,
  currency,
}: {
  title: string;
  href: string;
  rows: { label: string; profit: number }[];
  currency: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing recorded yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="truncate">{row.label}</span>
              <Money minorUnits={row.profit} currency={currency} />
            </div>
          ))
        )}
        <Link href={href} className="text-primary mt-2 text-xs hover:underline">
          See the full report
        </Link>
      </CardContent>
    </Card>
  );
}
