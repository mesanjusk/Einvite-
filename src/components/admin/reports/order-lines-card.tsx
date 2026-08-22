import {
  loadCatalogOptions,
  loadEmployeeOptions,
  loadOrderLines,
  loadVendorOptions,
} from "@/lib/reports-data";
import { deleteOrderItemAction } from "@/lib/actions/reports";
import { formatMoney, reportOffsetMinutes, toDateInputValue } from "@/lib/reports";
import { ORDER_ITEM_KIND_LABELS } from "@/lib/validations/reports";
import { OrderItemDialog } from "@/components/admin/reports/order-item-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The billing lines on one invitation, and the only place they are entered.
 *
 * It lives on the invitation rather than inside the reports section because
 * this is the moment the numbers are actually known — an admin looking at a
 * job knows what was charged and what the press billed. A separate data-entry
 * screen would mean finding the order twice.
 */
export async function OrderLinesCard({ invitationId }: { invitationId: string }) {
  const [lines, vendors, employees, catalog] = await Promise.all([
    loadOrderLines(invitationId),
    loadVendorOptions(),
    loadEmployeeOptions(),
    loadCatalogOptions(),
  ]);

  const offsetMinutes = reportOffsetMinutes();
  const today = toDateInputValue(new Date(), offsetMinutes);

  const currency = lines[0]?.currency ?? "INR";
  const revenue = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const cost = lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pt-6">
        <div>
          <CardTitle className="text-base">Billing lines</CardTitle>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {lines.length === 0
              ? "Nothing billed yet."
              : `${formatMoney(revenue, currency)} billed · ${formatMoney(cost, currency)} cost · ${formatMoney(revenue - cost, currency)} profit`}
          </p>
        </div>
        <OrderItemDialog
          invitationId={invitationId}
          vendors={vendors}
          employees={employees}
          catalog={catalog}
          defaultDate={today}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pb-2">
        {lines.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center text-sm">
            Add what was charged and what it cost, and this order starts appearing in
            the admin reports.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-y text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">By</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{line.itemName}</div>
                    <div className="text-muted-foreground text-xs">
                      {ORDER_ITEM_KIND_LABELS[line.kind] ?? line.kind}
                      {line.note ? ` · ${line.note}` : ""}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {toDateInputValue(line.occurredAt, offsetMinutes)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{line.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(line.quantity * line.unitPrice, line.currency)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                    {formatMoney(line.quantity * line.unitCost, line.currency)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {line.vendor?.name ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {line.employee?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <OrderItemDialog
                        invitationId={invitationId}
                        line={{
                          id: line.id,
                          kind: line.kind,
                          itemKey: line.itemKey,
                          itemName: line.itemName,
                          quantity: line.quantity,
                          unitPrice: line.unitPrice,
                          unitCost: line.unitCost,
                          currency: line.currency,
                          vendorId: line.vendorId,
                          employeeId: line.employeeId,
                          occurredOn: toDateInputValue(line.occurredAt, offsetMinutes),
                          note: line.note,
                        }}
                        vendors={vendors}
                        employees={employees}
                        catalog={catalog}
                        defaultDate={today}
                      />
                      <DeleteEntityButton
                        id={line.id}
                        confirmLabel={`Delete the "${line.itemName}" line? It comes out of every report.`}
                        action={deleteOrderItemAction}
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
  );
}
