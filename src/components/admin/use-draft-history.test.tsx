import { act, cleanup, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDraftHistory } from "./use-draft-history";

function useFixture() {
  const [draft, setDraft] = useState({ text: "Initial", images: ["first.svg"] });
  return { draft, setDraft, ...useDraftHistory(draft, setDraft) };
}
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("draft undo and redo", () => {
  it("captures a pending edit immediately, restores media, and discards redo after a new edit", () => {
    vi.useFakeTimers();
    const hook = renderHook(useFixture);
    act(() => hook.result.current.setDraft({ text: "Edited", images: ["second.svg"] }));
    act(() => hook.result.current.undo());
    expect(hook.result.current.draft).toEqual({ text: "Initial", images: ["first.svg"] });
    expect(hook.result.current.canRedo).toBe(true);
    act(() => hook.result.current.redo());
    expect(hook.result.current.draft.text).toBe("Edited");
    act(() => hook.result.current.undo());
    act(() => hook.result.current.setDraft({ text: "New branch", images: [] }));
    expect(hook.result.current.canRedo).toBe(false);
    act(() => vi.advanceTimersByTime(500));
    act(() => hook.result.current.undo());
    expect(hook.result.current.draft.text).toBe("Initial");
    act(() => hook.result.current.redo());
    expect(hook.result.current.draft.text).toBe("New branch");
  });
});
