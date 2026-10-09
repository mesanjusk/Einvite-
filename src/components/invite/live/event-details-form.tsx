"use client";

import type { InviteData } from "../types";
import type { EditDateTarget, EditTarget } from "../edit-context";

type Props = {
  invite: InviteData;
  onText: (target: EditTarget, value: string) => void;
  onDate: (target: EditDateTarget, value: string) => void;
};

/** Nontechnical users can finish essentials without finding editable text layers. */
export function EventDetailsForm({ invite, onText, onDate }: Props) {
  const text = (label: string, value: string | null, target: EditTarget) => (
    <label key={label} className="grid gap-1.5 text-sm font-medium text-[#4b3659]">
      {label}
      <input
        aria-label={label}
        className="min-h-11 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-base text-[#352641]"
        defaultValue={value ?? ""}
        onBlur={(event) => {
          if (event.target.value !== (value ?? "")) onText(target, event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </label>
  );
  const date = (label: string, value: Date, target: EditDateTarget) => (
    <label className="grid gap-1.5 text-sm font-medium text-[#4b3659]">
      {label}
      <input
        type="date"
        aria-label={label}
        className="min-h-11 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-base"
        defaultValue={value.toISOString().slice(0, 10)}
        onChange={(event) => {
          if (event.target.value) onDate(target, event.target.value);
        }}
      />
    </label>
  );

  return (
    <section className="mb-6 grid gap-4" aria-label="Quick invitation details">
      <div>
        <h3 className="text-lg font-semibold text-[#4b3659]">Quick setup</h3>
        <p className="mt-1 text-sm text-[#806b8c]">
          Start with names, date and venue. Auto-saves when you leave a field.
        </p>
        <p className="mt-1 text-xs text-[#806b8c]">
          नाम, तारीख और स्थान भरें · नाव, तारीख आणि ठिकाण भरा
        </p>
      </div>
      <div className="grid gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">1 · Couple</p>
        {text("Bride / Primary name", invite.brideName, { kind: "invitation", field: "brideName" })}
        {text("Groom / Second name", invite.groomName, { kind: "invitation", field: "groomName" })}
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">2 · Main date</p>
        {date("Wedding date", invite.weddingDate, { kind: "invitation" })}
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">3 · Venue</p>
        {text("Venue name", invite.venueName, { kind: "invitation", field: "venueName" })}
        {text("Address", invite.venueAddress, { kind: "invitation", field: "venueAddress" })}
        <details>
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-violet-800">Add Google Maps link (optional)</summary>
          {text("Google Maps URL", invite.googleMapsUrl, { kind: "invitation", field: "googleMapsUrl" })}
        </details>
      </div>
      <div className="grid gap-3">
        <h4 className="text-base font-semibold text-[#4b3659]">Ceremony dates & venues</h4>
        <p className="text-sm text-[#806b8c]">Optional: set a different place and time for each function.</p>
        {invite.events.map((event) => (
          <details key={event.id} className="rounded-xl border border-violet-200 bg-white p-3">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">{event.name}</summary>
            <div className="mt-3 grid gap-3">
              {text("Event name", event.name, { kind: "event", eventId: event.id, field: "name" })}
              {date("Event date", event.date, { kind: "event", eventId: event.id })}
              {text("Time", event.time, { kind: "event", eventId: event.id, field: "time" })}
              {text("Venue", event.venueName, { kind: "event", eventId: event.id, field: "venueName" })}
              {text("Address", event.address, { kind: "event", eventId: event.id, field: "address" })}
              {text("Google Maps URL", event.googleMapsUrl, { kind: "event", eventId: event.id, field: "googleMapsUrl" })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
