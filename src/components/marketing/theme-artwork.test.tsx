import { render, fireEvent, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeArtwork } from "./theme-artwork";

let visibility: IntersectionObserverCallback;
const theme = { name: "Wedding", revealMode: "VIDEO", revealVideoUrl: "https://example.com/video.mp4", revealVideoPosterUrl: "https://example.com/poster.jpg" };
beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class { constructor(callback: IntersectionObserverCallback) { visibility = callback; } observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function show(visible: boolean) { act(() => visibility([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver)); }
describe("visible invitation artwork", () => {
  it("shows a still without requesting video before it becomes visible", () => {
    const { container } = render(<ThemeArtwork theme={theme} animate />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(theme.revealVideoPosterUrl);
    expect(container.querySelector("video")).toBeNull();
    show(true);
    expect(container.querySelector("video")).not.toBeNull();
    show(false);
    expect(container.querySelector("video")).toBeNull();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
  it("keeps a poster when reduced motion is enabled", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { container } = render(<ThemeArtwork theme={theme} animate />);
    show(true);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });
  it("retains coded artwork if both media sources fail", () => {
    const { container } = render(<ThemeArtwork theme={theme} animate />);
    show(true);
    fireEvent.error(container.querySelector("video")!);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".royal-coded-artwork")).not.toBeNull();
  });
});
