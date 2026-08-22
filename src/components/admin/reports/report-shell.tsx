import * as React from "react";

import { withReportQuery, type ReportFilter } from "@/lib/report-params";
import { TabNav } from "@/components/dashboard/tab-nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReportFilterBar } from "@/components/admin/reports/report-filter-bar";
import { toDateInputValue } from "@/lib/reports";

/**
 * The tabs. One per dimension the business is read by, in the order they get
 * asked about: what did we make, off what, on which jobs, through whom, by
 * whom, and how well is the whole thing doing.
 */
const TABS = [
  { path: "/admin/reports", label: "Profit", report: "summary" },
  { path: "/admin/reports/items", label: "Item wise", report: "items" },
  { path: "/admin/reports/orders", label: "Order wise", report: "orders" },
  { path: "/admin/reports/vendors", label: "Vendor wise", report: "vendors" },
  { path: "/admin/reports/employees", label: "Employee wise", report: "employees" },
  { path: "/admin/reports/performance", label: "Performance", report: "performance" },
];

/**
 * Header, tabs and filter bar, shared by all six reports so the filter
 * survives a tab change — switching from item-wise to vendor-wise should keep
 * the month you were looking at, not reset to the default.
 */
export function ReportShell({
  active,
  filter,
  meta,
  children,
}: {
  /** The `report` key of the active tab. */
  active: string;
  filter: ReportFilter;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  const tab = TABS.find((entry) => entry.report === active) ?? TABS[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageHeader title="Reports" meta={meta ?? filter.range.label} />
        <div className="mt-4">
          <TabNav
            items={TABS.map((entry) => ({
              href: withReportQuery(entry.path, filter),
              label: entry.label,
              active: entry.report === active,
            }))}
          />
        </div>
      </div>

      <ReportFilterBar
        exportReport={tab.report}
        activePreset={filter.preset}
        activeGranularity={filter.granularity}
        from={toDateInputValue(filter.range.from, filter.offsetMinutes)}
        // The bar shows the inclusive last day; the filter carries the
        // exclusive instant after it, so this steps back inside the range.
        to={toDateInputValue(
          new Date(filter.range.to.getTime() - 1),
          filter.offsetMinutes,
        )}
      />

      {children}
    </div>
  );
}
