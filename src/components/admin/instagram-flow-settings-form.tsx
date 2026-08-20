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
  // Null on a settings row saved before the field existed; reads as on.
  gateInvitations: boolean | null;
  pausedMessage: string | null;
  linkMessage: string;
  duplicateMessage: string;
  notifyOnPublish: boolean | null;
  publishedMessage: string | null;
};

// No stored row means the flow is running on its code-side defaults, so the
// form opens showing exactly what people are being sent right now rather than
// blank fields.
function defaultValues(
  settings?: FlowSettingsRecord | null,
): InstagramFlowSettingsFormValues {
  const base = settings ?? {
    ...DEFAULT_FLOW_SETTINGS,
    isActive: true,
    gateInvitations: true,
    pausedMessage: null,
    notifyOnPublish: true,
    publishedMessage: DEFAULT_FLOW_SETTINGS.publishedMessage,
  };
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
    gateInvitations: base.gateInvitations ?? true,
    pausedMessage: base.pausedMessage ?? "",
    linkMessage: base.linkMessage,
    duplicateMessage: base.duplicateMessage,
    notifyOnPublish: base.notifyOnPublish ?? true,
    publishedMessage: base.publishedMessage ?? "",
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
              <p className="font-medium">2 · Followers only</p>
              <p className="text-muted-foreground text-xs">
                Account-wide: no link goes out to anyone who isn&apos;t a confirmed
                follower — reel replies and DM rules included, whether or not the button
                flow is on. A reel or rule can be stricter than this; none can be
                looser.
              </p>
            </div>
            <Switch
              checked={requireFollow}
              onCheckedChange={(v) => form.setValue("requireFollow", v)}
            />
          </div>

          {!requireFollow && (
            <p className="border-destructive/40 text-destructive rounded-lg border border-dashed p-3 text-xs">
              Off means anyone who comments the keyword or DMs a link rule gets a link,
              follower or not.
            </p>
          )}

          {requireFollow && (
            <>
              <div className="grid gap-1.5">
                <Label>Follow-first message</Label>
                <p className="text-muted-foreground text-xs">
                  Sent when the check on a tap doesn&apos;t come back positive. Tapping
                  is a message, so Instagram can answer &ldquo;do they follow us?&rdquo;
                  here — on a bare comment it usually can&apos;t.
                </p>
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
            <p className="font-medium">3 · The editor link</p>
            <p className="text-muted-foreground text-xs">
              Sent once the check passes. {"{{link}}"} is their private editor — the
              invitation itself doesn&apos;t exist yet, so that link comes later, when
              they publish. One invitation per Instagram account, so a returning tapper
              gets the same one back rather than a second.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label>Link message</Label>
            <Textarea rows={3} {...form.register("linkMessage")} />
            <p className="text-muted-foreground text-xs">
              {"{{link}} {{username}}"} — sent as one plain message. A link button would
              make Instagram render it as a card, and a card only holds 80 characters
              before it splits into two bubbles.
            </p>
            <FieldError message={errors.linkMessage?.message} />
          </div>

          <div className="grid gap-1.5">
            <Label>If they already claimed a link</Label>
            <Textarea rows={2} {...form.register("duplicateMessage")} />
            <p className="text-muted-foreground text-xs">
              The same editor link again, so they can carry on where they stopped. One
              message, nothing else sent alongside it.
            </p>
            <FieldError message={errors.duplicateMessage?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">4 · When they publish</p>
              <p className="text-muted-foreground text-xs">
                The invitation card itself, sent the moment they publish it rather than
                when they claim the link — before that there is no public page to send.
                Sent once per invitation, so the re-publishes people do while tweaking
                don&apos;t each become a message.
              </p>
            </div>
            <Switch
              checked={Boolean(form.watch("notifyOnPublish"))}
              onCheckedChange={(v) => form.setValue("notifyOnPublish", v)}
            />
          </div>

          {form.watch("notifyOnPublish") && (
            <div className="grid gap-1.5">
              <Label>Published message</Label>
              <Textarea rows={3} {...form.register("publishedMessage")} />
              <p className="text-muted-foreground text-xs">
                {"{{link}}"} is the public invitation their guests open — not the
                editor. Instagram only accepts a message within 24 hours of their last
                one to you, so an invitation published days later can&apos;t be
                announced; it&apos;s logged as a failed send rather than retried.
              </p>
              <FieldError message={errors.publishedMessage?.message} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">5 · Live only while they follow</p>
              <p className="text-muted-foreground text-xs">
                Building an invitation is never gated — that is the offer. This gates{" "}
                <em>circulation</em>: an invitation claimed through Instagram shows a
                follow-first screen to its guests whenever its owner isn&apos;t
                following, and comes straight back when they are. Their work, photos and
                RSVPs are untouched throughout.
              </p>
            </div>
            <Switch
              checked={Boolean(form.watch("gateInvitations"))}
              onCheckedChange={(v) => form.setValue("gateInvitations", v)}
            />
          </div>

          {form.watch("gateInvitations") && (
            <div className="grid gap-1.5">
              <Label>What the paused invitation says</Label>
              <Textarea rows={3} {...form.register("pausedMessage")} />
              <p className="text-muted-foreground text-xs">
                Read by the couple&apos;s guests as often as by the couple, so it works
                best as an explanation rather than a telling-off. Blank uses the
                built-in wording. The &ldquo;Follow&rdquo; button underneath uses the
                profile link above.
              </p>
            </div>
          )}
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
