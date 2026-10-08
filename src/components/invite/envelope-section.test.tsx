import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { EnvelopeSection } from "./envelope-section";

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("exclusive opening modes", () => {
  it("starts the video immediately without mounting the coded envelope", () => {
    const complete = vi.fn();
    const { container } = render(<LocaleProvider><EnvelopeSection initials="M&A" mode="VIDEO" videoUrl="/reveal.mp4" onComplete={complete} /></LocaleProvider>);
    expect(container.querySelector('[data-opening-mode="animation"]')).toBeNull();
    expect(screen.queryByText("M&A")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    fireEvent.ended(screen.getByLabelText("Opening reveal video"));
    expect(complete).toHaveBeenCalledOnce();
  });
  it("keeps a failed video in video mode and provides a safe continue action", () => {
    const complete = vi.fn();
    const { container } = render(<LocaleProvider><EnvelopeSection initials="M&A" mode="VIDEO" videoUrl="/missing.mp4" onComplete={complete} /></LocaleProvider>);
    fireEvent.error(screen.getByLabelText("Opening reveal video"));
    expect(screen.getByRole("alert")).toHaveTextContent("unavailable");
    expect(container.querySelector('[data-opening-mode="animation"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue to invitation" }));
    expect(complete).toHaveBeenCalledOnce();
  });
  it("does not silently show animation when video mode has no file", () => {
    const { container } = render(<LocaleProvider><EnvelopeSection initials="M&A" mode="VIDEO" onComplete={vi.fn()} /></LocaleProvider>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(container.querySelector('[data-opening-mode="animation"]')).toBeNull();
  });
  it("uses only animation when explicitly selected despite a stale video URL", () => {
    const { container } = render(<LocaleProvider><EnvelopeSection initials="M&A" mode="ANIMATION" videoUrl="/old.mp4" onComplete={vi.fn()} /></LocaleProvider>);
    expect(container.querySelector('[data-opening-mode="animation"]')).toBeTruthy();
    expect(container.querySelector("video")).toBeNull();
  });
});
