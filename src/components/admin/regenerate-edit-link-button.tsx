"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { adminRegenerateEditLinkAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function RegenerateEditLinkButton({ invitationId }: { invitationId: string }) {
  const [isPending, startTransition] = useTransition();
  const [editUrl, setEditUrl] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "Generate a new edit link for this couple? Their previous edit link will stop working.",
      )
    )
      return;
    startTransition(async () => {
      const result = await adminRegenerateEditLinkAction(invitationId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setEditUrl(result.data.editUrl);
    });
  }

  if (editUrl) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground text-xs">
          New edit link — copy and share it with the couple, it won&apos;t be shown again:
        </span>
        <a href={editUrl} className="text-primary break-all underline">
          {editUrl}
        </a>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
      <KeyRound />
      {isPending ? "Generating…" : "Generate new edit link"}
    </Button>
  );
}
