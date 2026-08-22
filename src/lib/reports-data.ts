import { db } from "@/lib/db";
import {
  reportOffsetMinutes,
  type DateRange,
  type DatedCount,
  type Granularity,
  type ReportLine,
} from "@/lib/reports";

/**
 * Every database read the admin reports make.
 *
 * The aggregation happens in `reports.ts`, in memory, rather than in Mongo.
 * That is a deliberate trade: a `$group` pipeline per dimension would be five
 * pipelines that each define "profit" separately, and Prisma's Mongo
 * `groupBy` cannot multiply two fields together anyway — revenue is
 * `quantity × unitPrice`, which no `_sum` can express. Pulling the range's
 * lines and folding them once keeps one definition of the arithmetic, tested
 * without a database. A studio's order lines are counted in thousands per
 * year, so the volume is not the constraint; `MAX_LINES` is the backstop for
 * the day that stops being true.
 */
const MAX_LINES = 20_000;

/** How many rows the count queries will pull before they stop being exact. */
const MAX_EVENT_ROWS = 50_000;

export type ReportLinesResult = {
  lines: ReportLine[];
  /** True when the range holds more lines than were read — totals understate. */
  truncated: boolean;
};

function orderRef(invitation: {
  brideName: string;
  groomName: string | null;
  slug: string;
}): string {
  const names = [invitation.brideName, invitation.groomName]
    .filter(Boolean)
    .join(" & ");
  return names.trim() || invitation.slug;
}

export async function loadReportLines(range: DateRange): Promise<ReportLinesResult> {
  const rows = await db.orderItem.findMany({
    where: { occurredAt: { gte: range.from, lt: range.to } },
    orderBy: { occurredAt: "desc" },
    take: MAX_LINES + 1,
    include: {
      invitation: {
        select: {
          id: true,
          slug: true,
          brideName: true,
          groomName: true,
          status: true,
        },
      },
      vendor: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } },
    },
  });

  const truncated = rows.length > MAX_LINES;
  const lines = (truncated ? rows.slice(0, MAX_LINES) : rows).map<ReportLine>(
    (row) => ({
      id: row.id,
      occurredAt: row.occurredAt,
      orderId: row.invitationId,
      orderRef: orderRef(row.invitation),
      orderStatus: row.invitation.status,
      itemKey: row.itemKey,
      itemName: row.itemName,
      kind: row.kind,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      unitCost: row.unitCost,
      currency: row.currency,
      vendorId: row.vendorId,
      vendorName: row.vendor?.name ?? null,
      employeeId: row.employeeId,
      employeeName: row.employee?.name ?? null,
    }),
  );

  return { lines, truncated };
}

/** The currency the money columns are labelled with. */
export function dominantCurrency(lines: readonly ReportLine[]): string {
  const counts = new Map<string, number>();
  for (const line of lines)
    counts.set(line.currency, (counts.get(line.currency) ?? 0) + 1);
  let best = "INR";
  let bestCount = 0;
  for (const [currency, count] of counts) {
    if (count > bestCount) {
      best = currency;
      bestCount = count;
    }
  }
  return best;
}

export type PerformanceInput = {
  created: DatedCount[];
  published: DatedCount[];
  views: DatedCount[];
  guests: DatedCount[];
  rsvps: DatedCount[];
};

/**
 * The non-money half of the performance report. Each query returns only the
 * one date column it is counted by — a period bucket needs nothing else, and
 * pulling whole invitations to count them would be the expensive way to get
 * the same integer.
 */
export async function loadPerformanceInput(
  range: DateRange,
): Promise<PerformanceInput> {
  const window = { gte: range.from, lt: range.to };

  const [created, published, views, guests, rsvps] = await Promise.all([
    db.invitation.findMany({
      where: { createdAt: window },
      select: { createdAt: true },
      take: MAX_EVENT_ROWS,
    }),
    db.invitation.findMany({
      where: { publishedAt: window },
      select: { publishedAt: true },
      take: MAX_EVENT_ROWS,
    }),
    db.analyticsEvent.findMany({
      where: { type: "VIEW", createdAt: window },
      select: { createdAt: true },
      take: MAX_EVENT_ROWS,
    }),
    db.guest.findMany({
      where: { createdAt: window },
      select: { createdAt: true },
      take: MAX_EVENT_ROWS,
    }),
    db.rsvp.findMany({
      where: { createdAt: window },
      select: { createdAt: true, guestCount: true },
      take: MAX_EVENT_ROWS,
    }),
  ]);

  return {
    created: created.map((row) => ({ at: row.createdAt })),
    // `publishedAt` is only null outside the filtered window, but the type
    // does not know that.
    published: published.flatMap((row) =>
      row.publishedAt ? [{ at: row.publishedAt }] : [],
    ),
    views: views.map((row) => ({ at: row.createdAt })),
    guests: guests.map((row) => ({ at: row.createdAt })),
    // An RSVP for a family of four is four people coming, which is the number
    // a studio plans around.
    rsvps: rsvps.map((row) => ({ at: row.createdAt, count: row.guestCount })),
  };
}

export type VendorOption = { id: string; name: string };

export async function loadVendorOptions(): Promise<VendorOption[]> {
  return db.vendor.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function loadEmployeeOptions(): Promise<VendorOption[]> {
  return db.employee.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * The catalogue an order line can point at, so recording "they bought Royal
 * Gold" is a pick rather than a retyped slug. Free-text items stay possible —
 * see the `OTHER`/`PRINT`/`SERVICE` kinds — because plenty of what a studio
 * sells has no catalogue row.
 */
export type CatalogOption = { kind: string; itemKey: string; itemName: string };

export async function loadCatalogOptions(): Promise<CatalogOption[]> {
  const [themes, videoTemplates, music] = await Promise.all([
    db.theme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
    db.videoTemplate.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.musicTrack.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return [
    ...themes.map((theme) => ({
      kind: theme.type === "PDF" ? "PDF_THEME" : "THEME",
      itemKey: theme.id,
      itemName: theme.name,
    })),
    ...videoTemplates.map((template) => ({
      kind: "VIDEO_TEMPLATE",
      itemKey: template.id,
      itemName: template.name,
    })),
    ...music.map((track) => ({
      kind: "MUSIC",
      itemKey: track.id,
      itemName: track.title,
    })),
  ];
}

/** Invitations an order line can be attached to, newest first. */
export async function loadOrderOptions(limit = 200) {
  const invitations = await db.invitation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, slug: true, brideName: true, groomName: true, status: true },
  });
  return invitations.map((invitation) => ({
    id: invitation.id,
    label: orderRef(invitation),
    status: invitation.status,
  }));
}

/** The lines already recorded against one order, for the invitation screen. */
export async function loadOrderLines(invitationId: string) {
  return db.orderItem.findMany({
    where: { invitationId },
    orderBy: { occurredAt: "desc" },
    include: {
      vendor: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });
}

/** The offset every report page and export must agree on. */
export function reportTimezoneOffset(): number {
  return reportOffsetMinutes();
}

export type { Granularity };
