import { parseReportParams, type ReportSearchParams } from "@/lib/report-params";
import { dominantCurrency, loadReportLines } from "@/lib/reports-data";
import { db } from "@/lib/db";
import { employeeWise, formatMoney, summarize } from "@/lib/reports";
import { deleteEmployeeAction } from "@/lib/actions/reports";
import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  GROUP_HEADERS,
  GroupRows,
  ReportTable,
  StatTiles,
  TruncationNotice,
} from "@/components/admin/reports/report-tables";
import { EmployeeFormDialog } from "@/components/admin/reports/employee-form-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Employee wise: what each person's work brought in and what it left after
 * cost. The "Unassigned" row is the useful one to watch — work nobody is
 * credited with is work nobody is accountable for.
 */
export default async function EmployeeWiseReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const filter = parseReportParams(await searchParams);
  const [{ lines, truncated }, employees, users] = await Promise.all([
    loadReportLines(filter.range),
    db.employee.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.user.findMany({
      orderBy: { name: "asc" },
      take: 500,
      select: { id: true, name: true, email: true },
    }),
  ]);

  const currency = dominantCurrency(lines);
  const rows = employeeWise(lines);
  const totals = summarize(lines);

  const credited = rows.filter((row) => row.key !== "unassigned");
  const perPerson =
    credited.length === 0
      ? 0
      : Math.round(
          credited.reduce((sum, row) => sum + row.profit, 0) / credited.length,
        );

  const userOptions = users.map((user) => ({
    id: user.id,
    label: user.name ? `${user.name} · ${user.email}` : user.email,
  }));

  return (
    <ReportShell
      active="employees"
      filter={filter}
      meta={`${filter.range.label} · ${employees.length} on the team`}
    >
      {truncated && <TruncationNotice shown={lines.length} />}

      <StatTiles
        totals={totals}
        currency={currency}
        extra={[
          { label: "Avg profit / person", value: formatMoney(perPerson, currency) },
        ]}
      />

      <ReportTable
        headers={GROUP_HEADERS("Team member")}
        isEmpty={rows.length === 0}
        empty="No work recorded in this range."
      >
        <GroupRows rows={rows} currency={currency} />
      </ReportTable>

      <Card className="py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pt-6">
          <CardTitle className="text-base">Team</CardTitle>
          <EmployeeFormDialog users={userOptions} />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 pb-2">
          {employees.length === 0 ? (
            <p className="text-muted-foreground p-8 text-center text-sm">
              Nobody on the team yet. Add people to credit their work on each order
              line.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-y text-left text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Login</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{employee.name}</td>
                    <td className="text-muted-foreground px-4 py-3">
                      {employee.role ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {[employee.email, employee.phone].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={employee.userId ? "secondary" : "outline"}>
                        {employee.userId ? "Linked" : "None"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={employee.isActive ? "secondary" : "outline"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <EmployeeFormDialog employee={employee} users={userOptions} />
                        <DeleteEntityButton
                          id={employee.id}
                          confirmLabel={`Remove ${employee.name}? Only possible while no order line is credited to them.`}
                          action={deleteEmployeeAction}
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
