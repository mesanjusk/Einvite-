"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import {
  employeeFormSchema,
  type EmployeeFormInput,
  type EmployeeFormValues,
} from "@/lib/validations/reports";
import { upsertEmployeeAction } from "@/lib/actions/reports";
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

export type EmployeeRecord = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  userId: string | null;
  isActive: boolean;
};

export type UserOption = { id: string; label: string };

export function EmployeeFormDialog({
  employee,
  users,
}: {
  employee?: EmployeeRecord;
  /** Accounts a team member can be linked to, so their work follows a login. */
  users: UserOption[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<EmployeeFormValues, unknown, EmployeeFormInput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      id: employee?.id,
      name: employee?.name ?? "",
      role: employee?.role ?? "",
      phone: employee?.phone ?? "",
      email: employee?.email ?? "",
      notes: employee?.notes ?? "",
      userId: employee?.userId ?? "",
      isActive: employee?.isActive ?? true,
    },
  });

  async function onSubmit(values: EmployeeFormInput) {
    setLoading(true);
    const result = await upsertEmployeeAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(employee ? "Team member updated." : "Team member added.");
    setOpen(false);
    router.refresh();
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {employee ? (
          <IconButton label="Edit team member">
            <Pencil className="size-4" />
          </IconButton>
        ) : (
          <Button size="sm">
            <Plus className="size-4" />
            New team member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit team member" : "New team member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Priya Deshmukh" {...form.register("name")} />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Role (optional)</Label>
            <Input placeholder="designer, sales, support…" {...form.register("role")} />
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
            <Label htmlFor="employee-user">Linked login (optional)</Label>
            {/* A plain select rather than the Radix one: this list can run to
                every account on the platform, and a native picker is the one
                control that stays usable at that length on a phone. */}
            <select
              id="employee-user"
              className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
              {...form.register("userId")}
            >
              <option value="">Not linked</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              Most of the team never signs in — leave this unset unless they do.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label>Notes (optional)</Label>
            <Textarea rows={3} {...form.register("notes")} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Active</Label>
              <p className="text-muted-foreground text-xs">
                Off hides them from the pickers. Past work stays credited.
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
