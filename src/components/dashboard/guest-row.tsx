"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
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
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ACCEPTED: "default",
  MAYBE: "secondary",
  DECLINED: "destructive",
};

export function GuestRow({ guest }: { guest: Guest }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGuestAction(guest.id);
      if (!result.success) toast.error(result.error);
    });
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
      <td className="px-4 py-3 text-right">
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          onClick={handleDelete}
          aria-label={`Remove ${guest.name}`}
        >
          <Trash2 className="text-destructive size-4" />
        </Button>
      </td>
    </tr>
  );
}
