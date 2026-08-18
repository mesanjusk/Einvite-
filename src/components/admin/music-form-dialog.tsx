"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import {
  musicTrackFormSchema,
  type MusicTrackFormInput,
  type MusicTrackFormValues,
} from "@/lib/validations/admin";
import { upsertMusicTrackAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type MusicTrackRecord = {
  id: string;
  title: string;
  artist: string | null;
  url: string;
  mood: string | null;
  isPremium: boolean;
  isDefault?: boolean | null;
};

export function MusicFormDialog({ track }: { track?: MusicTrackRecord }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const form = useForm<MusicTrackFormValues, unknown, MusicTrackFormInput>({
    resolver: zodResolver(musicTrackFormSchema),
    defaultValues: {
      id: track?.id,
      title: track?.title ?? "",
      artist: track?.artist ?? "",
      url: track?.url ?? "",
      mood: track?.mood ?? "",
      isPremium: track?.isPremium ?? false,
      isDefault: track?.isDefault ?? false,
    },
  });

  async function onSubmit(values: MusicTrackFormInput) {
    setLoading(true);
    const result = await upsertMusicTrackAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(track ? "Track updated." : "Track added.");
    setOpen(false);
    router.refresh();
  }

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/music/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Upload failed.");
        return;
      }
      form.setValue("url", json.url);
      if (!form.getValues("title")) {
        form.setValue("title", file.name.replace(/\.[^.]+$/, ""));
      }
      toast.success("File uploaded — review the details below and save.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {track ? (
          <IconButton label="Edit">
            <Pencil className="size-4" />
          </IconButton>
        ) : (
          <IconButton label="New track" variant="default">
            <Plus className="size-4" />
          </IconButton>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{track ? "Edit track" : "New track"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Artist (optional)</Label>
            <Input {...form.register("artist")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Upload an audio file (optional)</Label>
            <Input
              type="file"
              accept="audio/*"
              disabled={uploading}
              onChange={(e) => onFileSelected(e.target.files?.[0])}
            />
            {uploading && <p className="text-muted-foreground text-xs">Uploading…</p>}
          </div>
          <div className="grid gap-1.5">
            <Label>File URL or path</Label>
            <Input placeholder="/music/romantic-instrumental.mp3" {...form.register("url")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Mood (optional)</Label>
            <Input placeholder="romantic, traditional, upbeat…" {...form.register("mood")} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Premium track</Label>
            <Switch
              checked={form.watch("isPremium")}
              onCheckedChange={(v) => form.setValue("isPremium", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Default track</Label>
              <p className="text-muted-foreground text-xs">
                Auto-added when a couple doesn&apos;t pick any music.
              </p>
            </div>
            <Switch
              checked={form.watch("isDefault")}
              onCheckedChange={(v) => form.setValue("isDefault", v)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : track ? "Save changes" : "Add track"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
