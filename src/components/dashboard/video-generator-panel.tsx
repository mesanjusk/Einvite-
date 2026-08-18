"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Trash2 } from "lucide-react";

import {
  generateInvitationVideoAction,
  refreshInvitationVideoAction,
  deleteInvitationVideoAction,
} from "@/lib/actions/video";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type VideoTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  aspectRatio: string;
  durationSeconds: number;
};

type VideoJob = {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  videoUrl: string | null;
  error: string | null;
  createdAt: Date;
  videoTemplate: { name: string };
};

const STATUS_VARIANT: Record<VideoJob["status"], "secondary" | "gold" | "destructive" | "outline"> =
  {
    PENDING: "outline",
    PROCESSING: "gold",
    COMPLETED: "secondary",
    FAILED: "destructive",
  };

export function VideoGeneratorPanel({
  invitationId,
  templates,
  currentTemplateId,
  jobs,
}: {
  invitationId: string;
  templates: VideoTemplate[];
  currentTemplateId: string | null;
  jobs: VideoJob[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    currentTemplateId ?? templates[0]?.id ?? null,
  );
  const [isGenerating, startGenerate] = useTransition();
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const router = useRouter();

  function handleGenerate() {
    if (!selectedId) return;
    startGenerate(async () => {
      const result = await generateInvitationVideoAction({
        invitationId,
        videoTemplateId: selectedId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Video generation started.");
      router.refresh();
    });
  }

  function handleRefresh(jobId: string) {
    setPendingJobId(jobId);
    refreshInvitationVideoAction(jobId)
      .then((result) => {
        if (!result.success) toast.error(result.error);
        router.refresh();
      })
      .finally(() => setPendingJobId(null));
  }

  function handleDelete(jobId: string) {
    setPendingJobId(jobId);
    deleteInvitationVideoAction(jobId)
      .then((result) => {
        if (!result.success) toast.error(result.error);
        router.refresh();
      })
      .finally(() => setPendingJobId(null));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelectedId(template.id)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              selectedId === template.id ? "border-primary ring-primary/30 ring-2" : "",
            )}
          >
            <p className="text-sm font-medium">{template.name}</p>
            <p className="text-muted-foreground text-xs">
              {template.aspectRatio} · {template.durationSeconds}s
            </p>
            {template.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                {template.description}
              </p>
            )}
          </button>
        ))}
        {templates.length === 0 && (
          <p className="text-muted-foreground col-span-full py-6 text-center text-sm">
            No video templates available yet — an admin needs to add one.
          </p>
        )}
      </div>

      <Button onClick={handleGenerate} disabled={!selectedId || isGenerating} className="w-fit">
        {isGenerating ? "Starting…" : "Generate video"}
      </Button>

      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[job.status]}>{job.status}</Badge>
                <span className="text-sm font-medium">{job.videoTemplate.name}</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Started {job.createdAt.toLocaleString()}
              </p>
              {job.error && <p className="text-destructive mt-1 text-xs">{job.error}</p>}
              {job.videoUrl && (
                <a
                  href={job.videoUrl}
                  target="_blank"
                  className="text-primary mt-1 block text-xs underline"
                >
                  Open video
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              {job.status === "PROCESSING" && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pendingJobId === job.id}
                  onClick={() => handleRefresh(job.id)}
                  aria-label="Refresh status"
                >
                  <RefreshCw className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                disabled={pendingJobId === job.id}
                onClick={() => handleDelete(job.id)}
                aria-label="Delete job"
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No videos generated yet.
          </p>
        )}
      </div>
    </div>
  );
}
