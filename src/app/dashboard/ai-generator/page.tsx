import type { Metadata } from "next";

import { AiGeneratorForm } from "@/components/dashboard/ai-generator-form";

export const metadata: Metadata = { title: "AI Generator" };

export default function AiGeneratorPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">AI Generator</h1>
      </div>

      <AiGeneratorForm />
    </div>
  );
}
