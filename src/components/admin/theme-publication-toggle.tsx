"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { setThemePublicationAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function ThemePublicationToggle({
  themeId,
  isPublished,
  type,
}: {
  themeId: string;
  isPublished: boolean;
  type: "WEBSITE" | "PDF";
}) {
  const [published, setPublished] = useState(isPublished);
  const [pending, startTransition] = useTransition();
  const canPublish = type === "WEBSITE";

  function togglePublication() {
    if (!canPublish || pending) return;
    startTransition(async () => {
      const result = await setThemePublicationAction(themeId, !published);
      if (!result.success) {
        toast.error(result.error ?? "Could not update theme visibility");
        return;
      }
      setPublished(!published);
      toast.success(!published ? "Theme is now public" : "Theme is now private");
    });
  }

  return (
    <Button
      type="button"
      variant={published ? "secondary" : "outline"}
      size="sm"
      className="h-8 shrink-0 gap-1.5 rounded-full"
      aria-pressed={published}
      aria-label={canPublish ? (published ? "Make theme private" : "Publish theme") : "PDF-only theme"}
      disabled={!canPublish || pending}
      onClick={togglePublication}
    >
      {pending ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : published ? (
        <Eye className="size-3.5" />
      ) : (
        <EyeOff className="size-3.5" />
      )}
      {published ? "Public" : canPublish ? "Private" : "PDF only"}
    </Button>
  );
}
