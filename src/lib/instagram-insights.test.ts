import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchMediaInsights } from "./instagram-insights";
import type { InstagramMedia } from "./instagram";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const REEL: InstagramMedia = {
  id: "m1",
  mediaType: "VIDEO",
  mediaProductType: "REELS",
};

function insightsResponse(metrics: Record<string, number>) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: Object.entries(metrics).map(([name, value]) => ({
        name,
        period: "lifetime",
        values: [{ value }],
      })),
    }),
    text: async () => "",
  };
}

describe("fetchMediaInsights", () => {
  it("skips the network entirely when no token is configured", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchMediaInsights("m1", REEL)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps Instagram's metric list onto named fields", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        insightsResponse({
          reach: 1200,
          views: 3400,
          saved: 56,
          shares: 7,
          total_interactions: 210,
          ig_reels_avg_watch_time: 4300,
        }),
      ),
    );

    const insights = await fetchMediaInsights("m1", REEL);

    expect(insights).toMatchObject({
      reach: 1200,
      views: 3400,
      saved: 56,
      shares: 7,
      totalInteractions: 210,
      avgWatchTimeMs: 4300,
    });
  });

  // `plays` was the reel view metric before v22 renamed it to `views`. Both
  // land in the same field so the report doesn't care which one the account's
  // Graph version answers with.
  it("reads a pre-v22 `plays` count as views", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(insightsResponse({ reach: 10, plays: 99 })),
    );

    expect(await fetchMediaInsights("m1", REEL)).toMatchObject({ views: 99 });
  });

  it("retries with a smaller metric set when Instagram rejects one", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "unsupported metric",
        json: async () => ({}),
      })
      .mockResolvedValueOnce(insightsResponse({ reach: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchMediaInsights("m1", REEL)).toMatchObject({ reach: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // A missing insights permission fails the same way for every metric set, so
  // retrying just burns rate limit against a wall.
  it("gives up immediately on a permission error", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "insufficient permission",
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchMediaInsights("m1", REEL)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not ask a plain photo for reel-only metrics", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    const fetchMock = vi.fn().mockResolvedValue(insightsResponse({ reach: 42 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchMediaInsights("m2", {
      id: "m2",
      mediaType: "IMAGE",
      mediaProductType: "FEED",
    });

    expect(String(fetchMock.mock.calls[0][0])).not.toContain("ig_reels");
  });
});
