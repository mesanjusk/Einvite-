import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPdfImage, fetchPdfImages, toPdfSafeImageUrl } from "./images";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function imageResponse(type: string, bytes = 32) {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { "content-type": type },
  });
}

describe("toPdfSafeImageUrl", () => {
  it("asks Cloudinary for a JPEG", () => {
    expect(
      toPdfSafeImageUrl("https://res.cloudinary.com/demo/image/upload/v123/photo.png"),
    ).toBe("https://res.cloudinary.com/demo/image/upload/f_jpg,q_auto/v123/photo.png");
  });

  it("pins Unsplash to JPEG instead of its negotiated format", () => {
    const url = toPdfSafeImageUrl(
      "https://images.unsplash.com/photo-123?auto=format&fit=crop&w=1200&q=80",
    );
    expect(url).toContain("fm=jpg");
    expect(url).not.toContain("auto=format");
    expect(url).toContain("fit=crop");
  });

  it("leaves anything else alone", () => {
    expect(toPdfSafeImageUrl("https://example.com/photo.jpg")).toBe(
      "https://example.com/photo.jpg",
    );
    expect(toPdfSafeImageUrl("data:image/jpeg;base64,AAAA")).toBe(
      "data:image/jpeg;base64,AAAA",
    );
  });
});

describe("fetchPdfImage", () => {
  it("inlines a JPEG as a data URI", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse("image/jpeg")));
    const result = await fetchPdfImage("https://example.com/photo.jpg");
    expect(result?.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("normalises image/jpg to image/jpeg", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse("image/jpg")));
    const result = await fetchPdfImage("https://example.com/photo.jpg");
    expect(result?.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("skips a format PDF viewers can't decode", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse("image/webp")));
    expect(await fetchPdfImage("https://example.com/photo.webp")).toBeNull();
  });

  it("skips an empty body and a failed response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse("image/png", 0)));
    expect(await fetchPdfImage("https://example.com/photo.png")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );
    expect(await fetchPdfImage("https://example.com/missing.jpg")).toBeNull();
  });

  it("never throws when the fetch itself blows up", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await fetchPdfImage("https://example.com/photo.jpg")).toBeNull();
  });

  it("rejects anything that isn't an http(s) URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchPdfImage("/local/photo.jpg")).toBeNull();
    expect(await fetchPdfImage("")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes an already-inlined image straight through", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchPdfImage("data:image/png;base64,AAAA")).toBe(
      "data:image/png;base64,AAAA",
    );
    expect(await fetchPdfImage("data:image/webp;base64,AAAA")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchPdfImages", () => {
  it("keeps the usable ones and drops the rest", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(imageResponse("image/jpeg"))
        .mockResolvedValueOnce(new Response("nope", { status: 500 }))
        .mockResolvedValueOnce(imageResponse("image/png")),
    );

    const results = await fetchPdfImages([
      "https://example.com/a.jpg",
      null,
      "https://example.com/b.jpg",
      "https://example.com/c.png",
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]).toContain("image/jpeg");
    expect(results[1]).toContain("image/png");
  });
});
