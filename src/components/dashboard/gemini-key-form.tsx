"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, KeyRound } from "lucide-react";

import { updateInvitationGeminiKeyAction } from "@/lib/actions/video";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AI_STUDIO_CREATE_KEY_URL = "https://aistudio.google.com/apikey";

export function GeminiKeyForm({
  invitationId,
  hasKey,
}: {
  invitationId: string;
  hasKey: boolean;
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    if (!value.trim()) return;
    startTransition(async () => {
      const result = await updateInvitationGeminiKeyAction({
        invitationId,
        geminiApiKey: value.trim(),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Your Gemini API key was saved.");
      setValue("");
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await updateInvitationGeminiKeyAction({ invitationId, geminiApiKey: null });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Removed — video generation will use the shared key again, if any.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <KeyRound className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="text-muted-foreground text-sm">
          <p>
            By default, video generation uses this platform&apos;s shared Gemini key. Add your
            own free Gemini API key here to use your own quota instead — useful if you want more
            generations than the shared key allows.
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>
              Open{" "}
              <a
                href={AI_STUDIO_CREATE_KEY_URL}
                target="_blank"
                rel="noreferrer"
                className="text-primary inline-flex items-center gap-1 underline"
              >
                Google AI Studio — Create API key
                <ExternalLink className="size-3" />
              </a>
            </li>
            <li>Sign in with your Google account and click &quot;Create API key&quot;.</li>
            <li>Copy the key and paste it below, then save.</li>
          </ol>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label className="sr-only">Gemini API key</Label>
        <Input
          type="password"
          autoComplete="off"
          placeholder={hasKey ? "•••••••••••••••••••• (key saved — enter a new one to replace it)" : "AIza…"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button onClick={handleSave} disabled={isPending || !value.trim()}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {hasKey && (
          <Button variant="ghost" onClick={handleRemove} disabled={isPending}>
            Remove
          </Button>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        {hasKey
          ? "Using your own Gemini API key for this invitation."
          : "Using the platform's shared Gemini key (if configured)."}
      </p>
    </div>
  );
}
