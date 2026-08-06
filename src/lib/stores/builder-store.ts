import { create } from "zustand";

import type { SectionConfigEntry } from "@/lib/get-invite-data";

const MAX_HISTORY = 50;

type BuilderState = {
  sections: SectionConfigEntry[];
  history: SectionConfigEntry[][];
  future: SectionConfigEntry[][];
  savedSnapshot: string;
  init: (sections: SectionConfigEntry[]) => void;
  reorder: (activeId: string, overId: string) => void;
  toggleVisible: (id: string) => void;
  toggleLock: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  isDirty: () => boolean;
};

function withOrder(sections: SectionConfigEntry[]): SectionConfigEntry[] {
  return sections.map((s, index) => ({ ...s, order: index }));
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  sections: [],
  history: [],
  future: [],
  savedSnapshot: "[]",

  init: (sections) => {
    const sorted = withOrder([...sections].sort((a, b) => a.order - b.order));
    set({ sections: sorted, history: [], future: [], savedSnapshot: JSON.stringify(sorted) });
  },

  reorder: (activeId, overId) => {
    if (activeId === overId) return;
    const { sections, history } = get();
    const oldIndex = sections.findIndex((s) => s.id === activeId);
    const newIndex = sections.findIndex((s) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    if (sections[oldIndex].locked) return;

    const next = [...sections];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);

    set({
      sections: withOrder(next),
      history: [...history.slice(-MAX_HISTORY + 1), sections],
      future: [],
    });
  },

  toggleVisible: (id) => {
    const { sections, history } = get();
    const target = sections.find((s) => s.id === id);
    if (!target || target.locked) return;

    set({
      sections: sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
      history: [...history.slice(-MAX_HISTORY + 1), sections],
      future: [],
    });
  },

  toggleLock: (id) => {
    const { sections, history } = get();
    set({
      sections: sections.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)),
      history: [...history.slice(-MAX_HISTORY + 1), sections],
      future: [],
    });
  },

  duplicate: (id) => {
    const { sections, history } = get();
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const source = sections[index];
    const copy: SectionConfigEntry = {
      ...source,
      id: `${source.type}-${Date.now().toString(36)}`,
      locked: false,
    };
    const next = [...sections];
    next.splice(index + 1, 0, copy);

    set({
      sections: withOrder(next),
      history: [...history.slice(-MAX_HISTORY + 1), sections],
      future: [],
    });
  },

  remove: (id) => {
    const { sections, history } = get();
    const target = sections.find((s) => s.id === id);
    if (!target || target.locked) return;

    set({
      sections: withOrder(sections.filter((s) => s.id !== id)),
      history: [...history.slice(-MAX_HISTORY + 1), sections],
      future: [],
    });
  },

  undo: () => {
    const { history, sections, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({
      sections: previous,
      history: history.slice(0, -1),
      future: [sections, ...future],
    });
  },

  redo: () => {
    const { future, sections, history } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      sections: next,
      future: future.slice(1),
      history: [...history, sections],
    });
  },

  markSaved: () => set((state) => ({ savedSnapshot: JSON.stringify(state.sections) })),

  isDirty: () => {
    const { sections, savedSnapshot } = get();
    return JSON.stringify(sections) !== savedSnapshot;
  },
}));
