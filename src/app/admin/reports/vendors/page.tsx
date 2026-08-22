import { parseReportParams, type ReportSearchParams } from "@/lib/report-params";
import { dominantCurrency, loadReportLines } from "@/lib/reports-data";
import { db } from "@/lib/db";
import { formatMoney, summarize, vendorWise } from "@/lib/reports";
import { deleteVendorAction } from "@/lib/actions/reports";
import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  GROUP_HEADERS,
  GroupRows,
  ReportTable,
  StatTiles,
  TruncationNotice,
} from "@/components/admin/reports/report-tables";
import { VendorFormDialog } from "@/components/admin/reports/vendor-form-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Vendor wise: what each supplier was paid in the period and what the work
 * they supplied earned. The register of suppliers sits on the same page as
 * the report so adding one is not a trip to a different screen — a vendor is
 * usually created the moment their first bill needs recording.
 */
export default async function VendorWiseReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const filter = parseReportParams(await searchParams);
  const [{ lines, truncated }, vendors] = await Promise.all([
    loadReportLines(filter.range),
    db.vendor.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
  ]);

  const currency = dominantCurrency(lines);
  const rows = vendorWise(lines);
  const totals = summarize(lines);

  const outsourced = rows
    .filter((row) => row.key !== "unassigned")
    .reduce((sum, row) => sum + row.cost, 0);

  return (
    <ReportShell
      active="vendors"
      filter={filter}
      meta={`${filter.range.label} · ${vendors.length} vendor${vendors.length === 1 ? "" : "s"} on file`}
    >
      {truncated && <TruncationNotice shown={lines.length} />}

      <StatTiles
        totals={totals}
        currency={currency}
        extra={[{ label: "Paid to vendors", value: formatMoney(outsourced, currency) }]}
      />

      <ReportTable
        headers={GROUP_HEADERS("Vendor")}
        isEmpty={rows.length === 0}
        empty="No vendor activity in this range."
      >
        <GroupRows rows={rows} currency={currency} />
      </ReportTable>

      <Card className="py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pt-6">
          <CardTitle className="text-base">Vendor register</CardTitle>
          <VendorFormDialog />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 pb-2">
          {vendors.length === 0 ? (
            <p className="text-muted-foreground p-8 text-center text-sm">
              No vendors yet. Add the suppliers you buy from to start attributing cost.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-y text-left text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{vendor.name}</td>
                    <td className="text-muted-foreground px-4 py-3">
                      {vendor.category ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {[vendor.contactName, vendor.phone].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={vendor.isActive ? "secondary" : "outline"}>
                        {vendor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <VendorFormDialog vendor={vendor} />
                        <DeleteEntityButton
                          id={vendor.id}
                          confirmLabel={`Delete ${vendor.name}? Only possible while no order line references them.`}
                          action={deleteVendorAction}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </ReportShell>
  );
}
