"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateUserGroupAction } from "@/lib/actions/admin";
import { isAdminGroup } from "@/lib/user-groups";

/**
 * Puts an account in a user group. This is the promote/demote control — admin
 * follows membership of "Admin User", so there is no separate role switch to
 * fall out of step with it.
 *
 * A native select rather than the Radix one: it sits inside a table row on a
 * screen that can list hundreds of accounts, and the native picker is the
 * control that stays usable at that size on a phone.
 */
export function UserGroupSelect({
  userId,
  group,
  groups,
  isSelf,
}: {
  userId: string;
  group: string | null;
  /** Group names, from the `usergroups` collection. */
  groups: string[];
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const current = group ?? "";
  // An account whose group is not in the collection still has to show its own
  // value, or this control would silently offer to change it to something else.
  const options = groups.includes(current) || !current ? groups : [current, ...groups];

  function onChange(next: string) {
    if (next === current) return;
    if (isSelf && !isAdminGroup(next)) {
      toast.error("You can't remove your own admin access.");
      return;
    }
    if (
      isAdminGroup(next) &&
      !confirm(`Give this account full admin access by putting it in "${next}"?`)
    ) {
      return;
    }

    startTransition(async () => {
      const result = await updateUserGroupAction({ userId, group: next });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(next ? `Moved to ${next}.` : "Group cleared.");
      router.refresh();
    });
  }

  return (
    <select
      aria-label="User group"
      className="border-input h-8 rounded-md border bg-transparent px-2 text-xs disabled:opacity-50"
      value={current}
      disabled={isPending}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">No group</option>
      {options.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
