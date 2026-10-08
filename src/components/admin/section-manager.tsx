"use client";
import { useState } from "react";
import { SECTION_GROUPS, eventSectionType } from "@/lib/invitation-sections";
import { sectionDisplayName } from "@/lib/section-labels";

export function SectionManager({ selected, onChange, onSelect, onCustomSection, names = {} }: { selected: string[]; onChange: (next: string[]) => void; onSelect?: (type: string) => void; onCustomSection?: (type: string, name: string) => void; names?: Record<string, string> }) {
  const [custom, setCustom] = useState("");
  function add(type: string) { if (!selected.includes(type)) onChange([...selected, type]); onSelect?.(type); }
  function move(index: number, delta: number) { const next = [...selected]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; onChange(next); }
  return <div className="grid gap-4">
    <p className="text-xs text-muted-foreground">Each event is an independent section with its own artwork, text layers and style. Reorder or remove sections here.</p>
    <div className="grid gap-2"><h3 className="text-sm font-semibold">Your sections</h3>{selected.map((type, index) => <div key={`${type}:${index}`} className="flex min-w-0 items-center gap-1 rounded-xl border bg-white p-2">
      <button type="button" className="min-w-0 flex-1 truncate text-left text-xs font-semibold" onClick={() => onSelect?.(type)}>{index + 1}. {names[type] ?? sectionDisplayName(type)}</button>
      <button type="button" aria-label={`Move ${names[type] ?? sectionDisplayName(type)} up`} disabled={!index} onClick={() => move(index, -1)} className="px-2 py-1 disabled:opacity-30">↑</button>
      <button type="button" aria-label={`Move ${names[type] ?? sectionDisplayName(type)} down`} disabled={index === selected.length - 1} onClick={() => move(index, 1)} className="px-2 py-1 disabled:opacity-30">↓</button>
      <button type="button" aria-label={`Remove ${names[type] ?? sectionDisplayName(type)}`} disabled={selected.length <= 1} onClick={() => onChange(selected.filter((_, at) => at !== index))} className="px-2 py-1 text-red-700 disabled:opacity-30">×</button>
    </div>)}</div>
    {SECTION_GROUPS.map((group) => <section key={group.name} className="grid gap-2"><h3 className="text-xs font-semibold">{group.name}</h3><div className="flex flex-wrap gap-2">{group.types.map((type) => <button key={type} type="button" disabled={selected.includes(type)} onClick={() => add(type)} className="rounded-full border bg-white px-3 py-2 text-xs disabled:opacity-40">+ {sectionDisplayName(type)}</button>)}</div></section>)}
    <label className="grid gap-2 text-xs font-semibold">Custom event<input maxLength={80} value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Ceremony name" className="rounded-lg border p-2" /></label>
    <button type="button" disabled={!custom.trim()} className="rounded-xl bg-violet-700 p-2 text-xs text-white disabled:opacity-40" onClick={() => { let type = eventSectionType(custom); if (selected.includes(type)) type = `EVENT_${Date.now().toString(36)}`; onCustomSection?.(type, custom.trim()); add(type); setCustom(""); }}>Add independent event section</button>
  </div>;
}
