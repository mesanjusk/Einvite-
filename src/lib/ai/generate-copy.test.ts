import { afterEach, describe, expect, it, vi } from "vitest";

import { generateInvitationCopy } from "./generate-copy";

const INPUT = {
  brideName: "Meenal",
  groomName: "Avinash",
  weddingDateDisplay: "12 December 2026",
  venueName: "Accord Wildlife Pench Resort",
};

const VALID_COPY = {
  heroHeadline: "We're Getting Married",
  heroSubline: "Join us as we celebrate",
  invitationLetter: "Together with our families...",
  storyHeadline: "Forever Us",
  hashtags: ["MeenalAvinash", "MeenalWedsAvinash", "OurWedding"],
  seoTitle: "Meenal & Avinash — Wedding 2026",
  seoDescription: "Join us as we celebrate the wedding of Meenal & Avinash.",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("generateInvitationCopy", () => {
  it("falls back to the deterministic template when no provider key is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    const result = await generateInvitationCopy(INPUT);

    expect(result.source).toBe("template");
    expect(result.heroHeadline).toBeTruthy();
    expect(result.invitationLetter).toContain("Accord Wildlife Pench Resort");
    expect(result.hashtags.length).toBeGreaterThan(0);
  });

  it("uses the Anthropic response when ANTHROPIC_API_KEY is set and the call succeeds", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("OPENAI_API_KEY", "");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ content: [{ text: JSON.stringify(VALID_COPY) }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateInvitationCopy(INPUT);

    expect(result.source).toBe("anthropic");
    expect(result.heroHeadline).toBe(VALID_COPY.heroHeadline);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("falls through to the template when the Anthropic call fails", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("OPENAI_API_KEY", "");

    const fetchMock = vi.fn().mockResolvedValue(new Response("server error", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateInvitationCopy(INPUT);

    expect(result.source).toBe("template");
  });

  it("falls through to the template when Anthropic returns unparseable JSON", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("OPENAI_API_KEY", "");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [{ text: "not json" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateInvitationCopy(INPUT);

    expect(result.source).toBe("template");
  });

  it("falls through to OpenAI when Anthropic is not configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: JSON.stringify(VALID_COPY) } }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateInvitationCopy(INPUT);

    expect(result.source).toBe("openai");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
