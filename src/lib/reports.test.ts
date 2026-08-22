import { describe, expect, it } from "vitest";

import {
  DEFAULT_UTC_OFFSET_MINUTES,
  defaultGranularityFor,
  employeeWise,
  endOfPeriod,
  formatPercent,
  groupByPeriod,
  itemWise,
  orderWise,
  performanceByPeriod,
  periodKey,
  periodLabel,
  periodStarts,
  reportOffsetMinutes,
  resolveRange,
  startOfPeriod,
  summarize,
  toCsv,
  toDateInputValue,
  vendorWise,
  type ReportLine,
} from "./reports";

const IST = DEFAULT_UTC_OFFSET_MINUTES;

/** A line with sane defaults, so each test only states what it is about. */
function line(overrides: Partial<ReportLine> = {}): ReportLine {
  return {
    id: "l1",
    occurredAt: new Date("2026-08-22T06:00:00Z"),
    orderId: "o1",
    orderRef: "Asha & Vikram",
    orderStatus: "PUBLISHED",
    itemKey: "royal-gold",
    itemName: "Royal Gold",
    kind: "THEME",
    quantity: 1,
    unitPrice: 250_00,
    unitCost: 100_00,
    currency: "INR",
    vendorId: "v1",
    vendorName: "Sharma Press",
    employeeId: "e1",
    employeeName: "Priya",
    ...overrides,
  };
}

describe("period bucketing", () => {
  it("buckets by the studio's day, not the server's", () => {
    // 20:00 UTC on the 21st is 01:30 IST on the 22nd — the same order must
    // not land in two different days depending on where it is read.
    const lateNight = new Date("2026-08-21T20:00:00Z");
    expect(periodKey(lateNight, "daily", IST)).toBe("2026-08-22");
    expect(periodKey(lateNight, "daily", 0)).toBe("2026-08-21");
  });

  it("starts weeks on Monday", () => {
    // 2026-08-22 is a Saturday; its week began on Monday the 17th.
    const saturday = new Date("2026-08-22T06:00:00Z");
    expect(toDateInputValue(startOfPeriod(saturday, "weekly", IST), IST)).toBe(
      "2026-08-17",
    );

    // A Sunday belongs to the week that started six days earlier, not the
    // one starting the next day.
    const sunday = new Date("2026-08-23T06:00:00Z");
    expect(toDateInputValue(startOfPeriod(sunday, "weekly", IST), IST)).toBe(
      "2026-08-17",
    );
  });

  it("labels an ISO week by the year the week belongs to", () => {
    // 1 Jan 2027 is a Friday, so it sits in the last week of 2026.
    expect(periodKey(new Date("2027-01-01T06:00:00Z"), "weekly", IST)).toBe("2026-W53");
    // 4 Jan 2027 opens week 1 of 2027.
    expect(periodKey(new Date("2027-01-04T06:00:00Z"), "weekly", IST)).toBe("2027-W01");
  });

  it("rolls a month end over to the next month", () => {
    const start = startOfPeriod(new Date("2026-12-20T06:00:00Z"), "monthly", IST);
    expect(toDateInputValue(start, IST)).toBe("2026-12-01");
    expect(toDateInputValue(endOfPeriod(start, "monthly", IST), IST)).toBe(
      "2027-01-01",
    );
  });

  it("handles February in a leap year", () => {
    const starts = periodStarts(
      new Date("2028-02-27T06:00:00Z"),
      new Date("2028-03-01T06:00:00Z"),
      "daily",
      IST,
    );
    expect(starts.map((s) => toDateInputValue(s, IST))).toEqual([
      "2028-02-27",
      "2028-02-28",
      "2028-02-29",
      "2028-03-01",
    ]);
  });

  it("prints a readable label per granularity", () => {
    const day = startOfPeriod(new Date("2026-08-22T06:00:00Z"), "daily", IST);
    expect(periodLabel(day, "daily", IST)).toBe("22 Aug 2026");
    expect(periodLabel(startOfPeriod(day, "weekly", IST), "weekly", IST)).toBe(
      "Week of 17 Aug 2026",
    );
    expect(periodLabel(startOfPeriod(day, "monthly", IST), "monthly", IST)).toBe(
      "Aug 2026",
    );
  });

  it("falls back to IST when the offset override is nonsense", () => {
    expect(reportOffsetMinutes(undefined)).toBe(IST);
    expect(reportOffsetMinutes("not-a-number")).toBe(IST);
    expect(reportOffsetMinutes("99999")).toBe(IST);
    expect(reportOffsetMinutes("-480")).toBe(-480);
  });
});

