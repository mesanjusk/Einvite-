"use client";

import { useState, useTransition } from "react";
import { Trash2, Link2, Check } from "lucide-react";
import { toast } from "sonner";

import { deleteGuestAction } from "@/lib/actions/rsvp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Guest = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  group: string | null;
  rsvpStatus: "ACCEPTED" | "DECLINED" | "MAYBE" | null;
  viewedAt: Date | null;
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ACCEPTED: "default",
  MAYBE: "secondary",
  DECLINED: "destructive",
};

export function GuestRow({ guest, inviteLink }: { guest: Guest; inviteLink: string }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGuestAction(guest.id);
      if (!result.success) toast.error(result.error);
    });
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success(`Personalized link copied for ${guest.name}.`);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3 font-medium">{guest.name}</td>
      <td className="text-muted-foreground px-4 py-3">{guest.group ?? "—"}</td>
      <td className="text-muted-foreground px-4 py-3">
        {guest.email ?? guest.phone ?? "—"}
      </td>
      <td className="px-4 py-3">
        {guest.rsvpStatus ? (
          <Badge variant={statusVariant[guest.rsvpStatus]}>{guest.rsvpStatus}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Pending</span>
        )}
      </td>
      <td className="px-4 py-3">
        {guest.viewedAt ? (
          <Badge variant="secondary">Viewed</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Not yet</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            aria-label={`Copy personalized link for ${guest.name}`}
            title="Copy personalized invite link"
          >
            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            onClick={handleDelete}
            aria-label={`Remove ${guest.name}`}
          >
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
