"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { setInvitationDemoAction } from "@/lib/actions/admin";
import { IconButton } from "@/components/ui/icon-button";

export function InvitationDemoToggle({
  invitationId,
  isDemo,
}: {
  invitationId: string;
  isDemo: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await setInvitationDemoAction(invitationId, !isDemo);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isDemo ? "Removed from the home page." : "Featured on the home page.");
      router.refresh();
    });
  }

  return (
    <IconButton
      label={isDemo ? "Remove from home page" : "Feature on home page"}
      disabled={isPending}
      onClick={handleClick}
    >
      <Star className={isDemo ? "fill-primary text-primary size-4" : "size-4"} />
    </IconButton>
  );
}
