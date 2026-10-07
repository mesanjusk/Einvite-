"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Image as ImageIcon, Plus, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";

import {
  deleteThemeLibraryAssetAction,
  upsertThemeLibraryAssetAction,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ThemeLibraryAssetRecord = {
  id: string;
  name: string;
  kind: "IMAGE" | "REVEAL_VIDEO";
  url: string;
  thumbnailUrl: string | null;
  category: string | null;
  community: string | null;
  sortOrder: number;
};

export function ThemeAssetLibraryManager({
  kind,
  initialAssets,
}: {
  kind: "IMAGE" | "REVEAL_VIDEO";
  initialAssets: ThemeLibraryAssetRecord[];
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return assets;
    return assets.filter((asset) =>
      [asset.name, asset.category ?? "", asset.community ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [assets, query]);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind === "IMAGE" ? "image" : "video");
      const response = await fetch("/api/admin/theme-assets/upload", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }
      setUrl(data.url);
      if (!name.trim()) {
        setName(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function save() {
    if (!url.trim()) {
      toast.error("Upload a file or enter its URL first.");
      return;
    }
    startTransition(async () => {
      const result = await upsertThemeLibraryAssetAction({
        name: name.trim() || (kind === "IMAGE" ? "Template artwork" : "Reveal video"),
        kind,
        url: url.trim(),
        category: category.trim() || undefined,
        sortOrder: assets.length,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(kind === "IMAGE" ? "Template added to library." : "Reveal video added to gallery.");
      window.location.reload();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteThemeLibraryAssetAction(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAssets((current) => current.filter((asset) => asset.id !== id));
      toast.success("Removed from library.");
    });
  }

  const isImage = kind === "IMAGE";

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-3xl border border-violet-200/70 bg-white p-4 shadow-sm">
        <div>
          <h2 className="font-display text-xl text-[#4b3659]">
            {isImage ? "Add template artwork" : "Add reveal video"}
          </h2>
          <p className="mt-1 text-xs text-[#806b8c]">
            Upload once, then reuse it from any theme section.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isImage ? "Floral ivory background" : "Petal reveal"} />
          </div>
          <div className="grid gap-1">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Wedding / floral / classic" />
          </div>
          <div className="grid gap-1">
            <Label>File URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Upload or paste URL" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={isImage ? "image/*" : "video/mp4,video/webm,video/*"}
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || pending}>
            <Upload className="size-4" />
            {uploading ? "Uploading…" : "Upload new"}
          </Button>
          <Button type="button" onClick={save} disabled={uploading || pending || !url.trim()}>
            <Plus className="size-4" />
            Add to library
          </Button>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isImage ? "Search template artwork…" : "Search reveal videos…"}
          className="max-w-md bg-white"
        />
        <span className="text-xs font-semibold text-[#806b8c]">{filtered.length} items</span>
      </div>

      <div className={isImage ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
        {filtered.map((asset) => (
          <article key={asset.id} className="group overflow-hidden rounded-2xl border border-violet-200/70 bg-white shadow-sm">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.thumbnailUrl || asset.url} alt={asset.name} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <video src={asset.url} className="aspect-video w-full bg-black object-cover" muted playsInline controls />
            )}
            <div className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#4b3659]">{asset.name}</p>
                <p className="truncate text-[9px] text-[#907b9a]">{asset.category || (isImage ? "Template" : "Reveal")}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 text-destructive" disabled={pending} onClick={() => remove(asset.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-violet-200 bg-white px-6 py-12 text-center text-sm text-[#806b8c]">
          {isImage ? <ImageIcon className="mx-auto mb-3 size-7" /> : <Video className="mx-auto mb-3 size-7" />}
          Nothing here yet.
        </div>
      )}
    </div>
  );
}