describe("resolveRange", () => {
  const now = new Date("2026-08-22T06:00:00Z");

  it("defaults to the last 30 days when nothing is asked for", () => {
    const range = resolveRange({}, now, IST);
    expect(range.preset).toBe("30d");
    expect(toDateInputValue(range.from, IST)).toBe("2026-07-24");
    // `to` is exclusive: tomorrow's midnight, so today is included whole.
    expect(toDateInputValue(range.to, IST)).toBe("2026-08-23");
  });

  it("treats a single custom day as a whole day", () => {
    const range = resolveRange({ from: "2026-08-22", to: "2026-08-22" }, now, IST);
    expect(range.preset).toBe("custom");
    expect(toDateInputValue(range.from, IST)).toBe("2026-08-22");
    expect(toDateInputValue(range.to, IST)).toBe("2026-08-23");
  });

  it("swaps a custom range entered backwards rather than returning nothing", () => {
    const range = resolveRange({ from: "2026-08-22", to: "2026-08-01" }, now, IST);
    expect(toDateInputValue(range.from, IST)).toBe("2026-08-01");
    expect(toDateInputValue(range.to, IST)).toBe("2026-08-23");
  });

  it("ignores an unparseable preset or date instead of erroring", () => {
    expect(resolveRange({ preset: "since-forever" }, now, IST).preset).toBe("30d");
    expect(resolveRange({ from: "yesterday", to: "today" }, now, IST).preset).toBe(
      "30d",
    );
    // One valid half is not a custom range — both ends are required.
    expect(resolveRange({ from: "2026-08-01" }, now, IST).preset).toBe("30d");
  });

  it("resolves last month to the whole previous month", () => {
    const range = resolveRange({ preset: "last-month" }, now, IST);
    expect(toDateInputValue(range.from, IST)).toBe("2026-07-01");
    expect(toDateInputValue(range.to, IST)).toBe("2026-08-01");
  });

  it("resolves the last 12 months back to the first of the month", () => {
    const range = resolveRange({ preset: "12m" }, now, IST);
    expect(toDateInputValue(range.from, IST)).toBe("2025-09-01");
  });

  it("picks a granularity a range can actually be read at", () => {
    expect(defaultGranularityFor(resolveRange({ preset: "7d" }, now, IST))).toBe(
      "daily",
    );
    expect(defaultGranularityFor(resolveRange({ preset: "30d" }, now, IST))).toBe(
      "weekly",
    );
    expect(defaultGranularityFor(resolveRange({ preset: "12m" }, now, IST))).toBe(
      "monthly",
    );
  });
});

