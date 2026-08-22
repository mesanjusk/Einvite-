"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import {
  vendorFormSchema,
  type VendorFormInput,
  type VendorFormValues,
} from "@/lib/validations/reports";
import { upsertVendorAction } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type VendorRecord = {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
};

export function VendorFormDialog({ vendor }: { vendor?: VendorRecord }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<VendorFormValues, unknown, VendorFormInput>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      id: vendor?.id,
      name: vendor?.name ?? "",
      category: vendor?.category ?? "",
      contactName: vendor?.contactName ?? "",
      phone: vendor?.phone ?? "",
      email: vendor?.email ?? "",
      notes: vendor?.notes ?? "",
      isActive: vendor?.isActive ?? true,
    },
  });

  async function onSubmit(values: VendorFormInput) {
    setLoading(true);
    const result = await upsertVendorAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(vendor ? "Vendor updated." : "Vendor added.");
    setOpen(false);
    router.refresh();
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {vendor ? (
          <IconButton label="Edit vendor">
            <Pencil className="size-4" />
          </IconButton>
        ) : (
          <Button size="sm">
            <Plus className="size-4" />
            New vendor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit vendor" : "New vendor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Sharma Press" {...form.register("name")} />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Category (optional)</Label>
            <Input
              placeholder="printing, photography, courier…"
              {...form.register("category")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Contact person (optional)</Label>
            <Input {...form.register("contactName")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Phone (optional)</Label>
              <Input {...form.register("phone")} />
            </div>
            <div className="grid gap-1.5">
              <Label>Email (optional)</Label>
              <Input type="email" {...form.register("email")} />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Notes (optional)</Label>
            <Textarea rows={3} {...form.register("notes")} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Active</Label>
              <p className="text-muted-foreground text-xs">
                Off hides them from the pickers. Past jobs stay in the reports.
              </p>
            </div>
            <Switch
              checked={form.watch("isActive")}
              onCheckedChange={(value) => form.setValue("isActive", value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
