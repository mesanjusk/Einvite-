"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Smartphone } from "lucide-react";

import { attachPhoneToInvitationAction } from "@/lib/actions/guest-invitation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Shown on an invitation published without a mobile number. Access is
 * currently this browser's cookie alone, so adding a number is what makes it
 * reachable from another device.
 */
export function AddPhoneCard({ invitationId }: { invitationId: string }) {
  const [phone, setPhone] = useState("");
  const [editUrl, setEditUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await attachPhoneToInvitationAction({ invitationId, phone });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setEditUrl(result.data.editUrl);
      toast.success("Saved — your edit link is ready.");
    });
  }

  if (editUrl) {
    return (
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Check className="text-primary size-4" />
            Edit link ready
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs">Keep this link</Label>
          <a href={editUrl} className="text-primary truncate text-sm underline">
            {editUrl}
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="text-primary size-4" />
          Add your mobile number
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          Right now this invitation only opens on this device. Add a number and we&apos;ll send
          you a link that works anywhere.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="tel"
            inputMode="tel"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-label="Mobile number"
          />
          <Button onClick={handleSave} disabled={isPending || phone.trim().length < 6}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
