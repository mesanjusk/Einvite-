import Link from "next/link";

import { parseReportParams, type ReportSearchParams } from "@/lib/report-params";
import { dominantCurrency, loadReportLines } from "@/lib/reports-data";
import { formatMoney, orderWise, summarize } from "@/lib/reports";
import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  GROUP_HEADERS,
  GroupRows,
  ReportTable,
  StatTiles,
  TruncationNotice,
} from "@/components/admin/reports/report-tables";

export const dynamic = "force-dynamic";

/**
 * Order wise: one row per invitation billed in the range, with the lines on it
 * totalled. Each label links back to the invitation, because the question this
 * table raises — "why did that one cost so much?" — is answered on the
 * invitation's own page, where the individual lines are listed.
 */
export default async function OrderWiseReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const filter = parseReportParams(await searchParams);
  const { lines, truncated } = await loadReportLines(filter.range);

  const currency = dominantCurrency(lines);
  const rows = orderWise(lines);
  const totals = summarize(lines);

  // What a job is worth on average is the number a studio quotes from, so it
  // gets a tile of its own rather than being left to be worked out by hand.
  const averageOrder =
    totals.orders === 0 ? 0 : Math.round(totals.revenue / totals.orders);
  const averageProfit =
    totals.orders === 0 ? 0 : Math.round(totals.profit / totals.orders);

  return (
    <ReportShell
      active="orders"
      filter={filter}
      meta={`${filter.range.label} · ${rows.length} order${rows.length === 1 ? "" : "s"} billed`}
    >
      {truncated && <TruncationNotice shown={lines.length} />}

      <StatTiles
        totals={totals}
        currency={currency}
        extra={[
          { label: "Avg order", value: formatMoney(averageOrder, currency) },
          { label: "Avg profit", value: formatMoney(averageProfit, currency) },
        ]}
      />

      <ReportTable
        headers={GROUP_HEADERS("Order")}
        isEmpty={rows.length === 0}
        empty="No orders billed in this range."
      >
        <GroupRows
          rows={rows}
          currency={currency}
          renderLabel={(row) => (
            <Link href={`/admin/invitations/${row.key}`} className="hover:underline">
              {row.label}
            </Link>
          )}
        />
      </ReportTable>
    </ReportShell>
  );
}
