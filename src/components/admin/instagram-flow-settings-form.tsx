"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  instagramFlowSettingsFormSchema,
  type InstagramFlowSettingsFormInput,
  type InstagramFlowSettingsFormValues,
} from "@/lib/validations/admin";
import { saveInstagramFlowSettingsAction } from "@/lib/actions/admin";
import { DEFAULT_FLOW_SETTINGS } from "@/lib/instagram-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

export type FlowSettingsRecord = {
  isActive: boolean;
  openerMessage: string;
  openerButtonLabel: string;
  requireFollow: boolean;
  followMessage: string;
  followButtonLabel: string;
  stillNotFollowingMessage: string;
  profileUrl: string | null;
  profileButtonLabel: string;
  linkMessage: string;
  linkButtonLabel: string;
  duplicateMessage: string;
};

// No stored row means the flow is running on its code-side defaults, so the
// form opens showing exactly what people are being sent right now rather than
// blank fields.
function defaultValues(
  settings?: FlowSettingsRecord | null,
): InstagramFlowSettingsFormValues {
  const base = settings ?? { ...DEFAULT_FLOW_SETTINGS, isActive: true };
  return {
    isActive: base.isActive,
    openerMessage: base.openerMessage,
    openerButtonLabel: base.openerButtonLabel,
    requireFollow: base.requireFollow,
    followMessage: base.followMessage,
    followButtonLabel: base.followButtonLabel,
    stillNotFollowingMessage: base.stillNotFollowingMessage,
    profileUrl: base.profileUrl ?? "",
    profileButtonLabel: base.profileButtonLabel,
    linkMessage: base.linkMessage,
    linkButtonLabel: base.linkButtonLabel,
    duplicateMessage: base.duplicateMessage,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

export function InstagramFlowSettingsForm({
  settings,
}: {
  settings?: FlowSettingsRecord | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<
    InstagramFlowSettingsFormValues,
    unknown,
    InstagramFlowSettingsFormInput
  >({
    resolver: zodResolver(instagramFlowSettingsFormSchema),
    defaultValues: defaultValues(settings),
  });

  const errors = form.formState.errors;
  const requireFollow = form.watch("requireFollow");

  async function onSubmit(values: InstagramFlowSettingsFormInput) {
    setLoading(true);
    const result = await saveInstagramFlowSettingsAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Button flow saved.");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div>
            <Label>Button flow active</Label>
            <p className="text-muted-foreground text-xs">
              Off sends plain text replies everywhere, without un-ticking each reel.
            </p>
          </div>
          <Switch
            checked={form.watch("isActive")}
            onCheckedChange={(v) => form.setValue("isActive", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-4">
          <div>
            <p className="font-medium">1 · The opener</p>
            <p className="text-muted-foreground text-xs">
              Sent the moment someone comments the trigger word, or DMs a keyword on a
              rule that starts the flow. It carries no link — that is what makes the
              follow check land on a tap instead of on the comment.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label>Opening message</Label>
            <Textarea rows={2} {...form.register("openerMessage")} />
            <FieldError message={errors.openerMessage?.message} />
          </div>

          <div className="grid gap-1.5">
            <Label>Button label</Label>
            <Input
              placeholder="Send me the link"
              {...form.register("openerButtonLabel")}
            />
            <p className="text-muted-foreground text-xs">
              Up to 20 characters — Instagram cuts longer labels off.
            </p>
            <FieldError message={errors.openerButtonLabel?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">2 · The follow gate</p>
              <p className="text-muted-foreground text-xs">
                Shown when the check on their tap doesn&apos;t come back positive.
                Tapping is a message, so Instagram can answer &ldquo;do they follow
                us?&rdquo; here — on a bare comment it usually can&apos;t.
              </p>
            </div>
            <Switch
              checked={requireFollow}
              onCheckedChange={(v) => form.setValue("requireFollow", v)}
            />
          </div>

          {requireFollow && (
            <>
              <div className="grid gap-1.5">
                <Label>Follow-first message</Label>
                <Textarea rows={2} {...form.register("followMessage")} />
                <FieldError message={errors.followMessage?.message} />
              </div>

              <div className="grid gap-1.5">
                <Label>Profile link</Label>
                <Input
                  placeholder="https://instagram.com/yourhandle"
                  {...form.register("profileUrl")}
                />
                <p className="text-muted-foreground text-xs">
                  Becomes the &ldquo;Visit profile&rdquo; button. Leave blank to drop
                  the button.
                </p>
                <FieldError message={errors.profileUrl?.message} />
              </div>

              <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
                <div className="grid gap-1.5">
                  <Label>Profile button label</Label>
                  <Input {...form.register("profileButtonLabel")} />
                  <FieldError message={errors.profileButtonLabel?.message} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Follow-confirmed button label</Label>
                  <Input {...form.register("followButtonLabel")} />
                  <FieldError message={errors.followButtonLabel?.message} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>If the check still says they don&apos;t follow</Label>
                <Textarea rows={2} {...form.register("stillNotFollowingMessage")} />
                <p className="text-muted-foreground text-xs">
                  Sent when they tap &ldquo;{form.watch("followButtonLabel")}&rdquo; and
                  Instagram disagrees. The button comes back with it, so a follow that
                  hasn&apos;t registered yet isn&apos;t a dead end.
                </p>
                <FieldError message={errors.stillNotFollowingMessage?.message} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-4">
          <div>
            <p className="font-medium">3 · The link</p>
            <p className="text-muted-foreground text-xs">
              Sent once the check passes. One invitation per Instagram account, so a
              returning tapper gets the same website back — never a second one.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label>Link message</Label>
            <Textarea rows={3} {...form.register("linkMessage")} />
            <p className="text-muted-foreground text-xs">{"{{link}} {{username}}"}</p>
            <FieldError message={errors.linkMessage?.message} />
          </div>

          <div className="grid gap-1.5">
            <Label>Link button label</Label>
            <Input placeholder="Open my invite" {...form.register("linkButtonLabel")} />
            <FieldError message={errors.linkButtonLabel?.message} />
          </div>

          <div className="grid gap-1.5">
            <Label>If they already claimed a link</Label>
            <Textarea rows={2} {...form.register("duplicateMessage")} />
            <FieldError message={errors.duplicateMessage?.message} />
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save button flow"}
        </Button>
      </div>
    </form>
  );
}
