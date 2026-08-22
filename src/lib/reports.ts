/**
 * The arithmetic behind the admin reports.
 *
 * Everything here is a pure function over plain rows: no Prisma, no `Date.now()`
 * that a caller cannot override, no formatting that assumes a browser. The
 * queries live in `reports-data.ts` and the screens in `app/admin/reports` —
 * both hand their rows to these functions, which is what lets the six reports
 * (item, order, vendor, employee, profit, performance) share one definition of
 * "revenue", "cost" and "profit" instead of each page inventing its own.
 *
 * Money is integer minor units throughout — paise for INR, cents for USD.
 * Rupees as floats survive a demo and then quietly disagree with themselves
 * once a report sums a few thousand rows.
 */

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

export const GRANULARITIES = ["daily", "weekly", "monthly"] as const;
export type Granularity = (typeof GRANULARITIES)[number];

export function isGranularity(value: unknown): value is Granularity {
  return (
    typeof value === "string" && (GRANULARITIES as readonly string[]).includes(value)
  );
}

/**
 * Reports are read in one timezone — the studio's — and it is not the
 * server's. A Vercel box runs in UTC, so an order taken at 1am IST would land
 * in the previous day's column for everyone looking at it. Every bucket
 * boundary below is computed after shifting into this offset, and shifted
 * back before it is stored, so "Monday" means Monday where the business is.
 *
 * Minutes east of UTC. IST (+05:30) by default; override with
 * `REPORTS_UTC_OFFSET_MINUTES` for a studio somewhere else.
 */
export const DEFAULT_UTC_OFFSET_MINUTES = 330;

export function reportOffsetMinutes(
  raw: string | undefined = process.env.REPORTS_UTC_OFFSET_MINUTES,
): number {
  if (!raw) return DEFAULT_UTC_OFFSET_MINUTES;
  const parsed = Number(raw);
  // A malformed override silently switching every report to UTC would be a
  // very quiet way to be wrong, but so would crashing the page — fall back.
  if (!Number.isFinite(parsed) || Math.abs(parsed) > 16 * 60) {
    return DEFAULT_UTC_OFFSET_MINUTES;
  }
  return Math.trunc(parsed);
}

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** The instant, seen as a wall clock in the report timezone. */
function toLocal(date: Date, offsetMinutes: number): Date {
  return new Date(date.getTime() + offsetMinutes * MS_PER_MINUTE);
}

/** A wall clock in the report timezone, back to a real instant. */
function fromLocal(local: Date, offsetMinutes: number): Date {
  return new Date(local.getTime() - offsetMinutes * MS_PER_MINUTE);
}

/**
 * The first instant of the bucket `date` falls into. Weeks start on Monday,
 * which is how a working week is counted nearly everywhere this app is used.
 */
export function startOfPeriod(
  date: Date,
  granularity: Granularity,
  offsetMinutes = reportOffsetMinutes(),
): Date {
  const local = toLocal(date, offsetMinutes);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const day = local.getUTCDate();

  if (granularity === "monthly") {
    return fromLocal(new Date(Date.UTC(year, month, 1)), offsetMinutes);
  }

  const midnight = Date.UTC(year, month, day);
  if (granularity === "daily") return fromLocal(new Date(midnight), offsetMinutes);

  // Monday-first: getUTCDay() is 0 for Sunday, which is 6 days into the week.
  const weekday = new Date(midnight).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  return fromLocal(new Date(midnight - daysSinceMonday * MS_PER_DAY), offsetMinutes);
}

/** The first instant of the bucket after the one `date` falls into. */
export function endOfPeriod(
  date: Date,
  granularity: Granularity,
  offsetMinutes = reportOffsetMinutes(),
): Date {
  const start = startOfPeriod(date, granularity, offsetMinutes);
  if (granularity === "monthly") {
    const local = toLocal(start, offsetMinutes);
    return fromLocal(
      new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1)),
      offsetMinutes,
    );
  }
  return new Date(start.getTime() + (granularity === "weekly" ? 7 : 1) * MS_PER_DAY);
}

/**
 * Sortable, stable key for a bucket: `2026-08-22`, `2026-W34`, `2026-08`.
 * Used as a map key and as the CSV's period column, so it must not depend on
 * the reader's locale.
 */
export function periodKey(
  date: Date,
  granularity: Granularity,
  offsetMinutes = reportOffsetMinutes(),
): string {
  const local = toLocal(startOfPeriod(date, granularity, offsetMinutes), offsetMinutes);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");

  if (granularity === "monthly") return `${year}-${month}`;
  if (granularity === "daily") return `${year}-${month}-${day}`;
  return isoWeekKey(local);
}

