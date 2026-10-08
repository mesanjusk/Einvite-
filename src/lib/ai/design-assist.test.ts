import { afterEach, describe, expect, it, vi } from "vitest";
import { safeDesignSuggestion } from "../design-assist";
import { suggestMediaDesign } from "./design-assist";

const suggestion = { palette: { primary: "#123456", secondary: "#eeeeee", accent: "#cc9900", background: "#ffffff", foreground: "#222222" }, fonts: { display: "Playfair Display", body: "Inter", script: "Great Vibes" }, elements: [{ key: "HERO.primaryName", color: "#123456", fontSize: 32, fontRole: "display", align: "center", width: 80, x: 0, y: 5, bold: false, showBackground: true }] };
afterEach(() => vi.unstubAllGlobals());
describe("media design suggestions", () => {
  it("rejects unknown layers, out-of-frame positioning and unsafe styling", () => {
    expect(() => safeDesignSuggestion(suggestion, ["HERO.primaryName"])).not.toThrow();
    expect(() => safeDesignSuggestion(suggestion, ["VENUE.name"])).toThrow();
    expect(() => safeDesignSuggestion({ ...suggestion, elements: [{ ...suggestion.elements[0], width: 200 }] }, ["HERO.primaryName"])).toThrow();
    expect(() => safeDesignSuggestion({ ...suggestion, palette: { ...suggestion.palette, foreground: "red;display:none" } }, ["HERO.primaryName"])).toThrow();
  });
  it("sends only a small frame and keeps the API key out of the URL", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(suggestion) }] } }] })));
    vi.stubGlobal("fetch", request);
    expect(await suggestMediaDesign({ apiKey: "test-private-key", image: "small-frame", elements: [{ key: "HERO.primaryName", text: "Our name" }] })).toEqual(suggestion);
    const [url, options] = request.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain("test-private-key");
    expect(JSON.parse(options.body as string).contents[0].parts[1].inlineData.data).toBe("small-frame");
  });
  it("returns a useful quota error without exposing provider details or secrets", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private-key / internal details", { status: 429 })));
    await expect(suggestMediaDesign({ apiKey: "private-key", image: "frame", elements: [] })).rejects.toThrow("Gemini quota reached");
  });
});
