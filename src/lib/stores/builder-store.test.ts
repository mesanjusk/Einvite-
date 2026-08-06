import { beforeEach, describe, expect, it } from "vitest";

import { useBuilderStore } from "./builder-store";
import type { SectionConfigEntry } from "@/lib/get-invite-data";

const INITIAL: SectionConfigEntry[] = [
  { id: "ENVELOPE", type: "ENVELOPE", visible: true, locked: false, order: 0 },
  { id: "HERO", type: "HERO", visible: true, locked: false, order: 1 },
  { id: "COUNTDOWN", type: "COUNTDOWN", visible: true, locked: false, order: 2 },
];

beforeEach(() => {
  useBuilderStore.getState().init(INITIAL);
});

describe("builder store", () => {
  it("initializes with the given sections in order and no dirty state", () => {
    const state = useBuilderStore.getState();
    expect(state.sections.map((s) => s.id)).toEqual(["ENVELOPE", "HERO", "COUNTDOWN"]);
    expect(state.isDirty()).toBe(false);
  });

  it("reorder moves a section and marks the store dirty", () => {
    useBuilderStore.getState().reorder("COUNTDOWN", "HERO");
    const state = useBuilderStore.getState();
    expect(state.sections.map((s) => s.id)).toEqual(["ENVELOPE", "COUNTDOWN", "HERO"]);
    expect(state.sections.map((s) => s.order)).toEqual([0, 1, 2]);
    expect(state.isDirty()).toBe(true);
  });

  it("does not reorder a locked section", () => {
    useBuilderStore.setState((s) => ({
      sections: s.sections.map((sec) => (sec.id === "HERO" ? { ...sec, locked: true } : sec)),
    }));
    useBuilderStore.getState().reorder("HERO", "COUNTDOWN");
    expect(useBuilderStore.getState().sections.map((s) => s.id)).toEqual([
      "ENVELOPE",
      "HERO",
      "COUNTDOWN",
    ]);
  });

  it("toggleVisible flips visibility unless locked", () => {
    useBuilderStore.getState().toggleVisible("HERO");
    expect(useBuilderStore.getState().sections.find((s) => s.id === "HERO")?.visible).toBe(
      false,
    );

    useBuilderStore.setState((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === "COUNTDOWN" ? { ...sec, locked: true } : sec,
      ),
    }));
    useBuilderStore.getState().toggleVisible("COUNTDOWN");
    expect(useBuilderStore.getState().sections.find((s) => s.id === "COUNTDOWN")?.visible).toBe(
      true,
    );
  });

  it("duplicate inserts a copy with a new id right after the source", () => {
    useBuilderStore.getState().duplicate("HERO");
    const ids = useBuilderStore.getState().sections.map((s) => s.id);
    expect(ids).toHaveLength(4);
    expect(ids[1]).toBe("HERO");
    expect(ids[2]).toMatch(/^HERO-/);
  });

  it("remove deletes a section unless locked", () => {
    useBuilderStore.getState().remove("COUNTDOWN");
    expect(useBuilderStore.getState().sections.map((s) => s.id)).toEqual(["ENVELOPE", "HERO"]);

    useBuilderStore.setState((s) => ({
      sections: s.sections.map((sec) => (sec.id === "HERO" ? { ...sec, locked: true } : sec)),
    }));
    useBuilderStore.getState().remove("HERO");
    expect(useBuilderStore.getState().sections.map((s) => s.id)).toEqual(["ENVELOPE", "HERO"]);
  });

  it("undo/redo walk backward and forward through history", () => {
    useBuilderStore.getState().toggleVisible("HERO");
    useBuilderStore.getState().duplicate("COUNTDOWN");
    expect(useBuilderStore.getState().sections).toHaveLength(4);

    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().sections).toHaveLength(3);
    expect(useBuilderStore.getState().sections.find((s) => s.id === "HERO")?.visible).toBe(
      false,
    );

    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().sections.find((s) => s.id === "HERO")?.visible).toBe(true);
    expect(useBuilderStore.getState().isDirty()).toBe(false);

    useBuilderStore.getState().redo();
    expect(useBuilderStore.getState().sections.find((s) => s.id === "HERO")?.visible).toBe(
      false,
    );
  });

  it("markSaved resets the dirty flag against the current sections", () => {
    useBuilderStore.getState().toggleVisible("HERO");
    expect(useBuilderStore.getState().isDirty()).toBe(true);

    useBuilderStore.getState().markSaved();
    expect(useBuilderStore.getState().isDirty()).toBe(false);
  });

  it("a new edit after undo clears the redo stack", () => {
    useBuilderStore.getState().toggleVisible("HERO");
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().future).toHaveLength(1);

    useBuilderStore.getState().toggleVisible("COUNTDOWN");
    expect(useBuilderStore.getState().future).toHaveLength(0);
  });
});
