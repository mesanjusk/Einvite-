import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildVideoPrompt,
  isGeminiVideoConfigured,
  startGeminiVideoGeneration,
  pollGeminiVideoOperation,
} from "./gemini-video";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildVideoPrompt", () => {
  const invitation = {
    brideName: "Meenal",
    groomName: "Avinash",
    weddingDateDisplay: "12 December 2026",
    venueName: "Accord Wildlife Pench Resort",
    customMessage: "Bring your dancing shoes",
    colorPalette: { primary: "#7a2e2e", secondary: "#f3d9d9", accent: "#c9942a" },
    eventNames: ["Mehendi", "Wedding"],
    photoCount: 5,
  };
  const template = {
    promptTemplate: "A teaser for {{coupleNames}}, celebrating on {{weddingDate}} at {{venueName}}.",
    styleKeywords: ["golden hour", "romantic"],
    aspectRatio: "9:16",
    durationSeconds: 15,
  };

  it("fills in placeholders from the invitation's captured details", () => {
    const prompt = buildVideoPrompt(invitation, template);
    expect(prompt).toContain("A teaser for Meenal & Avinash, celebrating on 12 December 2026 at Accord Wildlife Pench Resort.");
  });

  it("appends a details block with venue, style, and format", () => {
    const prompt = buildVideoPrompt(invitation, template);
    expect(prompt).toContain("Couple: Meenal & Avinash.");
    expect(prompt).toContain("Wedding date: 12 December 2026.");
    expect(prompt).toContain("Venue: Accord Wildlife Pench Resort.");
    expect(prompt).toContain("Style: golden hour, romantic.");
    expect(prompt).toContain("Aspect ratio 9:16, about 15s.");
  });

  it("leaves unknown placeholders untouched", () => {
    const prompt = buildVideoPrompt(invitation, {
      ...template,
      promptTemplate: "{{coupleNames}} — {{notAPlaceholder}}",
    });
    expect(prompt).toContain("Meenal & Avinash — {{notAPlaceholder}}");
  });

  it("omits venue from the details block when not set", () => {
    const prompt = buildVideoPrompt({ ...invitation, venueName: null }, template);
    expect(prompt).not.toContain("Venue:");
  });

  it("resolves style/events/color placeholders to empty strings when absent", () => {
    const prompt = buildVideoPrompt(
      { brideName: "A", groomName: "B", weddingDateDisplay: "1 Jan 2027" },
      { promptTemplate: "{{style}}|{{events}}|{{primaryColor}}", styleKeywords: [], aspectRatio: "16:9", durationSeconds: 10 },
    );
    expect(prompt.startsWith("||")).toBe(true);
  });
});

describe("isGeminiVideoConfigured", () => {
  it("is false with no custom key and no env key", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isGeminiVideoConfigured(null)).toBe(false);
    expect(isGeminiVideoConfigured(undefined)).toBe(false);
  });

  it("is true when only the env key is set", () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    expect(isGeminiVideoConfigured(null)).toBe(true);
  });

  it("is true when only a custom (per-invitation) key is set", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isGeminiVideoConfigured("custom-key")).toBe(true);
  });
});

describe("startGeminiVideoGeneration", () => {
  it("fails without throwing when no key is configured anywhere", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const result = await startGeminiVideoGeneration("a prompt", {
      model: "veo-3.0-generate-001",
      aspectRatio: "9:16",
      apiKey: null,
    });
    expect(result).toEqual({ ok: false, error: "No Gemini API key is configured for this invitation." });
  });

  it("prefers the per-invitation key over the env key in the request URL", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: "operations/abc123" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await startGeminiVideoGeneration("a prompt", {
      model: "veo-3.0-generate-001",
      aspectRatio: "9:16",
      apiKey: "own-key",
    });

    expect(result).toEqual({ ok: true, operationName: "operations/abc123" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001:predictLongRunning?key=own-key",
    );
    expect(JSON.parse(init.body)).toEqual({
      instances: [{ prompt: "a prompt" }],
      parameters: { aspectRatio: "9:16" },
    });
  });

  it("falls back to the env key when no per-invitation key is set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: "operations/xyz" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await startGeminiVideoGeneration("a prompt", {
      model: "veo-3.0-generate-001",
      aspectRatio: "16:9",
    });

    expect(fetchMock.mock.calls[0][0]).toContain("key=env-key");
  });

  it("surfaces a clean error on a non-2xx response instead of throwing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("quota exceeded", { status: 429 })));

    const result = await startGeminiVideoGeneration("p", { model: "m", aspectRatio: "9:16" });
    expect(result).toEqual({ ok: false, error: "Gemini API error (429)" });
  });

  it("surfaces an error when the response has no operation name", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })));

    const result = await startGeminiVideoGeneration("p", { model: "m", aspectRatio: "9:16" });
    expect(result).toEqual({ ok: false, error: "Gemini API returned no operation name." });
  });

  it("catches a network throw instead of propagating it", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

    const result = await startGeminiVideoGeneration("p", { model: "m", aspectRatio: "9:16" });
    expect(result).toEqual({ ok: false, error: "Could not reach the Gemini API." });
  });
});

describe("pollGeminiVideoOperation", () => {
  it("fails without throwing when no key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const result = await pollGeminiVideoOperation("operations/abc", null);
    expect(result).toEqual({ status: "FAILED", error: "No Gemini API key is configured for this invitation." });
  });

  it("reports PROCESSING while the operation isn't done", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ done: false }), { status: 200 })));

    const result = await pollGeminiVideoOperation("operations/abc");
    expect(result).toEqual({ status: "PROCESSING" });
  });

  it("reports COMPLETED with a key-signed video URL (generateVideoResponse shape)", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            done: true,
            response: {
              generateVideoResponse: { generatedSamples: [{ video: { uri: "https://example.com/v.mp4" } }] },
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await pollGeminiVideoOperation("operations/abc", "own-key");
    expect(result).toEqual({ status: "COMPLETED", videoUrl: "https://example.com/v.mp4?key=own-key" });
  });

  it("reports COMPLETED for the generatedVideos response shape too", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            done: true,
            response: { generatedVideos: [{ video: { uri: "https://example.com/v.mp4?token=1" } }] },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await pollGeminiVideoOperation("operations/abc", "own-key");
    expect(result).toEqual({ status: "COMPLETED", videoUrl: "https://example.com/v.mp4?token=1&key=own-key" });
  });

  it("reports FAILED when Gemini's operation itself errored", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ done: true, error: { message: "Safety filter triggered" } }), { status: 200 }),
      ),
    );

    const result = await pollGeminiVideoOperation("operations/abc");
    expect(result).toEqual({ status: "FAILED", error: "Safety filter triggered" });
  });

  it("reports FAILED when done but no video is present", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ done: true, response: {} }), { status: 200 })));

    const result = await pollGeminiVideoOperation("operations/abc");
    expect(result).toEqual({ status: "FAILED", error: "Gemini finished but returned no video." });
  });

  it("surfaces a clean error on a non-2xx poll response", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 404 })));

    const result = await pollGeminiVideoOperation("operations/abc");
    expect(result).toEqual({ status: "FAILED", error: "Gemini API error (404)" });
  });

  it("catches a network throw while polling", async () => {
    vi.stubEnv("GEMINI_API_KEY", "env-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));

    const result = await pollGeminiVideoOperation("operations/abc");
    expect(result).toEqual({ status: "FAILED", error: "Could not reach the Gemini API." });
  });
});
