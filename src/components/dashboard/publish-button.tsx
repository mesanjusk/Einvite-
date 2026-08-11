"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

import { publishInvitationAction } from "@/lib/actions/invitation";
import { Button } from "@/components/ui/button";

export function PublishButton({
  invitationId,
  isPublished,
}: {
  invitationId: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await publishInvitationAction(invitationId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.data.autoFilledPhotos > 0
          ? `Invitation is live! Added ${result.data.autoFilledPhotos} placeholder photo${result.data.autoFilledPhotos === 1 ? "" : "s"} — swap them for your own from the Media Library any time.`
          : "Invitation is live!",
      );
      router.refresh();
    });
  }

  if (isPublished) {
    return (
      <Button variant="secondary" disabled>
        <Rocket />
        Published
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      <Rocket />
      {isPending ? "Publishing…" : "Publish invitation"}
    </Button>
  );
}
