"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  deleteThemeContentItemAction,
  upsertThemeContentItemAction,
} from "@/lib/actions/admin";
import { COMMUNITY_CONTENT_GROUPS } from "@/lib/theme-content-library";
import { SECTION_TYPES, THEME_CONTENT_ROLES } from "@/lib/validations/admin";
import { sectionDisplayName } from "@/lib/section-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ThemeContentLibraryRecord = {
  id: string;
  title: string;
  community: string;
  section: string;
  role: string;
  text: string;
  previewImage: string | null;
  sortOrder: number;
};

type Draft = Omit<ThemeContentLibraryRecord, "id"> & { id?: string };

const EMPTY: Draft = {
  title: "",
  community: "General",
  section: "HERO",
  role: "body",
  text: "",
  previewImage: null,
  sortOrder: 0,
};

export function ThemeContentLibraryManager({
  initialItems,
}: {
  initialItems: ThemeContentLibraryRecord[];
}) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [query, setQuery] = useState("");
  const [community, setCommunity] = useState("All");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCommunity = community === "All" || item.community === community;
      const matchesQuery =
        !needle ||
        [item.title, item.text, item.section, item.role, item.community]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return matchesCommunity && matchesQuery;
    });
  }, [items, query, community]);

  function edit(item: ThemeContentLibraryRecord) {
    setDraft({ ...item });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    startTransition(async () => {
      const result = await upsertThemeContentItemAction({
        id: draft.id,
        title: draft.title,
        community: draft.community,
        section: draft.section as (typeof SECTION_TYPES)[number],
        role: draft.role as (typeof THEME_CONTENT_ROLES)[number],
        text: draft.text,
        previewImage: draft.previewImage || undefined,
        sortOrder: draft.sortOrder,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(draft.id ? "Content updated." : "Content added to library.");
      window.location.reload();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteThemeContentItemAction(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
      if (draft.id === id) setDraft(EMPTY);
      toast.success("Content removed.");
    });
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-3xl border border-violet-200/70 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-[#4b3659]">
              {draft.id ? "Edit content" : "Add content"}
            </h2>
            <p className="mt-1 text-xs text-[#806b8c]">
              Save wording once, classify it community-wise, and apply it later inside any section.
            </p>
          </div>
          {draft.id && (
            <Button type="button" variant="ghost" size="icon" onClick={() => setDraft(EMPTY)}>
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1">
            <Label>Title</Label>
            <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Traditional wedding invitation" />
          </div>
          <div className="grid gap-1">
            <Label>Community</Label>
            <select
              className="border-input h-10 rounded-md border bg-white px-3 text-sm"
              value={draft.community}
              onChange={(e) => setDraft((d) => ({ ...d, community: e.target.value }))}
            >
              {COMMUNITY_CONTENT_GROUPS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="grid gap-1">
            <Label>Section</Label>
            <select
              className="border-input h-10 rounded-md border bg-white px-3 text-sm"
              value={draft.section}
              onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value }))}
            >
              {SECTION_TYPES.map((item) => <option key={item} value={item}>{sectionDisplayName(item)}</option>)}
            </select>
          </div>
          <div className="grid gap-1">
            <Label>Role</Label>
            <select
              className="border-input h-10 rounded-md border bg-white px-3 text-sm capitalize"
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
            >
              {THEME_CONTENT_ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-1">
          <Label>Content text</Label>
          <Textarea rows={4} value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} placeholder="Enter the reusable invitation wording…" />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <div className="grid gap-1">
            <Label>Optional thumbnail URL</Label>
            <Input value={draft.previewImage ?? ""} onChange={(e) => setDraft((d) => ({ ...d, previewImage: e.target.value || null }))} placeholder="Use a theme/artwork thumbnail if helpful" />
          </div>
          <div className="grid gap-1">
            <Label>Sort order</Label>
            <Input type="number" value={draft.sortOrder} onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) || 0 }))} />
          </div>
        </div>

        <div>
          <Button type="button" onClick={save} disabled={pending || !draft.title.trim() || !draft.text.trim()}>
            {draft.id ? <Save className="size-4" /> : <Plus className="size-4" />}
            {draft.id ? "Save content" : "Add to content library"}
          </Button>
        </div>
      </section>

      <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved content…" className="bg-white" />
        <select className="border-input h-10 rounded-md border bg-white px-3 text-sm" value={community} onChange={(e) => setCommunity(e.target.value)}>
          <option value="All">All communities</option>
          {COMMUNITY_CONTENT_GROUPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border border-violet-200/70 bg-white shadow-sm">
            {item.previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.previewImage} alt="" className="aspect-[16/7] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/5] place-items-center bg-violet-50 text-[#76508c]">
                <BookOpen className="size-7" />
              </div>
            )}
            <div className="grid gap-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#4b3659]">{item.title}</p>
                  <p className="mt-0.5 text-[9px] font-semibold text-[#927c9d]">
                    {item.community} · {sectionDisplayName(item.section)} · {item.role}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => edit(item)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" disabled={pending} onClick={() => remove(item.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="line-clamp-3 text-[10px] leading-relaxed text-[#6f5b79]">{item.text}</p>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-violet-200 bg-white px-6 py-12 text-center text-sm text-[#806b8c]">
          No matching saved content.
        </div>
      )}
    </div>
  );
}
