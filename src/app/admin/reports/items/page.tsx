import { parseReportParams, type ReportSearchParams } from "@/lib/report-params";
import { dominantCurrency, loadReportLines } from "@/lib/reports-data";
import { groupByPeriod, itemWise, summarize } from "@/lib/reports";
import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  GROUP_HEADERS,
  GroupRows,
  Money,
  ReportTable,
  StatTiles,
  TruncationNotice,
} from "@/components/admin/reports/report-tables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Item wise: what actually sells, and what it earns after the cost of making
 * it. A theme that shows up on every second order but carries a vendor bill
 * with it can easily earn less than a quiet one that costs nothing — which is
 * the whole reason this table prints cost and margin next to volume.
 */
export default async function ItemWiseReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const filter = parseReportParams(await searchParams);
  const { lines, truncated } = await loadReportLines(filter.range);

  const currency = dominantCurrency(lines);
  const rows = itemWise(lines);
  const totals = summarize(lines);

  // The best seller's own trend, so a falling item is visible from this page
  // rather than only from the summary.
  const leader = rows[0];
  const leaderPeriods = leader
    ? groupByPeriod(
        lines.filter((line) => `${line.kind}:${line.itemKey}` === leader.key),
        filter.range,
        filter.granularity,
        filter.offsetMinutes,
      )
    : [];

  return (
    <ReportShell
      active="items"
      filter={filter}
      meta={`${filter.range.label} · ${rows.length} item${rows.length === 1 ? "" : "s"} sold`}
    >
      {truncated && <TruncationNotice shown={lines.length} />}

      <StatTiles
        totals={totals}
        currency={currency}
        extra={[{ label: "Distinct items", value: String(rows.length) }]}
      />

      <ReportTable
        headers={GROUP_HEADERS("Item")}
        isEmpty={rows.length === 0}
        empty="No items sold in this range. Record order lines from an invitation to fill this in."
      >
        <GroupRows rows={rows} currency={currency} />
      </ReportTable>

      {leader && leaderPeriods.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{leader.label} over time</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-left text-xs uppercase">
                <tr>
                  <th className="py-2 pr-4 font-medium">Period</th>
                  <th className="py-2 pr-4 text-right font-medium">Qty</th>
                  <th className="py-2 pr-4 text-right font-medium">Revenue</th>
                  <th className="py-2 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {leaderPeriods.map((period) => (
                  <tr key={period.key} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">{period.label}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {period.quantity}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <Money minorUnits={period.revenue} currency={currency} />
                    </td>
                    <td className="py-2 text-right">
                      <Money minorUnits={period.profit} currency={currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </ReportShell>
  );
}
