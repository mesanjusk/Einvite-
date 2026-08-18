"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import {
  instagramAutomationFormSchema,
  type InstagramAutomationFormInput,
  type InstagramAutomationFormValues,
} from "@/lib/validations/admin";
import { upsertInstagramAutomationAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type AutomationRecord = {
  id: string;
  mediaId: string;
  label: string;
  permalink: string | null;
  triggerWord: string;
  replyMessage: string;
  duplicateMessage: string;
  isActive: boolean;
};

function defaultValues(automation?: AutomationRecord): InstagramAutomationFormValues {
  return {
    id: automation?.id,
    mediaId: automation?.mediaId ?? "",
    label: automation?.label ?? "",
    permalink: automation?.permalink ?? "",
    triggerWord: automation?.triggerWord ?? "FREE",
    replyMessage:
      automation?.replyMessage ??
      "Here's your free wedding invitation link: {{link}}",
    duplicateMessage:
      automation?.duplicateMessage ??
      "You already have a link! Check your DMs for your invite link.",
    isActive: automation?.isActive ?? true,
  };
}

export function InstagramAutomationFormDialog({
  automation,
  presetMediaId,
}: {
  automation?: AutomationRecord;
  presetMediaId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<InstagramAutomationFormValues, unknown, InstagramAutomationFormInput>({
    resolver: zodResolver(instagramAutomationFormSchema),
    defaultValues: {
      ...defaultValues(automation),
      ...(presetMediaId ? { mediaId: presetMediaId } : {}),
    },
  });

  async function onSubmit(values: InstagramAutomationFormInput) {
    setLoading(true);
    const result = await upsertInstagramAutomationAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(automation ? "Automation updated." : "Automation created.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {automation ? (
          <Button variant="ghost" size="icon">
            <Pencil className="size-4" />
          </Button>
        ) : presetMediaId ? (
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" />
            Automate this reel
          </Button>
        ) : (
          <Button>
            <Plus />
            New reel automation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {automation ? `Edit ${automation.label}` : "New reel automation"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid gap-1.5">
            <Label>Reel name</Label>
            <Input placeholder="Diwali campaign reel" {...form.register("label")} />
            {form.formState.errors.label && (
              <p className="text-destructive text-xs">{form.formState.errors.label.message}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Instagram media ID</Label>
            <Input placeholder="17969960076129962" {...form.register("mediaId")} />
            <p className="text-muted-foreground text-xs">
              Comment on the reel once — it appears in the activity log below with an
              &ldquo;Automate this reel&rdquo; button that fills this in for you.
            </p>
            {form.formState.errors.mediaId && (
              <p className="text-destructive text-xs">{form.formState.errors.mediaId.message}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Reel link (optional)</Label>
            <Input placeholder="https://instagram.com/reel/..." {...form.register("permalink")} />
          </div>

          <div className="grid gap-1.5">
            <Label>Trigger word</Label>
            <Input placeholder="FREE" {...form.register("triggerWord")} />
            <p className="text-muted-foreground text-xs">
              Matched case-insensitively anywhere in the comment.
            </p>
            {form.formState.errors.triggerWord && (
              <p className="text-destructive text-xs">
                {form.formState.errors.triggerWord.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Reply message</Label>
            <Textarea rows={3} {...form.register("replyMessage")} />
            <p className="text-muted-foreground text-xs">
              Placeholders: {"{{link}}"} (required) and {"{{username}}"}.
            </p>
            {form.formState.errors.replyMessage && (
              <p className="text-destructive text-xs">
                {form.formState.errors.replyMessage.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Reply if they already claimed this reel</Label>
            <Textarea rows={2} {...form.register("duplicateMessage")} />
            {form.formState.errors.duplicateMessage && (
              <p className="text-destructive text-xs">
                {form.formState.errors.duplicateMessage.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Active</Label>
              <p className="text-muted-foreground text-xs">
                Paused reels still log comments but never reply.
              </p>
            </div>
            <Switch
              checked={form.watch("isActive")}
              onCheckedChange={(v) => form.setValue("isActive", v)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : automation ? "Save changes" : "Create automation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
