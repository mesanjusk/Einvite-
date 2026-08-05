"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import type { InvitationCopy } from "@/lib/ai/generate-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AiGeneratorForm() {
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [weddingDateDisplay, setWeddingDateDisplay] = useState("");
  const [venueName, setVenueName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvitationCopy | null>(null);

  async function handleGenerate() {
    if (!brideName || !groomName || !weddingDateDisplay) {
      toast.error("Fill in both names and the date first.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/ai/generate-copy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brideName, groomName, weddingDateDisplay, venueName }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Generation failed.");
      return;
    }
    setResult(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Bride&apos;s name</Label>
          <Input value={brideName} onChange={(e) => setBrideName(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Groom&apos;s name</Label>
          <Input value={groomName} onChange={(e) => setGroomName(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Wedding date</Label>
          <Input
            placeholder="12 December 2026"
            value={weddingDateDisplay}
            onChange={(e) => setWeddingDateDisplay(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Venue (optional)</Label>
          <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="w-fit">
        <Sparkles />
        {loading ? "Generating…" : "Generate copy"}
      </Button>

      {result && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                Result
              </span>
              <Badge variant={result.source === "template" ? "secondary" : "gold"}>
                {result.source === "template" ? "Template fallback" : `Generated · ${result.source}`}
              </Badge>
            </div>
            <Field label="Hero headline" value={result.heroHeadline} />
            <Field label="Hero subline" value={result.heroSubline} />
            <Field label="Invitation letter" value={result.invitationLetter} />
            <Field label="Story headline" value={result.storyHeadline} />
            <Field label="Hashtags" value={result.hashtags.map((h) => `#${h}`).join(" ")} />
            <Field label="SEO title" value={result.seoTitle} />
            <Field label="SEO description" value={result.seoDescription} />
          </CardContent>
        </Card>
      )}

      {result?.source === "template" && (
        <p className="text-muted-foreground text-xs">
          No AI provider key found (ANTHROPIC_API_KEY / OPENAI_API_KEY), so this is the
          deterministic template fallback, not model-generated text.
        </p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
