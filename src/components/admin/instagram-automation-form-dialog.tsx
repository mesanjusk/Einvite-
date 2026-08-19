"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Search } from "lucide-react";

import {
  instagramAutomationFormSchema,
  type InstagramAutomationFormInput,
  type InstagramAutomationFormValues,
} from "@/lib/validations/admin";
import {
  lookupInstagramMediaAction,
  upsertInstagramAutomationAction,
} from "@/lib/actions/admin";
import type { InstagramMedia } from "@/lib/instagram";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
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
  requireFollow: boolean;
  notFollowingMessage: string | null;
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
      automation?.replyMessage ?? "Here's your free wedding invitation link: {{link}}",
    duplicateMessage:
      automation?.duplicateMessage ??
      "You already have a link! Check your DMs for your invite link.",
    requireFollow: automation?.requireFollow ?? false,
    notFollowingMessage:
      automation?.notFollowingMessage ??
      "Please follow us first, then comment again to get your free invite link!",
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
  const [lookingUp, setLookingUp] = useState(false);
  const [media, setMedia] = useState<InstagramMedia | null>(null);
  const router = useRouter();

  const form = useForm<
    InstagramAutomationFormValues,
    unknown,
    InstagramAutomationFormInput
  >({
    resolver: zodResolver(instagramAutomationFormSchema),
    defaultValues: {
      ...defaultValues(automation),
      ...(presetMediaId ? { mediaId: presetMediaId } : {}),
    },
  });

  // Confirms the pasted ID is the reel the admin has in mind, and fills in
  // the name and link from the post itself so neither has to be typed.
  async function lookUpMedia() {
    const mediaId = form.getValues("mediaId")?.trim();
    if (!mediaId) {
      toast.error("Enter a media ID first.");
      return;
    }

    setLookingUp(true);
    const result = await lookupInstagramMediaAction(mediaId);
    setLookingUp(false);

    if (!result.success) {
      setMedia(null);
      toast.error(result.error);
      return;
    }

    setMedia(result.data);
    if (result.data.permalink) form.setValue("permalink", result.data.permalink);
    if (!form.getValues("label")?.trim()) {
      const caption = result.data.caption?.trim();
      form.setValue(
        "label",
        caption ? caption.slice(0, 60) : `Reel ${mediaId.slice(-6)}`,
      );
    }
  }

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
          <IconButton label="Edit">
            <Pencil className="size-4" />
          </IconButton>
        ) : presetMediaId ? (
          <IconButton label="Automate this reel" variant="outline">
            <Plus className="size-4" />
          </IconButton>
        ) : (
          <IconButton label="New reel automation" variant="default">
            <Plus className="size-4" />
          </IconButton>
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
              <p className="text-destructive text-xs">
                {form.formState.errors.label.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Instagram media ID</Label>
            <div className="flex gap-2">
              <Input placeholder="17969960076129962" {...form.register("mediaId")} />
              <Button
                type="button"
                variant="outline"
                disabled={lookingUp}
                onClick={lookUpMedia}
              >
                <Search className="size-4" />
                {lookingUp ? "Checking…" : "Check"}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Check confirms which reel the ID is, and fills in the name and link.
            </p>
            {form.formState.errors.mediaId && (
              <p className="text-destructive text-xs">
                {form.formState.errors.mediaId.message}
              </p>
            )}
            {media && (
              <div className="mt-1 flex items-center gap-3 rounded-lg border p-2">
                {media.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.thumbnailUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {media.caption?.trim() || "(no caption)"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {media.mediaProductType ?? media.mediaType}
                    {media.timestamp &&
                      ` · ${new Date(media.timestamp).toLocaleDateString()}`}
                    {typeof media.commentsCount === "number" &&
                      ` · ${media.commentsCount} comment(s)`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Reel link (optional)</Label>
            <Input
              placeholder="https://instagram.com/reel/..."
              {...form.register("permalink")}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Trigger word</Label>
            <Input placeholder="FREE" {...form.register("triggerWord")} />
            {form.formState.errors.triggerWord && (
              <p className="text-destructive text-xs">
                {form.formState.errors.triggerWord.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Reply message</Label>
            <Textarea rows={3} {...form.register("replyMessage")} />
            <p className="text-muted-foreground text-xs">{"{{link}} {{username}}"}</p>
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

          <div className="grid gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Followers only</Label>
              </div>
              <Switch
                checked={form.watch("requireFollow")}
                onCheckedChange={(v) => form.setValue("requireFollow", v)}
              />
            </div>

            {form.watch("requireFollow") && (
              <div className="grid gap-1.5">
                <Label>Reply for non-followers</Label>
                <Textarea rows={2} {...form.register("notFollowingMessage")} />
                <p className="text-muted-foreground text-xs">
                  Sends the link anyway when follow status can&apos;t be determined.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Active</Label>
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
