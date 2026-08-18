"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck } from "lucide-react";

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
  const [result, setResult] = useState<{ liveUrl: string; editUrl: string } | null>(null);
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
      const res = await publishGuestInvitationAction({ invitationId, phone });
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
                Almost done
              </DialogTitle>
              <DialogDescription>
                Add your WhatsApp number so we can send you a private link to edit this
                invitation later — no code, no waiting, you&apos;ll be live right away.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="publish-phone">WhatsApp number</Label>
              <Input
                id="publish-phone"
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
            </div>
            <Button onClick={handlePublish} disabled={isPending || phone.trim().length < 6}>
              {isPending ? "Publishing…" : "Publish my invitation"}
            </Button>
          </>
        )}

        {phase === "success" && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-primary size-5" />
                Your invitation is live!
              </DialogTitle>
              <DialogDescription>
                We&apos;re also sending your shareable link and private edit link to your
                WhatsApp — but keep this page open or bookmark the edit link below either way.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 text-sm">
              <div>
                <Label className="text-muted-foreground text-xs">Share with guests</Label>
                <a href={result.liveUrl} target="_blank" className="text-primary block truncate underline">
                  {result.liveUrl}
                </a>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Your private edit link</Label>
                <a href={result.editUrl} className="text-primary block truncate underline">
                  {result.editUrl}
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <a href={result.liveUrl} target="_blank">
                  View my invitation
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href={`/manage/${invitationId}`}>Manage &amp; edit</a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
