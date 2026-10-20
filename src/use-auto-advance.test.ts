import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUCCESS_DELAY, SUPPORTED_SUCCESS_DELAY, useAutoAdvance } from "./use-auto-advance";

describe("automatic answer progression", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible"); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

  it("keeps feedback readable, then advances once using the latest callback without rerender delays", () => {
    const first = vi.fn(), latest = vi.fn();
    const { rerender } = renderHook(({ advance }) => useAutoAdvance("question-1", true, SUCCESS_DELAY, advance), { initialProps: { advance: first } });
    tick(SUCCESS_DELAY - 1);
    expect(first).not.toHaveBeenCalled();
    rerender({ advance: latest });
    tick(1);
    expect(latest).toHaveBeenCalledExactlyOnceWith("question-1");
    tick(SUCCESS_DELAY * 5);
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it("waits for the durable save and for a paused celebration to resume", () => {
    const advance = vi.fn();
    const { rerender } = renderHook(({ enabled }) => useAutoAdvance("q", enabled, SUPPORTED_SUCCESS_DELAY, advance), { initialProps: { enabled: false } });
    tick(10_000);
    expect(advance).not.toHaveBeenCalled();
    rerender({ enabled: true });
    tick(1000);
    rerender({ enabled: false });
    tick(10_000);
    expect(advance).not.toHaveBeenCalled();
    rerender({ enabled: true });
    tick(SUPPORTED_SUCCESS_DELAY - 1);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it("cancels stale questions and timers on navigation", () => {
    const advance = vi.fn();
    const { rerender, unmount } = renderHook(({ id }) => useAutoAdvance(id, true, SUCCESS_DELAY, advance), { initialProps: { id: "old" } });
    tick(1000);
    rerender({ id: "new" });
    tick(SUCCESS_DELAY - 1);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledExactlyOnceWith("new");
    rerender({ id: "last" });
    unmount();
    tick(10_000);
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it("never advances while hidden and gives a fresh celebration interval on return", () => {
    const advance = vi.fn();
    const visibility = vi.spyOn(document, "visibilityState", "get");
    renderHook(() => useAutoAdvance("q", true, SUCCESS_DELAY, advance));
    tick(1000);
    act(() => { visibility.mockReturnValue("hidden"); document.dispatchEvent(new Event("visibilitychange")); });
    tick(10_000);
    expect(advance).not.toHaveBeenCalled();
    act(() => { visibility.mockReturnValue("visible"); document.dispatchEvent(new Event("visibilitychange")); });
    tick(SUCCESS_DELAY - 1);
    expect(advance).not.toHaveBeenCalled();
    tick(1);
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it("requires an explicit retry after a failed advance and handles the iOS page lifecycle", () => {
    const advance = vi.fn();
    const { rerender } = renderHook(({ enabled }) => useAutoAdvance("q", enabled, SUCCESS_DELAY, advance), { initialProps: { enabled: true } });
    act(() => { window.dispatchEvent(new Event("pagehide")); });
    tick(10_000);
    expect(advance).not.toHaveBeenCalled();
    act(() => { window.dispatchEvent(new Event("pageshow")); });
    tick(SUCCESS_DELAY);
    expect(advance).toHaveBeenCalledTimes(1);
    rerender({ enabled: false });
    rerender({ enabled: true });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    tick(10_000);
    expect(advance).toHaveBeenCalledTimes(1);
  });
});
