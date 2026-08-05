"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/auth";

export function DeleteEntityButton({
  id,
  confirmLabel,
  action,
}: {
  id: string;
  confirmLabel: string;
  action: (id: string) => Promise<ActionResult>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(confirmLabel)) return;
    startTransition(async () => {
      const result = await action(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Deleted.");
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="icon" disabled={isPending} onClick={handleDelete}>
      <Trash2 className="text-destructive size-4" />
    </Button>
  );
}
