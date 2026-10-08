import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemePhoneFrame } from "./theme-phone-frame";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("mobile preview fit", () => {
  it("fits a short screen and updates when the canvas resizes", () => {
    let width = 600, height = 400;
    let resized: () => void = () => {};
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => height);
    vi.stubGlobal("ResizeObserver", class { constructor(callback: () => void) { resized = callback; } observe() {} disconnect() {} });
    const { container } = render(<ThemePhoneFrame>Mobile design</ThemePhoneFrame>);
    const frame = container.querySelector<HTMLElement>("[data-theme-phone-frame]")!;
    expect(frame.style.transform).toContain(`scale(${400 / 780})`);
    height = 900; width = 195;
    act(() => resized());
    expect(frame.style.transform).toContain("scale(0.5)");
    width = 900;
    act(() => resized());
    expect(frame.style.transform).toContain("scale(1)");
  });
});
