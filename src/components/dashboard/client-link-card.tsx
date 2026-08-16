"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { ownerCreateEditLinkAction } from "@/lib/actions/invitation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function maskPhone(phone: string) {
  return phone.length > 4 ? `${"•".repeat(phone.length - 4)}${phone.slice(-4)}` : phone;
}

export function ClientLinkCard({
  invitationId,
  existingPhone,
}: {
  invitationId: string;
  existingPhone: string | null;
}) {
  const [phone, setPhone] = useState("");
  const [editUrl, setEditUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const result = await ownerCreateEditLinkAction(invitationId, phone);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setEditUrl(result.data.editUrl);
      toast.success("Link ready — copy and share it with the couple.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client access</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          Give the couple a private link so they can view and edit this invitation without a
          dashboard account.
        </p>

        {existingPhone && !editUrl && (
          <p className="text-muted-foreground text-sm">
            Linked to {maskPhone(existingPhone)}.
          </p>
        )}

        {editUrl ? (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs">
              Copy and share this now — it won&apos;t be shown again:
            </span>
            <a href={editUrl} className="text-primary break-all underline">
              {editUrl}
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {!existingPhone && (
              <Input
                placeholder="Couple's WhatsApp number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-56"
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || (!existingPhone && phone.trim().length < 6)}
              onClick={handleGenerate}
            >
              <KeyRound />
              {isPending
                ? "Generating…"
                : existingPhone
                  ? "Generate new link"
                  : "Create private link"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
