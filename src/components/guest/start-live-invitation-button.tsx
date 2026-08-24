"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { startLiveInvitationAction } from "@/lib/actions/live-invitation";
import { cn } from "@/lib/utils";

/**
 * "Make this one mine."
 *
 * Someone who was sent an invitation and wants one like it gets a copy of
 * its *design* and lands straight in the live editor, on a complete
 * invitation they change by tapping it — not on a form asking them to
 * describe the wedding they can already see on screen.
 */
export function StartLiveInvitationButton({
  fromSlug,
  category,
  themeSlug,
  children,
  className,
  style,
}: {
  /** The invitation this was started from — its design travels, its details don't. */
  fromSlug?: string;
  category?: string;
  themeSlug?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      const result = await startLiveInvitationAction({ fromSlug, category, themeSlug });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push(`/design/${result.data.invitationId}`);
    });
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={isPending}
      className={cn(className, isPending && "opacity-70")}
      style={style}
    >
      {isPending ? "Opening your invitation…" : children}
    </button>
  );
}
