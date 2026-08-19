"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleInstagramDmRuleAction } from "@/lib/actions/admin";
import { Switch } from "@/components/ui/switch";

export function InstagramDmRuleToggle({
  ruleId,
  isActive,
}: {
  ruleId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(next: boolean) {
    startTransition(async () => {
      const result = await toggleInstagramDmRuleAction(ruleId, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Rule resumed." : "Rule paused.");
      router.refresh();
    });
  }

  return (
    <Switch checked={isActive} disabled={isPending} onCheckedChange={handleChange} />
  );
}
