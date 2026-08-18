"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import {
  videoTemplateFormSchema,
  VIDEO_ASPECT_RATIOS,
  type VideoTemplateFormInput,
  type VideoTemplateFormValues,
} from "@/lib/validations/admin";
import { upsertVideoTemplateAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type VideoTemplateRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  aspectRatio: string;
  durationSeconds: number;
  promptTemplate: string;
  styleKeywords: string[] | null;
  geminiModel: string;
  isPremium: boolean;
  sortOrder: number;
};

function defaultValues(template?: VideoTemplateRecord): VideoTemplateFormValues {
  return {
    id: template?.id,
    name: template?.name ?? "",
    slug: template?.slug ?? "",
    description: template?.description ?? "",
    aspectRatio: (template?.aspectRatio as VideoTemplateFormValues["aspectRatio"]) ?? "9:16",
    durationSeconds: template?.durationSeconds ?? 15,
    promptTemplate:
      template?.promptTemplate ??
      "A cinematic, romantic wedding invitation teaser for {{coupleNames}}, celebrating on {{weddingDate}}.",
    styleKeywords: template?.styleKeywords ?? [],
    geminiModel: template?.geminiModel ?? "veo-3.0-generate-001",
    isPremium: template?.isPremium ?? false,
    sortOrder: template?.sortOrder ?? 0,
  };
}

export function VideoTemplateFormDialog({ template }: { template?: VideoTemplateRecord }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState(
    (template?.styleKeywords ?? []).join(", "),
  );
  const router = useRouter();

  const form = useForm<VideoTemplateFormValues, unknown, VideoTemplateFormInput>({
    resolver: zodResolver(videoTemplateFormSchema),
    defaultValues: defaultValues(template),
  });

  async function onSubmit(values: VideoTemplateFormInput) {
    setLoading(true);
    const result = await upsertVideoTemplateAction({
      ...values,
      styleKeywords: keywordsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(template ? "Video template updated." : "Video template created.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {template ? (
          <IconButton label="Edit">
            <Pencil className="size-4" />
          </IconButton>
        ) : (
          <IconButton label="New video template" variant="default">
            <Plus className="size-4" />
          </IconButton>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? `Edit ${template.name}` : "New video template"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="grid gap-1.5">
              <Label>Slug</Label>
              <Input {...form.register("slug")} disabled={!!template} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} {...form.register("description")} />
          </div>

          <div className="grid gap-1.5">
            <Label>Prompt template</Label>
            <Textarea rows={4} {...form.register("promptTemplate")} />
            <p className="text-muted-foreground text-xs">
              {"{{brideName}} {{groomName}} {{coupleNames}} {{weddingDate}} {{venueName}} {{customMessage}} {{events}} {{style}}"}
            </p>
            {form.formState.errors.promptTemplate && (
              <p className="text-destructive text-xs">
                {form.formState.errors.promptTemplate.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Style keywords (comma separated)</Label>
            <Input
              placeholder="golden hour, slow motion, floral, traditional"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Aspect ratio</Label>
              <select
                className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
                value={form.watch("aspectRatio")}
                onChange={(e) =>
                  form.setValue("aspectRatio", e.target.value as VideoTemplateFormValues["aspectRatio"])
                }
              >
                {VIDEO_ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Duration (sec)</Label>
              <Input
                type="number"
                min={5}
                max={60}
                {...form.register("durationSeconds", { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Gemini model</Label>
              <Input {...form.register("geminiModel")} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Premium template</Label>
            <Switch
              checked={form.watch("isPremium")}
              onCheckedChange={(v) => form.setValue("isPremium", v)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : template ? "Save changes" : "Create video template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
