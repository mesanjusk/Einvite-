"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import {
  ORDER_ITEM_KINDS,
  ORDER_ITEM_KIND_LABELS,
  REPORT_CURRENCIES,
  orderItemFormSchema,
  type OrderItemFormInput,
  type OrderItemFormValues,
} from "@/lib/validations/reports";
import { upsertOrderItemAction } from "@/lib/actions/reports";
import type { CatalogOption } from "@/lib/reports-data";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type OrderItemRecord = {
  id: string;
  kind: string;
  itemKey: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  currency: string;
  vendorId: string | null;
  employeeId: string | null;
  /**
   * `YYYY-MM-DD` in the studio's timezone, formatted on the server. Passing
   * the instant instead would mean re-deriving the day in the browser, where
   * a line stored at IST midnight reads back as the previous date.
   */
  occurredOn: string;
  note: string | null;
};

type Option = { id: string; name: string };

const selectClass = "border-input h-9 rounded-md border bg-transparent px-3 text-sm";

/**
 * Records one priced line against an order. This is where every number in the
 * reports comes from, so the form asks for the cost as insistently as the
 * price: a line with no cost reads as pure profit, and a report built out of
 * those is worse than none.
 *
 * Amounts are typed in whole rupees; the schema turns them into the paise the
 * database stores. See `validations/reports.ts`.
 */
export function OrderItemDialog({
  invitationId,
  line,
  vendors,
  employees,
  catalog,
  defaultDate,
}: {
  invitationId: string;
  line?: OrderItemRecord;
  vendors: Option[];
  employees: Option[];
  catalog: CatalogOption[];
  /** Today in the studio's timezone, resolved on the server. */
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<OrderItemFormValues, unknown, OrderItemFormInput>({
    resolver: zodResolver(orderItemFormSchema),
    defaultValues: {
      id: line?.id,
      invitationId,
      kind: (line?.kind as OrderItemFormValues["kind"]) ?? "SERVICE",
      itemKey: line?.itemKey ?? "",
      itemName: line?.itemName ?? "",
      quantity: line?.quantity ?? 1,
      // Back from minor units for editing, so the field shows what was typed.
      unitPrice: line ? line.unitPrice / 100 : 0,
      unitCost: line ? line.unitCost / 100 : 0,
      currency: (line?.currency as OrderItemFormValues["currency"]) ?? "INR",
      vendorId: line?.vendorId ?? "",
      employeeId: line?.employeeId ?? "",
      occurredOn: line?.occurredOn || defaultDate,
      note: line?.note ?? "",
    },
  });

  async function onSubmit(values: OrderItemFormInput) {
    setLoading(true);
    const result = await upsertOrderItemAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(line ? "Line updated." : "Line added.");
    setOpen(false);
    router.refresh();
  }

  /** Picking a catalogue entry fills the key, the name and the kind at once. */
  function pickCatalogItem(value: string) {
    if (!value) return;
    const chosen = catalog.find((entry) => `${entry.kind}:${entry.itemKey}` === value);
    if (!chosen) return;
    form.setValue("kind", chosen.kind as OrderItemFormValues["kind"]);
    form.setValue("itemKey", chosen.itemKey);
    form.setValue("itemName", chosen.itemName);
  }

  const errors = form.formState.errors;
  const quantity = Number(form.watch("quantity")) || 0;
  const price = Number(form.watch("unitPrice")) || 0;
  const cost = Number(form.watch("unitCost")) || 0;
  const profit = quantity * (price - cost);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {line ? (
          <IconButton label="Edit line">
            <Pencil className="size-4" />
          </IconButton>
        ) : (
          <Button size="sm" variant="outline">
            <Plus className="size-4" />
            Add line
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{line ? "Edit order line" : "Add order line"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {catalog.length > 0 && !line && (
            <div className="grid gap-1.5">
              <Label htmlFor="order-item-catalog">
                Pick from the catalogue (optional)
              </Label>
              <select
                id="order-item-catalog"
                className={selectClass}
                defaultValue=""
                onChange={(event) => pickCatalogItem(event.target.value)}
              >
                <option value="">Type it in below instead</option>
                {catalog.map((entry) => (
                  <option
                    key={`${entry.kind}:${entry.itemKey}`}
                    value={`${entry.kind}:${entry.itemKey}`}
                  >
                    {entry.itemName} ·{" "}
                    {ORDER_ITEM_KIND_LABELS[
                      entry.kind as keyof typeof ORDER_ITEM_KIND_LABELS
                    ] ?? entry.kind}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="order-item-kind">Kind</Label>
              <select
                id="order-item-kind"
                className={selectClass}
                {...form.register("kind")}
              >
                {ORDER_ITEM_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {ORDER_ITEM_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="order-item-date">Date</Label>
              <Input
                id="order-item-date"
                type="date"
                {...form.register("occurredOn")}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Item name</Label>
            <Input placeholder="Premium card printing" {...form.register("itemName")} />
            {errors.itemName && (
              <p className="text-destructive text-xs">{errors.itemName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={1} step={1} {...form.register("quantity")} />
              {errors.quantity && (
                <p className="text-destructive text-xs">{errors.quantity.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Price each</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                {...form.register("unitPrice")}
              />
              {errors.unitPrice && (
                <p className="text-destructive text-xs">{errors.unitPrice.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Cost each</Label>
              <Input type="number" min={0} step="0.01" {...form.register("unitCost")} />
              {errors.unitCost && (
                <p className="text-destructive text-xs">{errors.unitCost.message}</p>
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Line profit:{" "}
            <span
              className={profit < 0 ? "text-destructive font-medium" : "font-medium"}
            >
              {profit.toFixed(2)}
            </span>{" "}
            {form.watch("currency")}. Leave the cost at 0 only when the work was done
            in-house.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="order-item-currency">Currency</Label>
              <select
                id="order-item-currency"
                className={selectClass}
                {...form.register("currency")}
              >
                {REPORT_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="order-item-vendor">Vendor</Label>
              <select
                id="order-item-vendor"
                className={selectClass}
                {...form.register("vendorId")}
              >
                <option value="">None</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="order-item-employee">Handled by</Label>
              <select
                id="order-item-employee"
                className={selectClass}
                {...form.register("employeeId")}
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Note (optional)</Label>
            <Input placeholder="Bill #1042" {...form.register("note")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save line"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
