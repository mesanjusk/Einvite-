import { NextResponse, type NextRequest } from "next/server";

import { getAdmin } from "@/lib/admin-guard";
import { parseReportParams } from "@/lib/report-params";
import {
  dominantCurrency,
  loadPerformanceInput,
  loadReportLines,
} from "@/lib/reports-data";
import {
  csvMoney,
  employeeWise,
  formatPercent,
  groupByPeriod,
  itemWise,
  orderWise,
  performanceByPeriod,
  toCsv,
  toDateInputValue,
  vendorWise,
  type GroupRow,
} from "@/lib/reports";

/**
 * The same six reports as CSV.
 *
 * It reads the identical query params as the pages and runs the identical
 * aggregation, so a download can never disagree with the table it was taken
 * from. Money is written as a plain decimal rather than a formatted amount —
 * `₹1,25,000` is a string to a spreadsheet, `125000.00` is a number.
 */
export const dynamic = "force-dynamic";

const REPORTS = [
  "summary",
  "items",
  "orders",
  "vendors",
  "employees",
  "performance",
  "lines",
] as const;
type ReportName = (typeof REPORTS)[number];

const GROUP_HEADERS = [
  "Orders",
  "Quantity",
  "Revenue",
  "Cost",
  "Profit",
  "Margin",
  "Revenue share",
];

function groupCsvRows(rows: GroupRow[]): (string | number)[][] {
  return rows.map((row) => [
    row.label,
    row.detail ?? "",
    row.orders,
    row.quantity,
    csvMoney(row.revenue),
    csvMoney(row.cost),
    csvMoney(row.profit),
    formatPercent(row.margin),
    formatPercent(row.revenueShare),
  ]);
}

export async function GET(request: NextRequest) {
  // The reports show the business's own margins. This route is a plain URL,
  // so it does its own check rather than relying on the admin layout that
  // guards the page the download button sits on.
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const requested = params.report as ReportName | undefined;
  const report: ReportName = REPORTS.includes(requested as ReportName)
    ? (requested as ReportName)
    : "summary";

  const filter = parseReportParams(params);
  const { lines, truncated } = await loadReportLines(filter.range);
  const currency = dominantCurrency(lines);

  let headers: string[];
  let rows: (string | number)[][];

  switch (report) {
    case "items":
      headers = ["Item", "Kind", ...GROUP_HEADERS];
      rows = groupCsvRows(itemWise(lines));
      break;
    case "orders":
      headers = ["Order", "Status", ...GROUP_HEADERS];
      rows = groupCsvRows(orderWise(lines));
      break;
    case "vendors":
      headers = ["Vendor", "", ...GROUP_HEADERS];
      rows = groupCsvRows(vendorWise(lines));
      break;
    case "employees":
      headers = ["Team member", "", ...GROUP_HEADERS];
      rows = groupCsvRows(employeeWise(lines));
      break;
    case "performance": {
      headers = [
        "Period",
        "Created",
        "Published",
        "Publish rate",
        "Views",
        "Guests",
        "RSVP headcount",
        "RSVP per view",
        "Revenue",
        "Profit",
      ];
      const funnel = await loadPerformanceInput(filter.range);
      rows = performanceByPeriod(
        { lines, ...funnel },
        filter.range,
        filter.granularity,
        filter.offsetMinutes,
      ).map((row) => [
        row.key,
        row.created,
        row.published,
        formatPercent(row.publishRate),
        row.views,
        row.guests,
        row.rsvps,
        formatPercent(row.rsvpRate),
        csvMoney(row.revenue),
        csvMoney(row.profit),
      ]);
      break;
    }
    case "lines":
      // Every raw line, for anyone who wants to pivot it themselves rather
      // than take one of the five groupings on offer.
      headers = [
        "Date",
        "Order",
        "Status",
        "Item",
        "Kind",
        "Quantity",
        "Unit price",
        "Unit cost",
        "Revenue",
        "Cost",
        "Profit",
        "Vendor",
        "Handled by",
        "Currency",
      ];
      rows = lines.map((line) => [
        toDateInputValue(line.occurredAt, filter.offsetMinutes),
        line.orderRef,
        line.orderStatus,
        line.itemName,
        line.kind,
        line.quantity,
        csvMoney(line.unitPrice),
        csvMoney(line.unitCost),
        csvMoney(line.quantity * line.unitPrice),
        csvMoney(line.quantity * line.unitCost),
        csvMoney(line.quantity * (line.unitPrice - line.unitCost)),
        line.vendorName ?? "",
        line.employeeName ?? "",
        line.currency,
      ]);
      break;
    case "summary":
    default:
      headers = ["Period", "Orders", "Quantity", "Revenue", "Cost", "Profit", "Margin"];
      rows = groupByPeriod(
        lines,
        filter.range,
        filter.granularity,
        filter.offsetMinutes,
      ).map((period) => [
        period.key,
        period.orders,
        period.quantity,
        csvMoney(period.revenue),
        csvMoney(period.cost),
        csvMoney(period.profit),
        formatPercent(period.margin),
      ]);
      break;
  }

  const from = toDateInputValue(filter.range.from, filter.offsetMinutes);
  const to = toDateInputValue(
    new Date(filter.range.to.getTime() - 1),
    filter.offsetMinutes,
  );
  const filename = `${report}-${from}-to-${to}.csv`;

  // A truncated export must say so inside the file: the CSV outlives the page
  // that warned about it, and a spreadsheet with a quietly short total is
  // exactly the kind of thing that ends up in a decision.
  const preamble = truncated
    ? `# TRUNCATED — covers the ${lines.length} most recent lines of this range only\r\n`
    : "";
  const currencyNote = `# Amounts in ${currency}, ${from} to ${to}\r\n`;

  return new NextResponse(`${preamble}${currencyNote}${toCsv(headers, rows)}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
