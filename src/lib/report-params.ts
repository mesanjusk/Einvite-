import {
  DEFAULT_PRESET,
  defaultGranularityFor,
  isGranularity,
  reportOffsetMinutes,
  resolveRange,
  type DateRange,
  type Granularity,
  type RangePreset,
} from "@/lib/reports";

/**
 * The filter every report page and the CSV export read out of the URL.
 *
 * Keeping it in the query string rather than in component state is what makes
 * a report shareable: an admin who spots something in "last month, weekly" can
 * paste the link to another admin and they see the same numbers. It also means
 * the export link is just the same params on a different path, so a download
 * can never disagree with the table it was taken from.
 */
export type ReportSearchParams = Record<string, string | string[] | undefined>;

export type ReportFilter = {
  range: DateRange;
  preset: RangePreset | "custom";
  granularity: Granularity;
  /** True when the granularity came from the range rather than the URL. */
  granularityIsDefault: boolean;
  offsetMinutes: number;
  /** The filter, back as a query string — for tab links and the export. */
  query: string;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseReportParams(
  params: ReportSearchParams,
  now: Date = new Date(),
): ReportFilter {
  const offsetMinutes = reportOffsetMinutes();
  const resolved = resolveRange(
    { preset: first(params.preset), from: first(params.from), to: first(params.to) },
    now,
    offsetMinutes,
  );

  const requested = first(params.granularity);
  // An unreadable default beats an unreadable URL: a year at daily resolution
  // is 365 rows, so a range picks its own granularity unless one was asked for.
  const granularityIsDefault = !isGranularity(requested);
  const granularity = isGranularity(requested)
    ? requested
    : defaultGranularityFor(resolved);

  const query = new URLSearchParams();
  if (resolved.preset === "custom") {
    query.set("from", first(params.from) ?? "");
    query.set("to", first(params.to) ?? "");
  } else if (resolved.preset !== DEFAULT_PRESET) {
    query.set("preset", resolved.preset);
  }
  if (!granularityIsDefault) query.set("granularity", granularity);

  return {
    range: resolved,
    preset: resolved.preset,
    granularity,
    granularityIsDefault,
    offsetMinutes,
    query: query.toString(),
  };
}

/** `/admin/reports/items?preset=90d&granularity=weekly` — a tab link. */
export function withReportQuery(path: string, filter: ReportFilter): string {
  return filter.query ? `${path}?${filter.query}` : path;
}