/**
 * ISO-8601 week key. The year in `2026-W01` is the *week's* year, which is
 * not always the date's: 1 January 2027 falls in week 53 of 2026, and a
 * report that labelled it `2027-W53` would sort a December row after the
 * following December.
 */
function isoWeekKey(localMonday: Date): string {
  // The Thursday of the same week decides which year the week belongs to.
  const thursday = new Date(localMonday.getTime() + 3 * MS_PER_DAY);
  const year = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstMonday = new Date(
    firstThursday.getTime() - ((firstThursday.getUTCDay() + 6) % 7) * MS_PER_DAY,
  );
  const week =
    Math.round((localMonday.getTime() - firstMonday.getTime()) / (7 * MS_PER_DAY)) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** What the column header says: `22 Aug 2026`, `Week of 17 Aug`, `Aug 2026`. */
export function periodLabel(
  start: Date,
  granularity: Granularity,
  offsetMinutes = reportOffsetMinutes(),
): string {
  const local = toLocal(start, offsetMinutes);
  const day = local.getUTCDate();
  const month = MONTHS[local.getUTCMonth()];
  const year = local.getUTCFullYear();

  if (granularity === "monthly") return `${month} ${year}`;
  if (granularity === "daily") return `${day} ${month} ${year}`;
  return `Week of ${day} ${month} ${year}`;
}

/**
 * Every bucket start from `from` to `to`, inclusive of the bucket `to` falls
 * in. Reports iterate this rather than the rows, so a day with no orders
 * prints a zero instead of vanishing — a gap in a trend line reads as "we
 * lost the data", a zero reads as "we sold nothing".
 */
export function periodStarts(
  from: Date,
  to: Date,
  granularity: Granularity,
  offsetMinutes = reportOffsetMinutes(),
): Date[] {
  if (to.getTime() < from.getTime()) return [];

  const starts: Date[] = [];
  let cursor = startOfPeriod(from, granularity, offsetMinutes);
  const last = startOfPeriod(to, granularity, offsetMinutes).getTime();

  // A year of days is 365 rows; a decade of them is still only 3,650. The cap
  // is here so a hand-typed `from=1970-01-01` cannot allocate forever.
  const MAX_BUCKETS = 4000;
  while (cursor.getTime() <= last && starts.length < MAX_BUCKETS) {
    starts.push(cursor);
    cursor = endOfPeriod(cursor, granularity, offsetMinutes);
  }
  return starts;
}

// ---------------------------------------------------------------------------
// Date ranges
// ---------------------------------------------------------------------------

export const RANGE_PRESETS = [
  "today",
  "7d",
  "30d",
  "90d",
  "this-month",
  "last-month",
  "12m",
  "all",
] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "this-month": "This month",
  "last-month": "Last month",
  "12m": "Last 12 months",
  all: "All time",
};

export const DEFAULT_PRESET: RangePreset = "30d";

/** `from` is inclusive, `to` is exclusive — the half-open form every query wants. */
export type DateRange = { from: Date; to: Date; label: string };

