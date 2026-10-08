"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Bounded in-memory undo, grouped while typing. Drafts never leave the editor. */
export function useDraftHistory<T>(values: T, restore: (value: T) => void) {
  const serialized = JSON.stringify(values);
  const history = useRef({ frames: [serialized], cursor: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoring = useRef<string | null>(null);
  const restoreRef = useRef(restore);
  const [, refresh] = useState(0);
  useEffect(() => { restoreRef.current = restore; }, [restore]);

  const record = useCallback((frame: string) => {
    const state = history.current;
    if (state.frames[state.cursor] === frame) return;
    state.frames = [...state.frames.slice(0, state.cursor + 1), frame].slice(-60);
    state.cursor = state.frames.length - 1;
    refresh((version) => version + 1);
  }, []);

  useEffect(() => {
    if (restoring.current === serialized) { restoring.current = null; return; }
    if (history.current.frames[history.current.cursor] === serialized) return;
    timer.current = setTimeout(() => record(serialized), 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [serialized, record]);

  const undo = () => {
    if (timer.current) clearTimeout(timer.current);
    record(serialized); // Preserve the final keystroke even before the debounce.
    const state = history.current;
    if (state.cursor === 0) return;
    const frame = state.frames[--state.cursor];
    restoring.current = frame;
    restoreRef.current(JSON.parse(frame) as T);
    refresh((version) => version + 1);
  };
  const redo = () => {
    if (timer.current) clearTimeout(timer.current);
    const state = history.current;
    if (serialized !== state.frames[state.cursor] || state.cursor >= state.frames.length - 1) return;
    const frame = state.frames[++state.cursor];
    restoring.current = frame;
    restoreRef.current(JSON.parse(frame) as T);
    refresh((version) => version + 1);
  };
  return { undo, redo, canUndo: history.current.cursor > 0 || serialized !== history.current.frames[history.current.cursor], canRedo: serialized === history.current.frames[history.current.cursor] && history.current.cursor < history.current.frames.length - 1 };
}
