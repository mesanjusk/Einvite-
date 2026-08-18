import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchInstagramFollowStatus,
  isInstagramSendConfigured,
  sendInstagramMessage,
} from "./instagram";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => "",
    json: async () => ({}),
    ...response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("isInstagramSendConfigured", () => {
  it("is false without a token, true with one", () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "");
    expect(isInstagramSendConfigured()).toBe(false);

    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    expect(isInstagramSendConfigured()).toBe(true);
  });
});

describe("sendInstagramMessage", () => {
  it("skips the network entirely when no token is configured", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "");
    const fetchMock = stubFetch({});
    vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendInstagramMessage({ comment_id: "c1" }, "hello");

    expect(result).toEqual({ delivered: false, devMode: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to graph.instagram.com with a bearer token", async () => {
    // graph.facebook.com rejects Instagram-scoped IGAA tokens with
    // "Cannot parse access token", so the host matters.
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    const fetchMock = stubFetch({});

    const result = await sendInstagramMessage({ comment_id: "c1" }, "your link");

    expect(result).toEqual({ delivered: true, devMode: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://graph.instagram.com/v21.0/me/messages");
    expect(init.headers.Authorization).toBe("Bearer IGAAtoken");
    expect(JSON.parse(init.body)).toEqual({
      recipient: { comment_id: "c1" },
      message: { text: "your link" },
    });
  });

  it("reports failure without throwing so the webhook still returns 200", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    stubFetch({ ok: false, status: 400, text: async () => '{"error":{"code":190}}' });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendInstagramMessage({ id: "u1" }, "hi")).resolves.toEqual({
      delivered: false,
      devMode: false,
    });
  });
});

describe("fetchInstagramFollowStatus", () => {
  it("returns the follower flag and username when Instagram resolves the user", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    stubFetch({ json: async () => ({ username: "priya", is_user_follow_business: true }) });

    await expect(fetchInstagramFollowStatus("123")).resolves.toEqual({
      isFollower: true,
      username: "priya",
    });
  });

  it("distinguishes a real 'not following' from an unresolvable lookup", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    stubFetch({ json: async () => ({ username: "priya", is_user_follow_business: false }) });

    await expect(fetchInstagramFollowStatus("123")).resolves.toEqual({
      isFollower: false,
      username: "priya",
    });
  });

  it("returns null when the field is absent, so callers can fail open", async () => {
    // Instagram omits is_user_follow_business for users it can't resolve —
    // typically commenters who have never messaged the account. Treating that
    // as "not following" would block genuine followers.
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    stubFetch({ json: async () => ({ username: "priya" }) });

    await expect(fetchInstagramFollowStatus("123")).resolves.toEqual({
      isFollower: null,
      username: "priya",
    });
  });

  it("returns null on an API error rather than throwing", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    stubFetch({ ok: false, status: 400, text: async () => "nope" });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(fetchInstagramFollowStatus("123")).resolves.toEqual({ isFollower: null });
  });

  it("returns null on a network throw rather than propagating", async () => {
    vi.stubEnv("IG_ACCESS_TOKEN", "IGAAtoken");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(fetchInstagramFollowStatus("123")).resolves.toEqual({ isFollower: null });
  });
});
