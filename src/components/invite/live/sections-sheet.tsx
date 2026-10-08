"use client";
import { useRef } from "react";
import { SectionManager } from "@/components/admin/section-manager";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { SectionConfigEntry } from "@/lib/get-invite-data";
export function SectionsSheet({ open, onOpenChange, sections, onChange, pending }: { open: boolean; onOpenChange: (open: boolean) => void; sections: SectionConfigEntry[]; onChange: (next: SectionConfigEntry[]) => void; pending: boolean }) {
  const names = useRef<Record<string, string>>({});
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto"><SheetHeader><SheetTitle>Sections</SheetTitle><SheetDescription>Add, remove and reorder sections. Event details are retained when a section is removed.</SheetDescription></SheetHeader><div className={`p-4 ${pending ? "pointer-events-none opacity-60" : ""}`} aria-busy={pending}>
    <SectionManager selected={sections.filter((section) => section.visible).map((section) => section.type)} names={Object.fromEntries(sections.filter((section) => section.title).map((section) => [section.type, section.title!]))} onCustomSection={(key, name) => { names.current[key] = name; }} onChange={(types) => onChange(types.map((type, order) => ({ ...(sections.find((section) => section.type === type) ?? { id: `${type}-${Date.now()}`, type, visible: true, locked: false }), title: names.current[type] ?? sections.find((section) => section.type === type)?.title, visible: true, order })))} />
  </div></SheetContent></Sheet>;
}
