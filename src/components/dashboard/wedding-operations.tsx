"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  importWeddingGuestsAction,
  sendWeddingTemplateAction,
  updateWeddingGuestAction,
  type WeddingMessageKind,
} from "@/lib/actions/wedding-operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type WeddingOpsGuest = {
  id: string;
  name: string;
  phone: string | null;
  group: string | null;
  rsvpStatus: "ACCEPTED" | "DECLINED" | "MAYBE" | null;
  guestCount: number | null;
  expectedPartySize: number;
  eventNames: string;
  travelMode: string;
  travelDetails: string;
  hotelDetails: string;
  operationsNotes: string;
  whatsappOptIn: boolean;
  invitationSentAt: string | null;
  reminderSentAt: string | null;
  viewedAt: string | null;
};

type GuestForm = {
  group: string;
  phone: string;
  expectedPartySize: number;
  eventNames: string;
  travelMode: string;
  travelDetails: string;
  hotelDetails: string;
  operationsNotes: string;
  whatsappOptIn: boolean;
};

function formFromGuest(guest: WeddingOpsGuest): GuestForm {
  return {
    group: guest.group ?? "",
    phone: guest.phone ?? "",
    expectedPartySize: guest.expectedPartySize,
    eventNames: guest.eventNames,
    travelMode: guest.travelMode,
    travelDetails: guest.travelDetails,
    hotelDetails: guest.hotelDetails,
    operationsNotes: guest.operationsNotes,
    whatsappOptIn: guest.whatsappOptIn,
  };
}