describe("summarize", () => {
  it("multiplies by quantity and subtracts cost from revenue", () => {
    const totals = summarize([
      line({ quantity: 3, unitPrice: 200_00, unitCost: 50_00 }),
      line({ id: "l2", quantity: 1, unitPrice: 100_00, unitCost: 100_00 }),
    ]);
    expect(totals.revenue).toBe(700_00);
    expect(totals.cost).toBe(250_00);
    expect(totals.profit).toBe(450_00);
    expect(totals.quantity).toBe(4);
    expect(totals.lines).toBe(2);
  });

  it("counts distinct orders, not lines", () => {
    const totals = summarize([
      line({ id: "l1", orderId: "o1" }),
      line({ id: "l2", orderId: "o1" }),
      line({ id: "l3", orderId: "o2" }),
    ]);
    expect(totals.lines).toBe(3);
    expect(totals.orders).toBe(2);
  });

  it("reports a loss as a negative profit and margin", () => {
    const totals = summarize([line({ unitPrice: 100_00, unitCost: 150_00 })]);
    expect(totals.profit).toBe(-50_00);
    expect(totals.margin).toBeCloseTo(-0.5);
  });

  it("leaves the margin undefined when nothing was sold", () => {
    expect(summarize([]).margin).toBeNull();
    // Free work still has a cost, and a margin on zero revenue is not 0%.
    expect(summarize([line({ unitPrice: 0, unitCost: 40_00 })]).margin).toBeNull();
    expect(formatPercent(null)).toBe("—");
  });
});

describe("the …wise groupings", () => {
  const lines = [
    line({ id: "a", itemKey: "royal-gold", itemName: "Royal Gold", unitPrice: 300_00 }),
    line({
      id: "b",
      itemKey: "royal-gold",
      itemName: "Royal Gold",
      orderId: "o2",
      orderRef: "Meera & Rohit",
      unitPrice: 300_00,
    }),
    line({
      id: "c",
      itemKey: "lotus-print",
      itemName: "Lotus Print",
      kind: "PRINT",
      orderId: "o2",
      orderRef: "Meera & Rohit",
      unitPrice: 100_00,
      unitCost: 90_00,
      vendorId: null,
      vendorName: null,
      employeeId: null,
      employeeName: null,
    }),
  ];

  it("totals an item across the orders it appears in", () => {
    const rows = itemWise(lines);
    expect(rows.map((row) => row.label)).toEqual(["Royal Gold", "Lotus Print"]);
    expect(rows[0].revenue).toBe(600_00);
    expect(rows[0].orders).toBe(2);
    expect(rows[0].detail).toBe("THEME");
  });

  it("keeps two items with the same name apart when their keys differ", () => {
    const rows = itemWise([
      line({ id: "a", kind: "THEME", itemKey: "gold", itemName: "Gold" }),
      line({ id: "b", kind: "PDF_THEME", itemKey: "gold", itemName: "Gold" }),
    ]);
    expect(rows).toHaveLength(2);
  });

  it("totals an order across its lines", () => {
    const rows = orderWise(lines);
    const meera = rows.find((row) => row.label === "Meera & Rohit");
    expect(meera?.revenue).toBe(400_00);
    expect(meera?.lines).toBe(2);
    expect(meera?.detail).toBe("PUBLISHED");
  });

  it("keeps unassigned work as its own vendor and employee row", () => {
    const vendors = vendorWise(lines);
    expect(vendors.map((row) => row.label)).toEqual(["Sharma Press", "No vendor"]);
    expect(vendors[1].cost).toBe(90_00);

    const employees = employeeWise(lines);
    expect(employees.map((row) => row.label)).toEqual(["Priya", "Unassigned"]);
  });

  it("reports each row's share of total revenue", () => {
    const rows = itemWise(lines);
    const total = rows.reduce((sum, row) => sum + row.revenueShare, 0);
    expect(rows[0].revenueShare).toBeCloseTo(600 / 700);
    expect(total).toBeCloseTo(1);
  });

  it("orders ties by label so the table does not shuffle between loads", () => {
    const rows = itemWise([
      line({ id: "a", itemKey: "zeta", itemName: "Zeta", unitPrice: 100_00 }),
      line({ id: "b", itemKey: "alpha", itemName: "Alpha", unitPrice: 100_00 }),
    ]);
    expect(rows.map((row) => row.label)).toEqual(["Alpha", "Zeta"]);
  });
});

