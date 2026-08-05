"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateUserRoleAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function UserRoleToggle({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: "USER" | "ADMIN";
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    const nextRole = role === "ADMIN" ? "USER" : "ADMIN";
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role: nextRole });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${nextRole === "ADMIN" ? "Promoted" : "Demoted"}.`);
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending || (isSelf && role === "ADMIN")}
      onClick={handleClick}
    >
      {role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
    </Button>
  );
}
