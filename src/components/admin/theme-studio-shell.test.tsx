import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeStudioShell, type StudioTool } from "./theme-studio-shell";

function Fixture() {
  const [tool, setTool] = useState<StudioTool>("content");
  const [text, setText] = useState("Unsaved blessing");
  return <ThemeStudioShell tool={tool} onToolChange={setTool} sections={<button type="button">Mangal Aamantran</button>} canvas={<input aria-label="Draft content" value={text} onChange={(event) => setText(event.target.value)} />} panel={<p>{tool} controls</p>} onAddText={() => setText("Added text")} status="Draft" actions={<button type="button">Save</button>} />;
}

afterEach(cleanup);
describe("desktop admin studio navigation", () => {
  it("switches every footer library locally and retains the canvas and unsaved content", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<Fixture />);
    const input = screen.getByLabelText("Draft content");
    fireEvent.change(input, { target: { value: "My edited blessing" } });
    for (const label of ["Templates", "Video", "Music", "Content"]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByLabelText("Draft content")).toBe(input);
      expect(input).toHaveValue("My edited blessing");
    }
    fireEvent.click(screen.getByRole("button", { name: "Text & style" }));
    expect(screen.getByRole("complementary", { name: "Text & style" })).toHaveTextContent("text controls");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
