"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { startLiveInvitationAction } from "@/lib/actions/live-invitation";
import { cn } from "@/lib/utils";
import { WeddingLoadingScreen } from "@/components/guest/wedding-loading-screen";

/**
 * Starts a private draft from the design the visitor chose. The loading
 * screen appears on the very first click, before the server action finishes,
 * so the experience never falls back to a disabled button and a blank wait.
 */
export function StartLiveInvitationButton({
  fromSlug,
  category,
  themeSlug,
  children,
  className,
  style,
  ariaLabel,
}: {
  ariaLabel?: string;
  fromSlug?: string;
  category?: string;
  themeSlug?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  loadingVideoUrl?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function start() {
    if (isPending) return;

    startTransition(async () => {
      const result = await startLiveInvitationAction({ fromSlug, category, themeSlug });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push(`/design/${result.data.invitationId}?edit=1`);
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={start}
        disabled={isPending}
        aria-busy={isPending}
        className={cn(className, isPending && "cursor-wait")}
        style={style}
      >
        {children}
      </button>
      {isPending && (
        <WeddingLoadingScreen
          message="Preparing your invitation editor"
        />
      )}
    </>
  );
}
