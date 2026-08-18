"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleInstagramAutomationAction } from "@/lib/actions/admin";
import { Switch } from "@/components/ui/switch";

export function InstagramAutomationToggle({
  automationId,
  isActive,
}: {
  automationId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(next: boolean) {
    startTransition(async () => {
      const result = await toggleInstagramAutomationAction(automationId, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Automation resumed." : "Automation paused.");
      router.refresh();
    });
  }

  return <Switch checked={isActive} disabled={isPending} onCheckedChange={handleChange} />;
}
