"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateInvitationPdfExtraTextAction } from "@/lib/actions/theme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function PdfExtraTextForm({
  invitationId,
  initialText,
}: {
  invitationId: string;
  initialText: string;
}) {
  const [text, setText] = useState(initialText);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      const result = await updateInvitationPdfExtraTextAction({
        invitationId,
        pdfExtraText: text,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="pdf-extra-text">Extra text for the PDF only</Label>
        <Textarea
          id="pdf-extra-text"
          rows={4}
          placeholder="A formal invitation letter, extra details, or anything else that should only appear on the printed PDF — not the website."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <Button onClick={handleSave} disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
