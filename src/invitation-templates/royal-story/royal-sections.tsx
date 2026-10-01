"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Heart, MapPin } from "lucide-react";
import { toast } from "sonner";

import {
  EditableDate,
  EditableText,
  EditPanelChip,
} from "@/components/invite/editable";
import { useInviteEdit } from "@/components/invite/edit-context";
import { ShareButton } from "@/components/invite/share-button";
import type { InviteData } from "@/components/invite/types";
import { submitRsvpAction } from "@/lib/actions/rsvp";

export function RoyalHero({
  invite,
  guestName,
}: {
  invite: InviteData;
  guestName?: string | null;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-5 py-16">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #f9f1df 0%, #fffaf0 50%, #f4e2c3 100%)",
        }}
      />
      <div className="absolute inset-x-6 top-6 h-px bg-[#9d6b28]/40" />
      <div className="absolute inset-x-6 bottom-6 h-px bg-[#9d6b28]/40" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="relative z-10 w-full max-w-sm text-center"
      >
        <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-full border border-[#9d6b28]/50">
          <Heart className="size-7 text-[#7a2337]" />
        </div>

        {guestName && (
          <p className="mb-5 text-[10px] font-bold tracking-[0.28em] text-[#9d6b28] uppercase">
            Especially for {guestName}
          </p>
        )}

        <p className="text-xs tracking-[0.3em] text-[#7d5e42] uppercase">
          Together with their families
        </p>

        <h1
          className="mt-6 text-[52px] leading-[0.95] text-[#651d33]"
          style={{ fontFamily: "var(--inv-font-display)" }}
        >
          <EditableText
            target={{ kind: "invitation", field: "brideName" }}
            value={invite.brideName}
            placeholder="First name"
          />
        </h1>

        <div className="my-4 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-[#b68a4c]/55" />
          <span
            className="text-3xl text-[#b68a4c]"
            style={{ fontFamily: "var(--inv-font-script)" }}
          >
            &
          </span>
          <span className="h-px w-16 bg-[#b68a4c]/55" />
        </div>

        <h1
          className="text-[52px] leading-[0.95] text-[#651d33]"
          style={{ fontFamily: "var(--inv-font-display)" }}
        >
          <EditableText
            target={{ kind: "invitation", field: "groomName" }}
            value={invite.groomName}
            placeholder="Second name"
          />
        </h1>

        <p className="mx-auto mt-8 max-w-xs text-[15px] leading-7 text-[#6c5947]">
          <EditableText
            target={{ kind: "copy", field: "invitationLetter" }}
            value={
              invite.copy?.invitationLetter ??
              invite.customMessage ??
              "With joyful hearts, we invite you to celebrate our beautiful beginning."
            }
            placeholder="Invitation message"
            multiline
          />
        </p>
      </motion.div>
    </div>
  );
}

export function RoyalStory({ invite }: { invite: InviteData }) {
  const photos = invite.media
    .filter((item) => item.type !== "VIDEO")
    .slice(0, 3);

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#f8eedc] px-5 py-16">
      <div className="mx-auto max-w-sm">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.28em] text-[#9d6b28] uppercase">
            Chapters of us
          </p>
          <h2
            className="mt-3 text-4xl text-[#651d33]"
            style={{ fontFamily: "var(--inv-font-display)" }}
          >
            <EditableText
              target={{ kind: "copy", field: "storyHeadline" }}
              value={invite.copy?.storyHeadline ?? "Our Story"}
              placeholder="Story heading"
            />
          </h2>
        </div>

        <div className="relative mt-10 h-[470px]">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.12 }}
              className="absolute overflow-hidden rounded-[22px] border-[8px] border-white bg-white shadow-[0_18px_44px_rgba(73,35,28,.2)]"
              style={{
                width: index === 0 ? "72%" : "58%",
                height: index === 0 ? 260 : 210,
                left: index === 0 ? "4%" : index === 1 ? "40%" : "12%",
                top: index === 0 ? 0 : index === 1 ? 150 : 280,
                rotate: index === 0 ? "-5deg" : index === 1 ? "6deg" : "-2deg",
                zIndex: index + 1,
              }}
            >
              <Image
                src={photo.url}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="300px"
              />
            </motion.div>
          ))}

          {photos.length === 0 && (
            <div className="grid h-full place-items-center rounded-[28px] border border-dashed border-[#9d6b28]/35 text-center text-sm text-[#80634a]">
              Your photos will create the story here.
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-center">
          <EditPanelChip panel="photos">Change story photos</EditPanelChip>
        </div>
      </div>
    </div>
  );
}

