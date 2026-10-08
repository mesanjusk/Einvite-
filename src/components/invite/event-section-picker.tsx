"use client";

import { useState } from "react";
import { EVENT_SECTION_PRESETS } from "@/lib/event-sections";
import { useInviteEdit } from "./edit-context";

export function EventSectionPicker() {
  const edit = useInviteEdit();
  const [name, setName] = useState<string>(EVENT_SECTION_PRESETS[0]);
  if (!edit?.active) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <select aria-label="Event section to add" value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 rounded-xl border bg-white px-3 py-2 text-sm text-black">
        {EVENT_SECTION_PRESETS.map((preset) => <option key={preset}>{preset}</option>)}
        <option value="New event">Other event</option>
      </select>
      <button type="button" disabled={edit.pending > 0} onClick={() => edit.addEvent(name)} className="rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-50">+ Add event section</button>
      <p className="w-full text-[11px] opacity-70">Each event gets its own date, time, venue and editable section.</p>
    </div>
  );
}
