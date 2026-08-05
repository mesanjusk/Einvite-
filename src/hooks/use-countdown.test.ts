import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useCountdown } from "./use-countdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes days/hours/minutes/seconds remaining until the target date", () => {
    const { result } = renderHook(() => useCountdown("2026-12-12T00:00:00.000Z"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // One second has elapsed since the fake system time, so it's just
    // under 11 full days remaining.
    expect(result.current.days).toBe(10);
    expect(result.current.hours).toBe(23);
    expect(result.current.minutes).toBe(59);
  });

  it("counts down as time advances", () => {
    const { result } = renderHook(() => useCountdown("2026-12-01T01:00:00.000Z"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(59);

    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });
    expect(result.current.minutes).toBe(29);
  });

  it("clamps to zero once the target date has passed", () => {
    const { result } = renderHook(() => useCountdown("2026-11-30T00:00:00.000Z"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });
});