export function RoyalEvents({ invite }: { invite: InviteData }) {
  const edit = useInviteEdit();

  return (
    <div className="min-h-svh bg-[#35101b] px-4 py-16">
      <div className="mx-auto max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-bold tracking-[0.28em] text-[#ddb86e] uppercase">
            The celebrations
          </p>
          <h2
            className="mt-3 text-4xl text-[#fff1d2]"
            style={{ fontFamily: "var(--inv-font-display)" }}
          >
            Festivities
          </h2>
        </div>

        <div className="grid gap-4">
          {invite.events.map((event, index) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, x: index % 2 ? 28 : -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              className="relative overflow-hidden rounded-[28px] border border-[#ddb86e]/35 bg-[#fff6df] p-6 shadow-xl"
            >
              <div className="absolute top-0 right-0 size-24 rounded-bl-full bg-[#ead09a]/30" />
              <p className="text-[9px] font-bold tracking-[0.2em] text-[#9a6b32] uppercase">
                Celebration {index + 1}
              </p>
              <h3
                className="mt-2 text-3xl text-[#651d33]"
                style={{ fontFamily: "var(--inv-font-display)" }}
              >
                <EditableText
                  target={{ kind: "event", eventId: event.id, field: "name" }}
                  value={event.name}
                  placeholder="Function name"
                />
              </h3>

              <EditableDate
                target={{ kind: "event", eventId: event.id }}
                value={event.date}
              >
                <p className="mt-4 text-sm font-semibold text-[#6f503a]">
                  {event.date.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </EditableDate>

              <p className="mt-2 text-sm text-[#745c49]">
                <EditableText
                  target={{ kind: "event", eventId: event.id, field: "time" }}
                  value={event.time ?? ""}
                  placeholder="Time"
                />
              </p>

              <p className="mt-3 text-sm leading-6 text-[#745c49]">
                <EditableText
                  target={{ kind: "event", eventId: event.id, field: "venueName" }}
                  value={event.venueName ?? ""}
                  placeholder="Venue"
                />
              </p>

              {edit?.active && (
                <button
                  type="button"
                  className="mt-4 text-xs font-semibold text-[#8b3048]"
                  onClick={() => edit.removeEvent(event.id)}
                >
                  Remove this function
                </button>
              )}
            </motion.article>
          ))}
        </div>

        {edit?.active && (
          <button
            type="button"
            onClick={() => edit.addEvent()}
            className="mt-5 w-full rounded-full border border-dashed border-[#ddb86e]/60 px-4 py-3 text-sm font-semibold text-[#f4d79c]"
          >
            + Add another function
          </button>
        )}
      </div>
    </div>
  );
}

