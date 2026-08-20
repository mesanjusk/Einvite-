"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, RotateCcw } from "lucide-react";

import {
  INVITATION_FIELDS,
  WIZARD_STEPS,
  type FieldRule,
  type FieldRules,
  type InvitationFieldKey,
  type WizardStepKey,
} from "@/lib/event-category-config";
import {
  resetEventCategoryConfigAction,
  saveEventCategoryConfigAction,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export type CategoryConfigRecord = {
  slug: string;
  isEnabled: boolean;
  label: string;
  tagline: string;
  primaryNameLabel: string;
  secondaryNameLabel: string;
  secondaryOptional: boolean;
  joiner: string;
  dateLabel: string;
  eventsLabel: string;
  familyBrideLabel: string;
  familyGroomLabel: string;
  defaultEvents: string[];
  familyRelations: string[];
  steps: WizardStepKey[];
  fields: FieldRules;
};

/**
 * One celebration's whole form, editable in one place.
 *
 * Deliberately not a wizard of its own: the thing being configured is a
 * single form, and an admin deciding "does a housewarming ask for a
 * sub-caste" wants to see that question next to every other question, not
 * three screens away from it.
 *
 * The inputs open pre-filled with the *resolved* wording rather than blank,
 * so it always reads as editing what people are being asked right now. That
 * makes "clear a box to get the built-in wording back" the one thing worth
 * saying out loud, and it is said, under each group.
 */
export function EventCategoryConfigDialog({
  category,
  isCustomised,
}: {
  category: CategoryConfigRecord;
  isCustomised: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState(category);

  function set<K extends keyof CategoryConfigRecord>(
    key: K,
    value: CategoryConfigRecord[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setField(key: InvitationFieldKey, patch: Partial<FieldRule>) {
    setForm((current) => ({
      ...current,
      fields: { ...current.fields, [key]: { ...current.fields[key], ...patch } },
    }));
  }

  function toggleStep(key: WizardStepKey, on: boolean) {
    setForm((current) => ({
      ...current,
      steps: on
        ? WIZARD_STEPS.filter(
            (step) => step.key === key || current.steps.includes(step.key),
          ).map((step) => step.key)
        : current.steps.filter((step) => step !== key),
    }));
  }

  async function save() {
    setSaving(true);
    const result = await saveEventCategoryConfigAction({
      slug: form.slug,
      isEnabled: form.isEnabled,
      label: form.label,
      tagline: form.tagline,
      primaryNameLabel: form.primaryNameLabel,
      secondaryNameLabel: form.secondaryNameLabel,
      secondaryOptional: form.secondaryOptional,
      joiner: form.joiner,
      dateLabel: form.dateLabel,
      eventsLabel: form.eventsLabel,
      familyBrideLabel: form.familyBrideLabel,
      familyGroomLabel: form.familyGroomLabel,
      defaultEvents: form.defaultEvents.join("\n"),
      familyRelations: form.familyRelations.join("\n"),
      steps: form.steps,
      fields: form.fields,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`${form.label} form saved.`);
    setOpen(false);
    router.refresh();
  }

  async function restoreDefaults() {
    setRestoring(true);
    const result = await resetEventCategoryConfigAction(form.slug);
    setRestoring(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`${form.label} is back to its built-in form.`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconButton label={`Edit the ${category.label} form`}>
          <Pencil className="size-4" />
        </IconButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{category.label} form</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Offered to couples</Label>
              <p className="text-muted-foreground text-xs">
                Off hides it from the &ldquo;Get started&rdquo; picker. Invitations
                already made under it are untouched.
              </p>
            </div>
            <Switch
              checked={form.isEnabled}
              onCheckedChange={(v) => set("isEnabled", v)}
            />
          </div>

          <div className="grid gap-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Wording</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Tagline</Label>
                <Input
                  value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>First name slot</Label>
                <Input
                  value={form.primaryNameLabel}
                  onChange={(e) => set("primaryNameLabel", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Second name slot</Label>
                <Input
                  value={form.secondaryNameLabel}
                  onChange={(e) => set("secondaryNameLabel", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Joined by</Label>
                <Input
                  value={form.joiner}
                  onChange={(e) => set("joiner", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Date label</Label>
                <Input
                  value={form.dateLabel}
                  onChange={(e) => set("dateLabel", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Events label</Label>
                <Input
                  value={form.eventsLabel}
                  onChange={(e) => set("eventsLabel", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>First family heading</Label>
                <Input
                  value={form.familyBrideLabel}
                  onChange={(e) => set("familyBrideLabel", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Second family heading</Label>
                <Input
                  value={form.familyGroomLabel}
                  onChange={(e) => set("familyGroomLabel", e.target.value)}
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Clear a box to put the built-in wording back.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Steps the wizard walks</p>
              <p className="text-muted-foreground text-xs">
                Turning a step off hides every field on it. Names and Review can&apos;t
                be removed — there is nothing to save without them.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {WIZARD_STEPS.map((step) => (
                <label
                  key={step.key}
                  className="flex items-start gap-2 rounded-md border p-2"
                >
                  <Checkbox
                    checked={form.steps.includes(step.key)}
                    disabled={step.locked}
                    onCheckedChange={(v) => toggleStep(step.key, v === true)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm">{step.label}</span>
                    <span className="text-muted-foreground block text-xs">
                      {step.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Fields</p>
              <p className="text-muted-foreground text-xs">
                What this celebration asks for, and what it insists on. A field on a
                step you switched off isn&apos;t asked whatever it says here.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs">
                    <th className="py-2 pr-3 font-medium">Field</th>
                    <th className="py-2 pr-3 font-medium">Step</th>
                    <th className="py-2 pr-3 font-medium">Asked</th>
                    <th className="py-2 pr-3 font-medium">Required</th>
                    <th className="py-2 font-medium">Label override</th>
                  </tr>
                </thead>
                <tbody>
                  {INVITATION_FIELDS.map((field) => {
                    const rule = form.fields[field.key];
                    const onHiddenStep = !form.steps.includes(field.step);

                    return (
                      <tr key={field.key} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          {field.label}
                          {field.locked && (
                            <span className="text-muted-foreground block text-xs">
                              always asked
                            </span>
                          )}
                        </td>
                        <td className="text-muted-foreground py-2 pr-3 text-xs">
                          {WIZARD_STEPS.find((s) => s.key === field.step)?.label}
                          {onHiddenStep && " (off)"}
                        </td>
                        <td className="py-2 pr-3">
                          <Switch
                            checked={rule.enabled}
                            disabled={field.locked || onHiddenStep}
                            onCheckedChange={(v) => setField(field.key, { enabled: v })}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <Switch
                            checked={rule.required}
                            disabled={
                              !rule.enabled || onHiddenStep || !field.requirable
                            }
                            onCheckedChange={(v) =>
                              setField(field.key, { required: v })
                            }
                          />
                        </td>
                        <td className="py-2">
                          <Input
                            value={rule.label ?? ""}
                            placeholder="built-in"
                            disabled={!rule.enabled || onHiddenStep}
                            onChange={(e) =>
                              setField(field.key, { label: e.target.value })
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Ceremonies pre-filled</Label>
              <Textarea
                rows={5}
                value={form.defaultEvents.join("\n")}
                onChange={(e) => set("defaultEvents", e.target.value.split("\n"))}
              />
              <p className="text-muted-foreground text-xs">One per line.</p>
            </div>
            <div className="grid gap-1.5">
              <Label>Family relations offered</Label>
              <Textarea
                rows={5}
                value={form.familyRelations.join("\n")}
                onChange={(e) => set("familyRelations", e.target.value.split("\n"))}
              />
              <p className="text-muted-foreground text-xs">One per line.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {isCustomised ? (
            <Button
              type="button"
              variant="outline"
              onClick={restoreDefaults}
              disabled={restoring || saving}
            >
              <RotateCcw className="size-4" />
              {restoring ? "Restoring…" : "Restore built-in form"}
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" onClick={save} disabled={saving || restoring}>
            {saving ? "Saving…" : "Save form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
