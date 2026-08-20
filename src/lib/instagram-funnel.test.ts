import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InstagramMedia } from "./instagram";

vi.mock("@/lib/db", () => ({
  db: {
    instagramAutomation: { findMany: vi.fn() },
    instagramCommentLog: { groupBy: vi.fn() },
    instagramLead: { findMany: vi.fn() },
    instagramLink: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/instagram", () => ({
  isInstagramSendConfigured: vi.fn(() => true),
  fetchRecentInstagramMedia: vi.fn(),
  fetchInstagramMedia: vi.fn(),
}));

const { db } = await import("@/lib/db");
const { fetchRecentInstagramMedia, fetchInstagramMedia, isInstagramSendConfigured } =
  await import("@/lib/instagram");
const { loadReelFunnelReport } = await import("./instagram-insights");

const reel = (id: string): InstagramMedia => ({
  id,
  mediaType: "VIDEO",
  mediaProductType: "REELS",
});

// m1 and m2 are recent; m3 is an older reel that has aged out of the recent
// list but still carries an automation, which is the case the report has to
// go back and fetch media for.
const REACH: Record<string, number> = { m1: 1000, m2: 5000, m3: 200 };

/**
 * Comment-log totals per media, keyed the way the loader's four grouped
 * queries ask for them.
 */
const LOG_COUNTS = {
  all: { m1: 10, m2: 3, m3: 5 },
  triggered: { m1: 8, m3: 5 },
  gateBlocked: { m1: 2 },
  replySent: { m1: 6, m3: 5 },
};

function groupsFrom(counts: Record<string, number>) {
  return Object.entries(counts).map(([mediaId, n]) => ({
    mediaId,
    _count: { _all: n },
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isInstagramSendConfigured).mockReturnValue(true);

  vi.mocked(fetchRecentInstagramMedia).mockResolvedValue([reel("m1"), reel("m2")]);
  vi.mocked(fetchInstagramMedia).mockImplementation(async (id: string) => reel(id));

  vi.mocked(db.instagramAutomation.findMany).mockResolvedValue([
    { id: "a1", mediaId: "m1", label: "Invite reel", triggerWord: "INVITE", isActive: true, requireFollow: true },
    { id: "a2", mediaId: "m3", label: "Old reel", triggerWord: "LINK", isActive: false, requireFollow: false },
  ] as never);

  // The four grouped queries differ only by their `outcome` filter, so the
  // mock reads that back to decide which set of counts to answer with.
  vi.mocked(db.instagramCommentLog.groupBy).mockImplementation((async (args: {
    where?: { outcome?: unknown };
  }) => {
    const outcome = args.where?.outcome;
    if (outcome === undefined) return groupsFrom(LOG_COUNTS.all);
    if (outcome === "REPLY_SENT") return groupsFrom(LOG_COUNTS.replySent);
    const list = (outcome as { in: string[] }).in;
    return groupsFrom(list.length === 2 ? LOG_COUNTS.gateBlocked : LOG_COUNTS.triggered);
  }) as never);

  vi.mocked(db.instagramLead.findMany).mockResolvedValue([
    { automationId: "a1", igUserId: "ig1" },
    { automationId: "a1", igUserId: "ig2" },
    { automationId: "a1", igUserId: "ig3" },
    { automationId: "a2", igUserId: "ig4" },
  ] as never);

  // ig3 took a link and never built anything — the drop-off the report exists
  // to make visible.
  vi.mocked(db.instagramLink.findMany).mockResolvedValue([
    { igUserId: "ig1", invitation: { status: "PUBLISHED" } },
    { igUserId: "ig2", invitation: { status: "DRAFT" } },
    { igUserId: "ig4", invitation: { status: "PUBLISHED" } },
  ] as never);

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const mediaId = String(url).match(/v21\.0\/(\w+)\/insights/)?.[1] ?? "";
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { name: "reach", values: [{ value: REACH[mediaId] ?? 0 }] },
            { name: "saved", values: [{ value: 5 }] },
          ],
        }),
        text: async () => "",
      };
    }),
  );
});

describe("loadReelFunnelReport", () => {
  it("carries each lead through to the invitation it produced", async () => {
    const { rows } = await loadReelFunnelReport();
    const m1 = rows.find((r) => r.mediaId === "m1");

    expect(m1).toMatchObject({
      leads: 3,
      invitations: 2,
      published: 1,
      comments: 10,
      triggered: 8,
      gateBlocked: 2,
      linksDelivered: 6,
    });
  });

  it("ranks by invitations produced rather than by reach", async () => {
    const { rows } = await loadReelFunnelReport();

    // m2 has five times m1's reach and still sorts last, because it produced
    // nothing. That ordering is the argument the tab is making.
    expect(rows.map((r) => r.mediaId)).toEqual(["m1", "m3", "m2"]);
  });

  it("includes recent reels that have no automation on them", async () => {
    const { rows } = await loadReelFunnelReport();
    const m2 = rows.find((r) => r.mediaId === "m2");

    expect(m2).toMatchObject({ automationId: null, leads: 0, triggered: 0 });
    expect(m2?.insights?.reach).toBe(5000);
  });

  it("goes back for media of an automated reel that aged out of the recent list", async () => {
    const { rows } = await loadReelFunnelReport();

    expect(fetchInstagramMedia).toHaveBeenCalledWith("m3");
    expect(rows.find((r) => r.mediaId === "m3")).toMatchObject({
      label: "Old reel",
      isActive: false,
      invitations: 1,
    });
  });

  it("totals the funnel across every reel", async () => {
    const { totals } = await loadReelFunnelReport();

    expect(totals).toMatchObject({
      reach: 6200,
      comments: 18,
      triggered: 13,
      gateBlocked: 2,
      linksDelivered: 11,
      leads: 4,
      invitations: 3,
      published: 2,
    });
  });

  it("reports insights as unavailable without dropping the funnel columns", async () => {
    vi.mocked(isInstagramSendConfigured).mockReturnValue(false);

    const { rows, totals, insightsUnavailable } = await loadReelFunnelReport();

    expect(insightsUnavailable).toBe(true);
    expect(rows.every((r) => r.insights === null)).toBe(true);
    // Our own numbers come from the database and survive a missing token.
    expect(totals.invitations).toBe(3);
  });
});
