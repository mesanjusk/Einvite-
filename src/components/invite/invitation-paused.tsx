"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, RefreshCw } from "lucide-react";

import { recheckInvitationVisibilityAction } from "@/lib/actions/invitation-visibility";
import { Button } from "@/components/ui/button";

/**
 * What a guest sees when the invitation they were sent is waiting on its
 * owner's follow.
 *
 * Two jobs at once, and the wording has to carry both: tell a guest who has
 * never heard of us why a wedding invitation is showing them a screen, and
 * give the couple — who will land here the moment someone tells them the
 * link "isn't working" — one obvious thing to do about it. So the follow
 * button is the loudest thing on the page, and the re-check sits under it
 * for the twenty seconds between following and believing it.
 *
 * It is a page that will mostly be seen by people in a good mood opening a
 * wedding invitation, so it is dressed like one — not like an error.
 */
// lucide dropped its brand icons, so the glyph is drawn here rather than
// pulled in as a dependency for one button.
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InvitationPaused({
  slug,
  message,
  profileUrl,
  handle,
}: {
  slug: string;
  message: string;
  profileUrl: string | null;
  handle: string | null;
}) {
  const [checked, setChecked] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const account = handle ?? "our Instagram";

  function recheck() {
    startTransition(async () => {
      const result = await recheckInvitationVisibilityAction(slug);
      // Live again: the page re-renders as the invitation it always was.
      if (result.live) {
        router.refresh();
        return;
      }
      // Instagram can take a moment to report a brand-new follow, so this
      // says "not yet" rather than "no".
      setChecked(true);
    });
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#faf7f2] px-5 py-16 text-[#2c2418]">
      {/* Soft colour behind the card, so the screen reads as part of an
          invitation rather than as a wall. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-[#e8b4b8] opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-[#c9a227] opacity-25 blur-3xl"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-[#e6ddcd] bg-white/85 p-8 text-center shadow-[0_24px_60px_-32px_rgba(44,36,24,0.55)] backdrop-blur-sm sm:p-10">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-[#f3ece0] text-[#8a6d3b]">
          <Lock className="size-6" strokeWidth={1.5} />
        </div>

        <p className="text-[0.7rem] tracking-[0.2em] text-[#8a7a5c] uppercase">
          Invitation paused
        </p>
        <h1
          className="mt-3 text-3xl leading-tight font-semibold"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
        >
          One follow away
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-[#5b5040]">{message}</p>

        {profileUrl && (
          <Button
            asChild
            size="lg"
            className="mt-7 w-full bg-[#2c2418] text-white hover:bg-[#40341f]"
          >
            <a href={profileUrl} target="_blank" rel="noreferrer">
              <InstagramGlyph className="size-4" />
              Follow {account}
            </a>
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={recheck}
          disabled={pending}
          className="mt-2 w-full text-[#5b5040] hover:bg-[#f3ece0]"
        >
          <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Checking…" : "I've followed — check again"}
        </Button>

        {checked && !pending && (
          <p className="mt-3 text-xs text-[#8a6d3b]">
            Instagram hasn&apos;t caught up yet. Give it a few seconds and tap check
            again.
          </p>
        )}

        <p className="mt-7 border-t border-[#efe7d8] pt-5 text-xs leading-relaxed text-[#8a7a5c]">
          Nothing has been lost — every detail, photo and RSVP is exactly where it was,
          and the invitation reappears here the moment the follow lands.
        </p>
      </div>
    </main>
  );
}