export function RoyalVenue({ invite }: { invite: InviteData }) {
  return (
    <div className="relative min-h-svh bg-[#f6ead4] px-5 py-16">
      <div className="mx-auto flex min-h-[80svh] max-w-sm items-center">
        <div className="w-full overflow-hidden rounded-[34px] border border-[#a97835]/40 bg-[#fffaf0] shadow-[0_28px_70px_rgba(74,31,34,.16)]">
          <div className="bg-[#651d33] px-6 py-9 text-center text-[#fff2d4]">
            <MapPin className="mx-auto size-7 text-[#e5bd69]" />
            <p className="mt-3 text-[10px] tracking-[0.28em] text-[#e5bd69] uppercase">
              Meet us here
            </p>
            <h2
              className="mt-2 text-3xl"
              style={{ fontFamily: "var(--inv-font-display)" }}
            >
              The Venue
            </h2>
          </div>

          <div className="p-7 text-center">
            <p
              className="text-2xl text-[#651d33]"
              style={{ fontFamily: "var(--inv-font-display)" }}
            >
              <EditableText
                target={{ kind: "invitation", field: "venueName" }}
                value={invite.venueName ?? ""}
                placeholder="Venue name"
              />
            </p>
            <p className="mt-3 text-sm leading-6 text-[#745c49]">
              <EditableText
                target={{ kind: "invitation", field: "venueAddress" }}
                value={invite.venueAddress ?? ""}
                placeholder="Venue address"
                multiline
              />
            </p>

            {invite.googleMapsUrl ? (
              <a
                href={invite.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#651d33] px-5 py-3 text-xs font-bold tracking-[0.12em] text-[#fff3d8] uppercase"
              >
                <MapPin className="size-4" />
                Open directions
              </a>
            ) : (
              <div className="mt-5 text-sm text-[#8b6a4f]">
                <EditableText
                  target={{ kind: "invitation", field: "googleMapsUrl" }}
                  value=""
                  placeholder="Add Google Maps link"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoyalRsvp({
  invitationId,
  guestId,
  initialGuestName,
}: {
  invitationId: string;
  guestId?: string | null;
  initialGuestName?: string | null;
}) {
  const edit = useInviteEdit();
  const [guestName, setGuestName] = useState(initialGuestName ?? "");
  const [status, setStatus] = useState<"ACCEPTED" | "MAYBE" | "DECLINED">(
    "ACCEPTED",
  );
  const [guestCount, setGuestCount] = useState(1);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (edit?.active) {
      toast.message("This RSVP card is interactive for your guests.");
      return;
    }
    if (!guestName.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitRsvpAction({
        invitationId,
        guestId: guestId ?? undefined,
        guestName: guestName.trim(),
        email: "",
        phone: "",
        status,
        guestCount,
        foodPreference: "",
        comment,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-svh bg-[#4b1022] px-5 py-16">
      <div className="mx-auto flex min-h-[80svh] max-w-sm items-center">
        <div className="w-full rounded-[34px] border border-[#dfba69]/35 bg-[#fff8e8] p-7 shadow-2xl">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#651d33] text-[#f4d486]">
                <Check className="size-6" />
              </span>
              <h2
                className="mt-5 text-3xl text-[#651d33]"
                style={{ fontFamily: "var(--inv-font-display)" }}
              >
                We can&apos;t wait
              </h2>
              <p className="mt-2 text-sm text-[#725b48]">
                Your response has been recorded.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={submit}>
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-[0.28em] text-[#9d6b28] uppercase">
                  Your presence matters
                </p>
                <h2
                  className="mt-2 text-4xl text-[#651d33]"
                  style={{ fontFamily: "var(--inv-font-display)" }}
                >
                  RSVP
                </h2>
              </div>

              <label className="mt-8 block text-xs font-semibold text-[#674d3b]">
                Your name
                <input
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[#c6a875]/55 bg-white/70 px-3 outline-none"
                />
              </label>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["ACCEPTED", "Joyfully yes"],
                  ["MAYBE", "Maybe"],
                  ["DECLINED", "With regrets"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStatus(value as "ACCEPTED" | "MAYBE" | "DECLINED")
                    }
                    className={
                      "rounded-xl border px-2 py-3 text-[10px] font-bold " +
                      (status === value
                        ? "border-[#651d33] bg-[#651d33] text-white"
                        : "border-[#c6a875]/55 text-[#674d3b]")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-xs font-semibold text-[#674d3b]">
                Guests
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={guestCount}
                  onChange={(event) =>
                    setGuestCount(Math.max(1, Number(event.target.value) || 1))
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-[#c6a875]/55 bg-white/70 px-3 outline-none"
                />
              </label>

              <label className="mt-4 block text-xs font-semibold text-[#674d3b]">
                A note for the couple
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="mt-2 w-full resize-none rounded-xl border border-[#c6a875]/55 bg-white/70 p-3 outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-full bg-[#651d33] px-5 py-3.5 text-xs font-bold tracking-[0.16em] text-[#fff2d4] uppercase"
              >
                {submitting ? "Sending…" : "Send RSVP"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function RoyalOutro({
  invite,
  shareUrl,
}: {
  invite: InviteData;
  shareUrl: string;
}) {
  const title =
    invite.brideName + (invite.groomName ? " & " + invite.groomName : "");

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#220812] px-6 py-16 text-center">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#e1bd72_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative z-10 max-w-sm text-[#fff1d6]">
        <Heart className="mx-auto size-7 text-[#e1bd72]" />
        <p className="mt-5 text-[10px] tracking-[0.28em] text-[#e1bd72] uppercase">
          With love
        </p>
        <h2
          className="mt-4 text-5xl leading-tight"
          style={{ fontFamily: "var(--inv-font-script)" }}
        >
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-xs text-sm leading-7 text-[#dfcdb7]">
          Thank you for being part of our story. We look forward to celebrating
          this beautiful day with you.
        </p>
        <div className="mt-8 flex justify-center">
          <ShareButton url={shareUrl} title={title} />
        </div>
      </div>
    </div>
  );
}
