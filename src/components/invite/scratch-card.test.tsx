import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScratchCard } from "./scratch-card";

vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
afterEach(() => vi.restoreAllMocks());
describe("scratch date coverage", () => {
  it("uses unscaled layout size inside the admin phone and supports keyboard reveal", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(96);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(96);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 48, height: 48, x: 0, y: 0, top: 0, left: 0, right: 48, bottom: 48, toJSON() {} });
    const fillRect = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ scale: vi.fn(), createLinearGradient: () => ({ addColorStop: vi.fn() }), fillRect, fillText: vi.fn() } as unknown as CanvasRenderingContext2D);
    const onReveal = vi.fn();
    const { container } = render(<ScratchCard label="year" shape="heart" onReveal={onReveal}>2026</ScratchCard>);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 96, 96);
    expect(container.querySelector("canvas")!.style.width).toBe("100%");
    fireEvent.keyDown(screen.getByRole("button", { name: "Reveal year" }), { key: "Enter" });
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(container.querySelector("canvas")).toBeNull();
  });
});
