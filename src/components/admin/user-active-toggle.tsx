"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setUserActiveAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function UserActiveToggle({
  userId,
  isActive,
  isSelf,
}: {
  userId: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await setUserActiveAction({ userId, isActive: !isActive });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isActive ? "Account deactivated." : "Account activated.");
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending || (isSelf && isActive)}
      onClick={handleClick}
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