function GuestOperationRow({
  guest,
  published,
  messagingReady,
}: {
  guest: WeddingOpsGuest;
  published: boolean;
  messagingReady: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<GuestForm>(() => formFromGuest(guest));
  const set = (field: keyof GuestForm, value: string | number | boolean) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  function save() {
    startTransition(async () => {
      const result = await updateWeddingGuestAction({ id: guest.id, ...form });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Guest details saved");
      setEditing(false);
      router.refresh();
    });
  }

  function send(kind: WeddingMessageKind) {
    startTransition(async () => {
      const result = await sendWeddingTemplateAction(guest.id, kind);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(kind === "INVITATION" ? "Invitation accepted by Meta" : "Reminder accepted by Meta");
      router.refresh();
    });
  }

  const canSend = published && messagingReady && guest.whatsappOptIn && Boolean(guest.phone);
  const fieldClass = "w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{guest.name}</p>
          <p className="text-xs text-slate-500">
            {guest.group || "Ungrouped"} · {guest.phone || "No phone"} · Party {guest.expectedPartySize}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            RSVP: {guest.rsvpStatus ?? "Pending"}
            {guest.guestCount ? " (" + guest.guestCount + " attending)" : ""}
            {guest.viewedAt ? " · Opened" : " · Not opened"}
          </p>
          {(guest.travelMode || guest.hotelDetails || guest.travelDetails) && (
            <p className="mt-1 text-xs text-slate-600">
              Travel: {[guest.travelMode, guest.travelDetails, guest.hotelDetails].filter(Boolean).join(" · ")}
            </p>
          )}
          {guest.eventNames && <p className="mt-1 text-xs text-slate-500">Events: {guest.eventNames}</p>}
          <p className="mt-1 text-xs">
            <span className={guest.whatsappOptIn ? "text-emerald-700" : "text-amber-700"}>
              WhatsApp {guest.whatsappOptIn ? "opted in" : "not opted in"}
            </span>
            {guest.invitationSentAt && " · Invite submitted"}
            {guest.reminderSentAt && " · Reminder submitted"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing((value) => !value)}>
            {editing ? "Close" : "Edit"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || !canSend || Boolean(guest.invitationSentAt)}
            onClick={() => send("INVITATION")}
          >
            {guest.invitationSentAt ? "Invite sent" : "Send invite"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !canSend || !guest.invitationSentAt || Boolean(guest.reminderSentAt)}
            onClick={() => send("REMINDER")}
          >
            {guest.reminderSentAt ? "Reminded" : "Reminder"}
          </Button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 grid gap-3 border-t pt-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            WhatsApp phone
            <Input value={form.phone} onChange={(event) => set("phone", event.target.value)} />
          </label>
          <label className="text-xs font-medium">
            Group / family side
            <Input value={form.group} onChange={(event) => set("group", event.target.value)} />
          </label>
          <label className="text-xs font-medium">
            Expected party size
            <Input type="number" min={1} max={50} value={form.expectedPartySize} onChange={(event) => set("expectedPartySize", Number(event.target.value))} />
          </label>
          <label className="text-xs font-medium">
            Ceremonies (comma separated)
            <Input value={form.eventNames} onChange={(event) => set("eventNames", event.target.value)} placeholder="Haldi, Sangeet, Wedding" />
          </label>
          <label className="text-xs font-medium">
            Travel mode
            <select className={fieldClass} value={form.travelMode} onChange={(event) => set("travelMode", event.target.value)}>
              <option value="">Not set</option>
              <option value="Train">Train</option>
              <option value="Flight">Flight</option>
              <option value="Road">Road</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Arrival / travel details
            <Input value={form.travelDetails} onChange={(event) => set("travelDetails", event.target.value)} placeholder="Train and arrival time" />
          </label>
          <label className="text-xs font-medium">
            Hotel / accommodation
            <Input value={form.hotelDetails} onChange={(event) => set("hotelDetails", event.target.value)} />
          </label>
          <label className="text-xs font-medium">
            Coordinator notes
            <Input value={form.operationsNotes} onChange={(event) => set("operationsNotes", event.target.value)} />
          </label>
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="mt-1" checked={form.whatsappOptIn} onChange={(event) => set("whatsappOptIn", event.target.checked)} />
            <span>Guest has explicitly agreed to receive wedding updates on WhatsApp. Uncheck to revoke consent.</span>
          </label>
          <div className="sm:col-span-2">
            <Button type="button" onClick={save} disabled={pending}>Save guest</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WeddingOperations({
  invitationId,
  guests,
  published,
  messagingReady,
}: {
  invitationId: string;
  guests: WeddingOpsGuest[];
  published: boolean;
  messagingReady: boolean;
}) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [verifiedConsent, setVerifiedConsent] = useState(false);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [pending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);

  const groups = useMemo(
    () => Array.from(new Set(guests.map((guest) => guest.group || "Ungrouped"))).sort(),
    [guests],
  );
  const filtered = useMemo(() => guests.filter((guest) => {
    const matchText = [guest.name, guest.phone ?? "", guest.group ?? "", guest.travelDetails]
      .join(" ").toLowerCase().includes(search.toLowerCase());
    return matchText &&
      (group === "all" || (guest.group || "Ungrouped") === group) &&
      (status === "all" || (guest.rsvpStatus ?? "PENDING") === status);
  }), [guests, search, group, status]);

  const attending = guests.reduce((total, guest) => total +
    (guest.rsvpStatus === "ACCEPTED" ? guest.guestCount ?? 1 : 0), 0);
  const pendingCount = guests.filter((guest) => !guest.rsvpStatus).length;
  const optedIn = guests.filter((guest) => guest.whatsappOptIn).length;
  const submitted = guests.filter((guest) => guest.invitationSentAt).length;
  const exportUrl = "/api/wedding-ops/export?invitationId=" + encodeURIComponent(invitationId);

  function handleImport() {
    startTransition(async () => {
      const result = await importWeddingGuestsAction({ invitationId, csv, verifiedConsent });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Imported " + result.data.imported + " guests; skipped " + result.data.skipped + " duplicates");
      setCsv("");
      setFileName("");
      setVerifiedConsent(false);
      router.refresh();
    });
  }

  async function sendNextBatch() {
    const unsent = filtered.filter((guest) =>
      guest.whatsappOptIn && guest.phone && !guest.invitationSentAt).slice(0, 10);
    if (!unsent.length) return toast.message("No opted-in unsent guests in this filter.");
    setSending(true);
    let accepted = 0;
    let failed = 0;
    for (const guest of unsent) {
      const result = await sendWeddingTemplateAction(guest.id, "INVITATION");
      if (result.success) accepted += 1;
      else {
        failed += 1;
        toast.error(guest.name + ": " + result.error);
        // Stop if configuration fails, rather than retrying 10 times.
        if (/configured|Meta rejected|not reachable/.test(result.error)) break;
      }
    }
    setSending(false);
    toast.message(accepted + " submitted to Meta, " + failed + " failed. Review results before sending more.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Guest records", guests.length],
          ["Awaiting RSVP", pendingCount],
          ["People attending", attending],
          ["WhatsApp opted in", optedIn],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-white p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-2xl font-semibold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Import guests from Excel / CSV</h2>
        <p className="text-xs text-slate-600">
          Save your Excel sheet as CSV. Columns: Name, Phone, Email, Group, Party Size,
          Events, Travel Mode, Travel Details, Hotel. Existing phone numbers are skipped.
          Imports are limited to 500 guests at a time.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="max-w-sm"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 400_000) return toast.error("CSV must be smaller than 400 KB.");
              setCsv(await file.text());
              setFileName(file.name);
            }}
          />
          <a
            className="text-sm text-indigo-700 underline"
            download="wedding-guests-template.csv"
            href={"data:text/csv;charset=utf-8," + encodeURIComponent("Name,Phone,Email,Group,Party Size,Events,Travel Mode,Travel Details,Hotel\n")}
          >
            Download CSV template
          </a>
        </div>
        {fileName && <p className="text-xs text-slate-500">Selected: {fileName}</p>}
        <label className="flex items-start gap-2 text-xs text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={verifiedConsent} onChange={(event) => setVerifiedConsent(event.target.checked)} />
          I confirm the imported guests explicitly consented to WhatsApp wedding messages.
          Leave unchecked to import contacts without enabling automated messages.
        </label>
        <Button disabled={!csv || pending} onClick={handleImport}>
          {pending ? "Importing…" : "Import guest list"}
        </Button>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">WhatsApp invitations & reminders</h2>
        <p className="mt-1 text-xs text-slate-600">
          {submitted} invitations submitted to Meta. Only consented guests receive approved
          template messages. Sending requires a published invitation and approved Meta templates.
          "Submitted" is not a delivery or read confirmation.
        </p>
        {!published && <p className="mt-2 text-sm text-amber-700">Publish this invitation to enable sending.</p>}
        {!messagingReady && <p className="mt-2 text-sm text-amber-700">Wedding WhatsApp template configuration is incomplete. Imports and guest management work without it.</p>}
        <Button className="mt-3" disabled={sending || !published || !messagingReady} onClick={sendNextBatch}>
          {sending ? "Sending…" : "Send next 10 eligible invitations"}
        </Button>
        <p className="mt-2 text-xs text-slate-500">Batch sending respects the guest filters below. Meta may charge per template message.</p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-36 flex-1"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find guest, number or travel"
            aria-label="Search guests"
          />
          <select value={group} aria-label="Filter guest group" onChange={(event) => setGroup(event.target.value)} className="rounded-lg border bg-white px-2 py-2 text-sm">
            <option value="all">All groups</option>
            {groups.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={status} aria-label="Filter RSVP status" onChange={(event) => setStatus(event.target.value)} className="rounded-lg border bg-white px-2 py-2 text-sm">
            <option value="all">All RSVPs</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="MAYBE">Maybe</option>
            <option value="DECLINED">Declined</option>
          </select>
          <Button variant="outline" asChild><a href={exportUrl}>Export guests CSV</a></Button>
        </div>
        <p className="text-xs text-slate-500">{filtered.length} matching guests · Edit arrival, accommodation, event groups and consent below</p>
        <div className="space-y-2">
          {filtered.slice(0, 300).map((guest) => (
            <GuestOperationRow
              key={guest.id}
              guest={guest}
              published={published}
              messagingReady={messagingReady}
            />
          ))}
          {filtered.length > 300 && <p className="text-xs text-slate-600">Showing first 300 matching guests. Refine filters for the rest.</p>}
          {!filtered.length && <p className="rounded-xl border p-6 text-center text-sm text-slate-500">No guests found.</p>}
        </div>
      </section>
    </div>
  );
}
