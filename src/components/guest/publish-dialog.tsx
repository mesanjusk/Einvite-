"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, CheckCircle2, Copy, ShieldCheck } from "lucide-react";

import { publishGuestInvitationAction } from "@/lib/actions/guest-invitation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Phase = "phone" | "success";

/**
 * One of the two links this screen exists to hand over.
 *
 * The link wraps rather than truncating. An ellipsis looks tidier and is
 * useless here: the whole point of the screen is that someone reads, copies
 * or long-presses these, and half a URL can't be checked against the one they
 * paste later. Wrapping also keeps the dialog honest on a narrow screen —
 * nothing unbreakable means nothing to overflow.
 *
 * The copy button is not a nicety either. This is opened inside Instagram's
 * in-app browser as often as anywhere, where text selection is fiddly and
 * there is no address bar to fall back on.
 */
function CopyableLink({
  label,
  href,
  hint,
  openInNewTab,
}: {
  label: string;
  href: string;
  hint?: string;
  openInNewTab?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is blocked in some in-app browsers; the link is
      // still right there to long-press, so this stays quiet rather than
      // throwing an error at someone who can just do it by hand.
      toast.message("Long-press the link to copy it.");
    }
  }

  return (
    <div className="min-w-0 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <Label className="text-muted-foreground text-xs">{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground -my-1 h-7 shrink-0 px-2"
          onClick={copy}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <a
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noreferrer" : undefined}
        className="text-primary mt-1 block break-all underline"
      >
        {href}
      </a>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}

export function PublishDialog({
  open,
  onOpenChange,
  invitationId,
  onPublished,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  onPublished?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{
    liveUrl: string;
    editUrl: string | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setPhase("phone");
    setPhone("");
    setResult(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handlePublish() {
    startTransition(async () => {
      const trimmed = phone.trim();
      const res = await publishGuestInvitationAction({
        invitationId,
        ...(trimmed.length >= 6 ? { phone: trimmed } : {}),
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setResult({ liveUrl: res.data.liveUrl, editUrl: res.data.editUrl });
      setPhase("success");
      onPublished?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {phase === "phone" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary size-5" />
                Publish
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="publish-phone">Mobile number (optional)</Label>
              <Input
                id="publish-phone"
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
            </div>
            <Button onClick={handlePublish} disabled={isPending}>
              {isPending ? "Publishing…" : "Publish my invitation"}
            </Button>
          </>
        )}

        {phase === "success" && result && (
          <PublishSuccess
            liveUrl={result.liveUrl}
            editUrl={result.editUrl}
            invitationId={invitationId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * What the dialog shows once the invitation is up: the two links, and the two
 * places to go next. Exported so it can be rendered on its own — the layout
 * of a narrow screen is the whole risk here, and it was worth being able to
 * look at it without publishing an invitation to get there.
 */
export function PublishSuccess({
  liveUrl,
  editUrl,
  invitationId,
}: {
  liveUrl: string;
  editUrl?: string | null;
  invitationId: string;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="text-primary size-5" />
          Your invitation is live!
        </DialogTitle>
        <DialogDescription>
          Bookmark your edit link — it&apos;s how you get back in.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-w-0 flex-col gap-3 text-sm">
        <CopyableLink label="Share with guests" href={liveUrl} openInNewTab />
        {editUrl && (
          <CopyableLink
            label="Your private edit link"
            href={editUrl}
            hint="Keep this one to yourself — it opens the editor."
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <a href={liveUrl} target="_blank" rel="noreferrer">
            View my invitation
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href={`/manage/${invitationId}`}>Manage &amp; edit</a>
        </Button>
      </div>
    </>
  );
}
