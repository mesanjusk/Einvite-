"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import {
  instagramDmRuleFormSchema,
  type InstagramDmRuleFormInput,
  type InstagramDmRuleFormValues,
} from "@/lib/validations/admin";
import { upsertInstagramDmRuleAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type DmRuleRecord = {
  id: string;
  label: string;
  matchType: "EXACT" | "CONTAINS" | "STARTS_WITH" | "ANY";
  keyword: string | null;
  replyMessage: string;
  issueLink: boolean;
  duplicateMessage: string | null;
  priority: number;
  isActive: boolean;
};

const MATCH_HELP: Record<DmRuleRecord["matchType"], string> = {
  EXACT: "Replies only when the whole message is the keyword.",
  CONTAINS: "Replies when the keyword appears anywhere in the message.",
  STARTS_WITH: "Replies when the message opens with the keyword.",
  ANY: "Replies to every message no other rule answered. Use sparingly.",
};

function defaultValues(rule?: DmRuleRecord): InstagramDmRuleFormValues {
  return {
    id: rule?.id,
    label: rule?.label ?? "",
    matchType: rule?.matchType ?? "CONTAINS",
    keyword: rule?.keyword ?? "",
    replyMessage: rule?.replyMessage ?? "",
    issueLink: rule?.issueLink ?? false,
    duplicateMessage: rule?.duplicateMessage ?? "",
    priority: rule?.priority ?? 0,
    isActive: rule?.isActive ?? true,
  };
}

export function InstagramDmRuleFormDialog({
  rule,
  presetKeyword,
}: {
  rule?: DmRuleRecord;
  // Pre-fills the keyword from a real unanswered DM, so a message that needed
  // a reply can become the rule that answers it next time.
  presetKeyword?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<InstagramDmRuleFormValues, unknown, InstagramDmRuleFormInput>({
    resolver: zodResolver(instagramDmRuleFormSchema),
    defaultValues: {
      ...defaultValues(rule),
      ...(presetKeyword ? { keyword: presetKeyword } : {}),
    },
  });

  const matchType = form.watch("matchType") ?? "CONTAINS";
  const issueLink = form.watch("issueLink");

  async function onSubmit(values: InstagramDmRuleFormInput) {
    setLoading(true);
    const result = await upsertInstagramDmRuleAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(rule ? "Rule updated." : "Rule created.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {rule ? (
          <IconButton label="Edit">
            <Pencil className="size-4" />
          </IconButton>
        ) : presetKeyword ? (
          <IconButton label="Write a rule for this message" variant="outline">
            <Plus className="size-4" />
          </IconButton>
        ) : (
          <Button size="sm" variant="outline">
            <Plus className="size-4" /> DM rule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? `Edit ${rule.label}` : "New DM reply rule"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid gap-1.5">
            <Label>Rule name</Label>
            <Input placeholder="Price enquiry" {...form.register("label")} />
            {form.formState.errors.label && (
              <p className="text-destructive text-xs">
                {form.formState.errors.label.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>When the message…</Label>
            <Select
              value={matchType}
              onValueChange={(v) =>
                form.setValue("matchType", v as DmRuleRecord["matchType"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTAINS">Contains the keyword</SelectItem>
                <SelectItem value="EXACT">Is exactly the keyword</SelectItem>
                <SelectItem value="STARTS_WITH">Starts with the keyword</SelectItem>
                <SelectItem value="ANY">Anything (catch-all)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">{MATCH_HELP[matchType]}</p>
          </div>

          {matchType !== "ANY" && (
            <div className="grid gap-1.5">
              <Label>Keyword</Label>
              <Input placeholder="price" {...form.register("keyword")} />
              <p className="text-muted-foreground text-xs">
                Case-insensitive. Messages matching nothing are left for you to answer
                by hand.
              </p>
              {form.formState.errors.keyword && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.keyword.message}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label>Reply message</Label>
            <Textarea rows={3} {...form.register("replyMessage")} />
            <p className="text-muted-foreground text-xs">
              {issueLink ? "{{link}} {{username}}" : "{{username}}"}
            </p>
            {form.formState.errors.replyMessage && (
              <p className="text-destructive text-xs">
                {form.formState.errors.replyMessage.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Send an invite link</Label>
                <p className="text-muted-foreground text-xs">
                  Creates the sender&apos;s invitation, the same one comment replies
                  issue.
                </p>
              </div>
              <Switch
                checked={issueLink}
                onCheckedChange={(v) => form.setValue("issueLink", v)}
              />
            </div>

            {issueLink && (
              <div className="grid gap-1.5">
                <Label>Reply if they already have a link (optional)</Label>
                <Textarea rows={2} {...form.register("duplicateMessage")} />
                <p className="text-muted-foreground text-xs">
                  Left blank, returning senders get the reply above with a fresh link.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Priority</Label>
            <Input type="number" {...form.register("priority")} />
            <p className="text-muted-foreground text-xs">
              Higher wins. Keep a catch-all below your keyword rules.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Active</Label>
            <Switch
              checked={Boolean(form.watch("isActive"))}
              onCheckedChange={(v) => form.setValue("isActive", v)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : rule ? "Save changes" : "Create rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
