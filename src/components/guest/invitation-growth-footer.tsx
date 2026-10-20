"use client";

import { Instagram, Printer, Sparkles } from "lucide-react";
import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
import { StoryShareButton } from "@/components/guest/story-share-button";
import { INSTAGRAM_PROFILE, PRINT_ENQUIRY_URL } from "@/lib/invitation-growth";
import { trackInvitationGrowth } from "@/lib/track-invitation-growth";

/** Appears once, after the celebration, never as an intrusive fixed overlay. */
export function InvitationGrowthFooter({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  return (
    <footer className="no-print relative z-10 mx-auto max-w-[430px] bg-[#f9f4fa] px-5 pb-10 pt-8 text-center text-[#4b3659]">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-[#eee4f3]">
        <Sparkles className="size-5 text-[#795a8b]" />
      </div>
      <p className="text-[11px] tracking-[0.13em] text-[#826b90] uppercase">Beautifully created with</p>
      <h2 className="mt-1 font-display text-2xl font-semibold">SK Digital</h2>
      <p className="mt-2 text-sm text-[#795f82]">Loved this invitation? Make your own with the same design.</p>
      <StartLiveInvitationButton
        fromSlug={slug}
        className="mt-4 min-h-12 w-full rounded-full bg-[#654a7b] px-6 text-sm font-semibold text-white shadow-sm"
      >
        Create your own invitation
      </StartLiveInvitationButton>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <a
          href={INSTAGRAM_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackInvitationGrowth(slug, "CLICK_INSTAGRAM")}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-4 text-sm font-semibold"
        >
          <Instagram className="size-4" /> Follow SK Digital
        </a>
        <a
          href={PRINT_ENQUIRY_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackInvitationGrowth(slug, "PRINT_ENQUIRY")}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-4 text-sm font-semibold"
        >
          <Printer className="size-4" /> Printed invitations
        </a>
      </div>
      <div className="mt-6">
        <StoryShareButton
          url={`https://invite.sanjusk.in/invite/${encodeURIComponent(slug)}`}
          invitationSlug={slug}
          title={title}
        />
      </div>
      <p className="mt-6 text-[10px] text-[#907e97]">
        These links are optional. Your invitation and RSVP remain available without following us.
      </p>
    </footer>
  );
}
