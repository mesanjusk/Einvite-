"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";

import { requestPublishOtpAction, verifyPublishOtpAction } from "@/lib/actions/guest-invitation";
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

type Phase = "phone" | "otp" | "success";

export function PublishOtpDialog({
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
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [result, setResult] = useState<{ liveUrl: string; editUrl: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setPhase("phone");
    setPhone("");
    setCode("");
    setDevCode(null);
    setResult(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleRequestOtp() {
    startTransition(async () => {
      const res = await requestPublishOtpAction({ invitationId, phone });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setDevCode(res.data.devCode ?? null);
      toast.success(
        res.data.devMode
          ? "WhatsApp isn't configured yet — using the on-screen code for now."
          : "Code sent on WhatsApp.",
      );
      setPhase("otp");
    });
  }

  function handleVerifyOtp() {
    startTransition(async () => {
      const res = await verifyPublishOtpAction({ invitationId, phone, code });
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
                Verify your WhatsApp number
              </DialogTitle>
              <DialogDescription>
                We&apos;ll text a one-time code to confirm it&apos;s you. Each mobile number can
                publish one invitation, and we&apos;ll send you a private link on WhatsApp to edit
                it later.
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
            <Button onClick={handleRequestOtp} disabled={isPending || phone.trim().length < 6}>
              {isPending ? "Sending…" : "Send code on WhatsApp"}
            </Button>
          </>
        )}

        {phase === "otp" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="text-primary size-5" />
                Enter the code
              </DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to {phone} on WhatsApp. It expires in 10 minutes.
              </DialogDescription>
            </DialogHeader>
            {devCode && (
              <p className="rounded-md border border-dashed p-2 text-center text-sm">
                Dev mode (WhatsApp not configured) — your code is{" "}
                <span className="font-mono font-semibold">{devCode}</span>
              </p>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="publish-otp">6-digit code</Label>
              <Input
                id="publish-otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" type="button" onClick={() => setPhase("phone")}>
                Change number
              </Button>
              <Button onClick={handleVerifyOtp} disabled={isPending || code.length !== 6}>
                {isPending ? "Verifying…" : "Verify & publish"}
              </Button>
            </div>
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
                We sent your shareable link and a private edit link to your WhatsApp — keep that
                message, it&apos;s how you&apos;ll come back to make changes.
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