describe("groupByPeriod", () => {
  const range = {
    from: new Date("2026-08-20T18:30:00Z"), // 21 Aug 00:00 IST
    to: new Date("2026-08-23T18:30:00Z"), // 24 Aug 00:00 IST, exclusive
  };

  it("keeps empty buckets at zero instead of dropping them", () => {
    const rows = groupByPeriod(
      [line({ occurredAt: new Date("2026-08-22T06:00:00Z") })],
      range,
      "daily",
      IST,
    );
    expect(rows.map((row) => row.key)).toEqual([
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
    expect(rows[0].revenue).toBe(0);
    expect(rows[0].margin).toBeNull();
    expect(rows[1].revenue).toBe(250_00);
  });

  it("does not add a phantom bucket for the exclusive end", () => {
    const monthRange = {
      from: new Date("2026-07-31T18:30:00Z"), // 1 Aug IST
      to: new Date("2026-08-31T18:30:00Z"), // 1 Sep IST, exclusive
    };
    expect(groupByPeriod([], monthRange, "monthly", IST).map((row) => row.key)).toEqual(
      ["2026-08"],
    );
  });

  it("rolls the same lines up differently per granularity", () => {
    const lines = [
      line({
        id: "a",
        occurredAt: new Date("2026-08-21T06:00:00Z"),
        unitPrice: 100_00,
      }),
      line({
        id: "b",
        occurredAt: new Date("2026-08-23T06:00:00Z"),
        unitPrice: 100_00,
      }),
    ];
    expect(groupByPeriod(lines, range, "daily", IST)).toHaveLength(3);

    const weekly = groupByPeriod(lines, range, "weekly", IST);
    // 21 Aug is a Friday and 23 Aug the Sunday of the same week.
    expect(weekly).toHaveLength(1);
    expect(weekly[0].revenue).toBe(200_00);
  });
});

describe("performanceByPeriod", () => {
  const range = {
    from: new Date("2026-08-20T18:30:00Z"),
    to: new Date("2026-08-22T18:30:00Z"),
  };
  const on = (day: string) => new Date(`2026-08-${day}T06:00:00Z`);

  it("joins counts to money on one row per period", () => {
    const rows = performanceByPeriod(
      {
        lines: [line({ occurredAt: on("22"), unitPrice: 500_00, unitCost: 200_00 })],
        created: [{ at: on("21") }, { at: on("22") }, { at: on("22") }],
        published: [{ at: on("22") }],
        views: [{ at: on("22"), count: 40 }],
        guests: [{ at: on("22"), count: 10 }],
        rsvps: [{ at: on("22"), count: 4 }],
      },
      range,
      "daily",
      IST,
    );

    expect(rows.map((row) => row.key)).toEqual(["2026-08-21", "2026-08-22"]);
    expect(rows[0]).toMatchObject({
      created: 1,
      published: 0,
      publishRate: 0,
      rsvpRate: null,
    });
    expect(rows[1]).toMatchObject({
      created: 2,
      published: 1,
      views: 40,
      revenue: 500_00,
    });
    expect(rows[1].profit).toBe(300_00);
    expect(rows[1].publishRate).toBeCloseTo(0.5);
    expect(rows[1].rsvpRate).toBeCloseTo(0.1);
  });

  it("leaves a rate undefined rather than dividing by zero", () => {
    const rows = performanceByPeriod(
      { lines: [], created: [], published: [], views: [], guests: [], rsvps: [] },
      range,
      "daily",
      IST,
    );
    expect(rows.every((row) => row.publishRate === null && row.rsvpRate === null)).toBe(
      true,
    );
  });
});

describe("toCsv", () => {
  it("quotes the separators that would otherwise tear a row in half", () => {
    const csv = toCsv(
      ["Item", "Note", "Revenue"],
      [
        ["Rose, gold foil", 'He said "yes"', "250.00"],
        ["Plain", "two\nlines", "0.00"],
      ],
    );
    expect(csv.split("\r\n")).toEqual([
      "Item,Note,Revenue",
      '"Rose, gold foil","He said ""yes""",250.00',
      'Plain,"two\nlines",0.00',
    ]);
  });
});