function parseDateInput(raw: string | undefined, offsetMinutes: number): Date | null {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const local = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const date = fromLocal(new Date(local), offsetMinutes);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * `2026-08-22` in the report timezone, as the instant that day begins. Null
 * for anything that is not a plain date, so a caller can tell "not supplied"
 * from "midnight".
 */
export function fromDateInputValue(
  raw: string | undefined,
  offsetMinutes = reportOffsetMinutes(),
): Date | null {
  return parseDateInput(raw, offsetMinutes);
}

/** `2026-08-22`, in the report timezone — the shape `<input type="date">` wants. */
export function toDateInputValue(
  date: Date,
  offsetMinutes = reportOffsetMinutes(),
): string {
  const local = toLocal(date, offsetMinutes);
  return [
    local.getUTCFullYear(),
    String(local.getUTCMonth() + 1).padStart(2, "0"),
    String(local.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * The range a set of search params asks for.
 *
 * An explicit `from`/`to` pair wins over the preset, so a bookmarked custom
 * range survives a reload. Anything unparseable falls back to the default
 * rather than erroring: a report that refuses to render because someone
 * fat-fingered a URL is not a useful report.
 */
export function resolveRange(
  params: { preset?: string; from?: string; to?: string },
  now: Date = new Date(),
  offsetMinutes = reportOffsetMinutes(),
): DateRange & { preset: RangePreset | "custom" } {
  const customFrom = parseDateInput(params.from, offsetMinutes);
  const customTo = parseDateInput(params.to, offsetMinutes);

  if (customFrom && customTo) {
    // Both ends are inclusive dates as typed; `to` becomes exclusive by
    // moving to the following midnight, so "22nd to 22nd" is a whole day.
    const from = customFrom <= customTo ? customFrom : customTo;
    const toInclusive = customFrom <= customTo ? customTo : customFrom;
    const to = new Date(toInclusive.getTime() + MS_PER_DAY);
    return {
      from,
      to,
      preset: "custom",
      label: `${toDateInputValue(from, offsetMinutes)} → ${toDateInputValue(toInclusive, offsetMinutes)}`,
    };
  }

  const preset: RangePreset = (RANGE_PRESETS as readonly string[]).includes(
    params.preset ?? "",
  )
    ? (params.preset as RangePreset)
    : DEFAULT_PRESET;

  const tomorrow = endOfPeriod(now, "daily", offsetMinutes);
  const days = (count: number) => new Date(tomorrow.getTime() - count * MS_PER_DAY);
  const label = RANGE_PRESET_LABELS[preset];

  switch (preset) {
    case "today":
      return {
        from: startOfPeriod(now, "daily", offsetMinutes),
        to: tomorrow,
        preset,
        label,
      };
    case "7d":
      return { from: days(7), to: tomorrow, preset, label };
    case "90d":
      return { from: days(90), to: tomorrow, preset, label };
    case "this-month":
      return {
        from: startOfPeriod(now, "monthly", offsetMinutes),
        to: tomorrow,
        preset,
        label,
      };
    case "last-month": {
      const to = startOfPeriod(now, "monthly", offsetMinutes);
      const from = startOfPeriod(new Date(to.getTime() - 1), "monthly", offsetMinutes);
      return { from, to, preset, label };
    }
    case "12m": {
      const thisMonth = toLocal(
        startOfPeriod(now, "monthly", offsetMinutes),
        offsetMinutes,
      );
      const from = fromLocal(
        new Date(Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth() - 11, 1)),
        offsetMinutes,
      );
      return { from, to: tomorrow, preset, label };
    }
    case "all":
      // Before this app existed, and so before any row it could hold.
      return { from: new Date(0), to: tomorrow, preset, label };
    case "30d":
    default:
      return {
        from: days(30),
        to: tomorrow,
        preset,
        label: RANGE_PRESET_LABELS["30d"],
      };
  }
}

/**
 * The granularity a range can actually be read at. Twelve months of daily
 * columns is 365 unreadable rows, so a range wider than about three months
 * defaults to monthly unless the admin asked for something else.
 */
export function defaultGranularityFor(range: { from: Date; to: Date }): Granularity {
  const spanDays = (range.to.getTime() - range.from.getTime()) / MS_PER_DAY;
  if (spanDays <= 14) return "daily";
  if (spanDays <= 92) return "weekly";
  return "monthly";
}

// ---------------------------------------------------------------------------
// Order lines
// ---------------------------------------------------------------------------

/**
 * One priced line, flattened out of the database rows. The report functions
 * take this rather than a Prisma type so they can be tested with object
 * literals and reused if the storage ever changes.
 */
export type ReportLine = {
  id: string;
  occurredAt: Date;
  orderId: string;
  orderRef: string;
  orderStatus: string;
  itemKey: string;
  itemName: string;
  kind: string;
  quantity: number;
  /** Per unit, minor units. */
  unitPrice: number;
  /** Per unit, minor units. */
  unitCost: number;
  currency: string;
  vendorId: string | null;
  vendorName: string | null;
  employeeId: string | null;
  employeeName: string | null;
};

export type Totals = {
  revenue: number;
  cost: number;
  profit: number;
  /** Profit as a share of revenue, 0–1. Null when nothing was sold. */
  margin: number | null;
  quantity: number;
  lines: number;
  orders: number;
};

export const EMPTY_TOTALS: Totals = {
  revenue: 0,
  cost: 0,
  profit: 0,
  margin: null,
  quantity: 0,
  lines: 0,
  orders: 0,
};

export function lineRevenue(line: ReportLine): number {
  return line.quantity * line.unitPrice;
}

export function lineCost(line: ReportLine): number {
  return line.quantity * line.unitCost;
}

export function lineProfit(line: ReportLine): number {
  return lineRevenue(line) - lineCost(line);
}

export function summarize(lines: readonly ReportLine[]): Totals {
  let revenue = 0;
  let cost = 0;
  let quantity = 0;
  const orders = new Set<string>();

  for (const line of lines) {
    revenue += lineRevenue(line);
    cost += lineCost(line);
    quantity += line.quantity;
    orders.add(line.orderId);
  }

  const profit = revenue - cost;
  return {
    revenue,
    cost,
    profit,
    // A margin on zero revenue is not 0%, it is undefined — printing "0%"
    // next to a period that sold nothing invites the wrong conclusion.
    margin: revenue === 0 ? null : profit / revenue,
    quantity,
    lines: lines.length,
    orders: orders.size,
  };
}

/** A totalled row of any of the "…wise" reports. */
export type GroupRow = Totals & {
  key: string;
  label: string;
  /** Whatever the report wants under the label — a status, a category, a date. */
  detail?: string;
  /** Share of the report's total revenue, 0–1. */
  revenueShare: number;
};

type GroupOptions = {
  key: (line: ReportLine) => string;
  label: (line: ReportLine) => string;
  detail?: (line: ReportLine) => string | undefined;
  sortBy?: "revenue" | "profit" | "quantity" | "label";
};

/**
 * The one grouping routine every "…wise" report runs through. Insertion order
 * is not relied on for the result — rows come back sorted by the chosen
 * measure, descending, with the label as the tie-break so two rows that earned
 * the same amount do not swap places between two loads of the same page.
 */
export function groupLines(
  lines: readonly ReportLine[],
  { key, label, detail, sortBy = "revenue" }: GroupOptions,
): GroupRow[] {
  const buckets = new Map<
    string,
    { label: string; detail?: string; lines: ReportLine[] }
  >();

  for (const line of lines) {
    const bucketKey = key(line);
    const bucket = buckets.get(bucketKey);
    if (bucket) {
      bucket.lines.push(line);
    } else {
      buckets.set(bucketKey, {
        label: label(line),
        detail: detail?.(line),
        lines: [line],
      });
    }
  }

  const total = summarize(lines).revenue;
  const rows: GroupRow[] = [];
  for (const [bucketKey, bucket] of buckets) {
    const totals = summarize(bucket.lines);
    rows.push({
      ...totals,
      key: bucketKey,
      label: bucket.label,
      detail: bucket.detail,
      revenueShare: total === 0 ? 0 : totals.revenue / total,
    });
  }

  rows.sort((a, b) => {
    if (sortBy === "label") return a.label.localeCompare(b.label);
    const diff = b[sortBy] - a[sortBy];
    return diff !== 0 ? diff : a.label.localeCompare(b.label);
  });
  return rows;
}

export type PeriodRow = Totals & { key: string; label: string; start: Date; end: Date };

/**
 * The daily / weekly / monthly series. Buckets with no lines are kept at
 * zero — see `periodStarts` for why.
 */
export function groupByPeriod(
  lines: readonly ReportLine[],
  range: { from: Date; to: Date },
  granularity: Granularity,
  offsetMinutes = reportOffsetMinutes(),
): PeriodRow[] {
  const byKey = new Map<string, ReportLine[]>();
  for (const line of lines) {
    const key = periodKey(line.occurredAt, granularity, offsetMinutes);
    const existing = byKey.get(key);
    if (existing) existing.push(line);
    else byKey.set(key, [line]);
  }

  // `to` is exclusive, so the last bucket is the one the instant before it
  // falls in — otherwise a range ending at a month boundary grows a phantom
  // empty month on the end.
  const lastInstant = new Date(Math.max(range.from.getTime(), range.to.getTime() - 1));

  return periodStarts(range.from, lastInstant, granularity, offsetMinutes).map(
    (start) => {
      const key = periodKey(start, granularity, offsetMinutes);
      return {
        ...summarize(byKey.get(key) ?? []),
        key,
        label: periodLabel(start, granularity, offsetMinutes),
        start,
        end: endOfPeriod(start, granularity, offsetMinutes),
      };
    },
  );
}

// The five report dimensions, each expressed as a grouping of the same lines.
// "Unassigned" is a real bucket rather than a dropped row: work with no vendor
// or no owner is exactly what an admin opens these reports to find.

export function itemWise(lines: readonly ReportLine[]): GroupRow[] {
  return groupLines(lines, {
    key: (line) => `${line.kind}:${line.itemKey}`,
    label: (line) => line.itemName,
    detail: (line) => line.kind,
  });
}

export function orderWise(lines: readonly ReportLine[]): GroupRow[] {
  return groupLines(lines, {
    key: (line) => line.orderId,
    label: (line) => line.orderRef,
    detail: (line) => line.orderStatus,
  });
}

export function vendorWise(lines: readonly ReportLine[]): GroupRow[] {
  return groupLines(lines, {
    key: (line) => line.vendorId ?? "unassigned",
    label: (line) => line.vendorName ?? "No vendor",
    // Sorted by revenue like the rest: the vendor table's own columns put
    // cost and margin next to it, so one ordering serves every reading.
  });
}

export function employeeWise(lines: readonly ReportLine[]): GroupRow[] {
  return groupLines(lines, {
    key: (line) => line.employeeId ?? "unassigned",
    label: (line) => line.employeeName ?? "Unassigned",
  });
}

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

/** Counts the performance report bins by period, from rows that carry a date. */
export type DatedCount = { at: Date; count?: number };

export type PerformanceRow = {
  key: string;
  label: string;
  start: Date;
  created: number;
  published: number;
  views: number;
  guests: number;
  rsvps: number;
  revenue: number;
  profit: number;
  /** Published as a share of created in the same bucket, 0–1, null when none. */
  publishRate: number | null;
  /** RSVPs as a share of views, 0–1, null when nothing was viewed. */
  rsvpRate: number | null;
};

function countByPeriod(
  rows: readonly DatedCount[],
  granularity: Granularity,
  offsetMinutes: number,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = periodKey(row.at, granularity, offsetMinutes);
    counts.set(key, (counts.get(key) ?? 0) + (row.count ?? 1));
  }
  return counts;
}

/**
 * How the business performed per period, as opposed to what it earned.
 * Revenue rides along so a period can be read as "we published nine and made
 * this much" in one row rather than by holding two tables side by side.
 */
export function performanceByPeriod(
  input: {
    lines: readonly ReportLine[];
    created: readonly DatedCount[];
    published: readonly DatedCount[];
    views: readonly DatedCount[];
    guests: readonly DatedCount[];
    rsvps: readonly DatedCount[];
  },
  range: { from: Date; to: Date },
  granularity: Granularity,
  offsetMinutes = reportOffsetMinutes(),
): PerformanceRow[] {
  const created = countByPeriod(input.created, granularity, offsetMinutes);
  const published = countByPeriod(input.published, granularity, offsetMinutes);
  const views = countByPeriod(input.views, granularity, offsetMinutes);
  const guests = countByPeriod(input.guests, granularity, offsetMinutes);
  const rsvps = countByPeriod(input.rsvps, granularity, offsetMinutes);

  return groupByPeriod(input.lines, range, granularity, offsetMinutes).map((period) => {
    const createdCount = created.get(period.key) ?? 0;
    const publishedCount = published.get(period.key) ?? 0;
    const viewCount = views.get(period.key) ?? 0;
    const rsvpCount = rsvps.get(period.key) ?? 0;

    return {
      key: period.key,
      label: period.label,
      start: period.start,
      created: createdCount,
      published: publishedCount,
      views: viewCount,
      guests: guests.get(period.key) ?? 0,
      rsvps: rsvpCount,
      revenue: period.revenue,
      profit: period.profit,
      publishRate: createdCount === 0 ? null : publishedCount / createdCount,
      rsvpRate: viewCount === 0 ? null : rsvpCount / viewCount,
    };
  });
}

// ---------------------------------------------------------------------------
// Formatting and export
// ---------------------------------------------------------------------------

/**
 * Minor units to a readable amount. Rendered on the server so the number is
 * the same for every admin looking at it, rather than following whichever
 * locale a browser happens to report.
 */
export function formatMoney(minorUnits: number, currency = "INR"): string {
  const major = minorUnits / 100;
  const formatter = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
  });
  return formatter.format(major);
}

export function formatPercent(share: number | null, fractionDigits = 1): string {
  if (share === null || !Number.isFinite(share)) return "—";
  return `${(share * 100).toFixed(fractionDigits)}%`;
}

/**
 * RFC 4180 CSV. Quoting is not optional here: an item called
 * `Rose, gold foil` or a note with a newline in it would otherwise tear a row
 * in half the moment someone opens the file in Excel.
 */
export function toCsv(
  headers: readonly string[],
  rows: readonly (string | number)[][],
): string {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

/** Minor units as a bare decimal, for the CSV — spreadsheets want a number. */
export function csvMoney(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}
