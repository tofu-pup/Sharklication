import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canApplyUpdate, UPDATE_INTERVAL, watchForUpdates } from "./updates";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("safe automatic updates", () => {
  it("only applies after loading and saving, away from questions or settings", () => {
    for (const screen of ["home", "collection", "practice", "credits", "celebrate"]) {
      expect(canApplyUpdate(screen, false, true, "")).toBe(true);
      expect(canApplyUpdate(screen, true, true, "")).toBe(false);
      expect(canApplyUpdate(screen, false, false, "")).toBe(false);
      expect(canApplyUpdate(screen, false, true, "Not saved")).toBe(false);
    }
    for (const screen of ["play", "parents", "unknown"]) expect(canApplyUpdate(screen, false, true, "")).toBe(false);
  });
  it("checks on launch, reconnect, foreground and visible intervals, and removes listeners", async () => {
    const update = vi.fn().mockResolvedValue(undefined), error = vi.fn();
    const stop = watchForUpdates({ update }, error);
    await vi.advanceTimersByTimeAsync(0);
    expect(update).toHaveBeenCalledTimes(1);
    for (const event of ["online", "focus", "pageshow"]) {
      window.dispatchEvent(new Event(event));
      await vi.advanceTimersByTimeAsync(0);
    }
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(UPDATE_INTERVAL);
    expect(update).toHaveBeenCalledTimes(6);
    stop();
    window.dispatchEvent(new Event("online"));
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(UPDATE_INTERVAL);
    expect(update).toHaveBeenCalledTimes(6);
    expect(error).not.toHaveBeenCalled();
  });
  it("skips offline/hidden checks and coalesces in-flight requests", async () => {
    let resolve: () => void = () => {};
    const update = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    const stop = watchForUpdates({ update }, vi.fn());
    window.dispatchEvent(new Event("focus"));
    expect(update).toHaveBeenCalledTimes(1);
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(UPDATE_INTERVAL);
    expect(update).toHaveBeenCalledTimes(1);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(update).toHaveBeenCalledTimes(1);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(update).toHaveBeenCalledTimes(2);
    resolve(); stop();
  });
  it("reports failure and allows a later check", async () => {
    const failure = new Error("Network unavailable");
    const update = vi.fn().mockRejectedValueOnce(failure).mockResolvedValue(undefined);
    const error = vi.fn(), stop = watchForUpdates({ update }, error);
    await vi.advanceTimersByTimeAsync(0);
    expect(error).toHaveBeenCalledWith(failure);
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(update).toHaveBeenCalledTimes(2);
    stop();
  });
});
