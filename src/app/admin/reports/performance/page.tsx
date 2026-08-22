import { parseReportParams, type ReportSearchParams } from "@/lib/report-params";
import {
  dominantCurrency,
  loadPerformanceInput,
  loadReportLines,
} from "@/lib/reports-data";
import {
  formatMoney,
  formatPercent,
  performanceByPeriod,
  summarize,
} from "@/lib/reports";
import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  Money,
  ReportTable,
  TruncationNotice,
} from "@/components/admin/reports/report-tables";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Performance: the operational half of the picture, per period, next to the
 * money the same period earned.
 *
 * Money alone does not say whether a good month came from doing more work or
 * from charging more for the same work, and the funnel alone does not say
 * whether any of it paid. One row carrying both is the only way to read
 * "we published nine and made this much" without holding two tables side by
 * side.
 */
export default async function PerformanceReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const filter = parseReportParams(await searchParams);
  const [{ lines, truncated }, funnel] = await Promise.all([
    loadReportLines(filter.range),
    loadPerformanceInput(filter.range),
  ]);

  const currency = dominantCurrency(lines);
  const totals = summarize(lines);
  const rows = performanceByPeriod(
    { lines, ...funnel },
    filter.range,
    filter.granularity,
    filter.offsetMinutes,
  ).reverse();

  const created = funnel.created.length;
  const published = funnel.published.length;
  const views = funnel.views.length;
  const guests = funnel.guests.length;
  const rsvps = funnel.rsvps.reduce((sum, row) => sum + (row.count ?? 1), 0);

  // Revenue per invitation created — not per order billed. It is the number
  // that says whether the drafts coming in are turning into money at all,
  // which the order-wise average deliberately cannot see.
  const revenuePerCreated = created === 0 ? 0 : Math.round(totals.revenue / created);

  const tiles = [
    { label: "Invitations created", value: created.toLocaleString() },
    { label: "Published", value: published.toLocaleString() },
    {
      label: "Publish rate",
      value: formatPercent(created === 0 ? null : published / created),
    },
    { label: "Page views", value: views.toLocaleString() },
    { label: "Guests added", value: guests.toLocaleString() },
    { label: "RSVP headcount", value: rsvps.toLocaleString() },
    { label: "Revenue", value: formatMoney(totals.revenue, currency) },
    { label: "Revenue / invitation", value: formatMoney(revenuePerCreated, currency) },
  ];

  return (
    <ReportShell active="performance" filter={filter}>
      {truncated && <TruncationNotice shown={lines.length} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {tile.label}
              </p>
              <p className="font-display mt-1 text-xl">{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportTable
        headers={[
          { label: "Period" },
          { label: "Created", align: "right" },
          { label: "Published", align: "right" },
          { label: "Publish rate", align: "right" },
          { label: "Views", align: "right" },
          { label: "Guests", align: "right" },
          { label: "RSVPs", align: "right" },
          { label: "RSVP / view", align: "right" },
          { label: "Revenue", align: "right" },
          { label: "Profit", align: "right" },
        ]}
        isEmpty={rows.length === 0}
        empty="No periods in this range."
      >
        {rows.map((row) => (
          <tr key={row.key} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium whitespace-nowrap">{row.label}</td>
            <td className="px-4 py-3 text-right tabular-nums">{row.created}</td>
            <td className="px-4 py-3 text-right tabular-nums">{row.published}</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatPercent(row.publishRate)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">{row.views}</td>
            <td className="px-4 py-3 text-right tabular-nums">{row.guests}</td>
            <td className="px-4 py-3 text-right tabular-nums">{row.rsvps}</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatPercent(row.rsvpRate)}
            </td>
            <td className="px-4 py-3 text-right">
              <Money minorUnits={row.revenue} currency={currency} />
            </td>
            <td className="px-4 py-3 text-right font-medium">
              <Money minorUnits={row.profit} currency={currency} />
            </td>
          </tr>
        ))}
      </ReportTable>
    </ReportShell>
  );
}
