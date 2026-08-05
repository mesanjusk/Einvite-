import type { Metadata } from "next";

import { AiGeneratorForm } from "@/components/dashboard/ai-generator-form";

export const metadata: Metadata = { title: "AI Generator" };

export default function AiGeneratorPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">AI Generator</h1>
        <p className="text-muted-foreground text-sm">
          Generate invitation copy — headline, invitation letter, hashtags, and SEO
          text — from just your names and date. This is the same generator the wizard
          uses; try it here, then paste results in when creating an invitation.
        </p>
      </div>

      <AiGeneratorForm />
    </div>
  );
}
