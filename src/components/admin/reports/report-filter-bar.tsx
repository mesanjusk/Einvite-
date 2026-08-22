"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";

import { GRANULARITIES, RANGE_PRESETS, RANGE_PRESET_LABELS } from "@/lib/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const GRANULARITY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/**
 * One filter bar for all six reports. It writes to the URL rather than to
 * state, so the tabs, the server render and the CSV export all read the same
 * filter and cannot drift apart — and a report worth showing someone is a
 * link, not a screenshot plus instructions.
 */
export function ReportFilterBar({
  exportReport,
  activePreset,
  activeGranularity,
  from,
  to,
}: {
  /** Which CSV the download button asks for: "items", "orders", … */
  exportReport: string;
  activePreset: string;
  activeGranularity: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  }

  function selectPreset(preset: string) {
    apply((params) => {
      params.set("preset", preset);
      // A preset and a custom range are two answers to the same question;
      // picking one has to clear the other or the custom dates keep winning.
      params.delete("from");
      params.delete("to");
    });
  }

  function selectGranularity(granularity: string) {
    apply((params) => params.set("granularity", granularity));
  }

  function setCustomDate(field: "from" | "to", value: string) {
    if (!value) return;
    apply((params) => {
      // Both ends have to be present for the range to count as custom, so
      // editing one carries the other across from whatever the preset had
      // resolved to. Otherwise typing a start date silently snaps the report
      // back to the default 30 days.
      params.set("from", field === "from" ? value : from);
      params.set("to", field === "to" ? value : to);
      params.delete("preset");
    });
  }

  const exportParams = new URLSearchParams(searchParams.toString());
  exportParams.set("report", exportReport);

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-full text-xs tracking-wide uppercase sm:w-auto">
          Period
        </span>
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => selectPreset(preset)}
            aria-pressed={activePreset === preset}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              activePreset === preset
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {RANGE_PRESET_LABELS[preset]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-end gap-2">
          <div className="grid gap-1">
            <Label htmlFor="report-from" className="text-muted-foreground text-xs">
              From
            </Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setCustomDate("from", event.target.value)}
              className="h-8 w-[9.5rem] text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="report-to" className="text-muted-foreground text-xs">
              To
            </Label>
            <Input
              id="report-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setCustomDate("to", event.target.value)}
              className="h-8 w-[9.5rem] text-xs"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <span className="text-muted-foreground text-xs">Group by</span>
          <div className="flex gap-1">
            {GRANULARITIES.map((granularity) => (
              <button
                key={granularity}
                type="button"
                onClick={() => selectGranularity(granularity)}
                aria-pressed={activeGranularity === granularity}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  activeGranularity === granularity
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {GRANULARITY_LABELS[granularity]}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pending && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
          <Button asChild variant="outline" size="sm">
            {/* A plain link, not a fetch: the browser's own download handling
                is what puts the file where the admin expects it. */}
            <a href={`/api/admin/reports/export?${exportParams.toString()}`} download>
              <Download className="size-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
