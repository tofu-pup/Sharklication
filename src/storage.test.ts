import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialSave, startActivity, submitAnswer, currentQuestion, getRun } from "./domain";
import { storage } from "./storage";

beforeEach(() => vi.stubGlobal("indexedDB", new IDBFactory()));
describe("transactional IndexedDB storage", () => {
  it("restores submitted work and checkpoints after a new load", async () => {
    let save = await storage.load();
    save = startActivity(save, "2026-10-20", "reef", "run");
    const q = currentQuestion(getRun(save, "2026-10-20", "reef")!)!;
    save = submitAnswer(save, "2026-10-20", "reef", q.id, q.a * q.b, new Date());
    const persisted = await storage.save(save, 0);
    expect(await storage.load()).toEqual(persisted);
    expect((await storage.load()).attempts).toHaveLength(1);
  });
  it("detects concurrent tab updates rather than overwriting", async () => {
    const first = await storage.save(createInitialSave(), 0);
    const changed = await storage.save({ ...first, profile: { ...first.profile, name: "Changed" } }, first.revision);
    await expect(storage.save(first, first.revision)).rejects.toThrow(/another tab/);
    expect(await storage.load()).toEqual(changed);
  });
  it("validates before saving and preserves the last transaction", async () => {
    const saved = await storage.save(createInitialSave(), 0);
    const bad = { ...saved, settings: { ...saved.settings, enabledTables: [] } };
    await expect(storage.save(bad, saved.revision)).rejects.toThrow();
    expect(await storage.load()).toEqual(saved);
  });
  it("surfaces a denied storage write without success-shaped fallback", async () => {
    const saved = await storage.save(createInitialSave(), 0);
    const open = vi.spyOn(indexedDB, "open").mockImplementation(() => { throw new DOMException("Quota", "QuotaExceededError"); });
    await expect(storage.save(saved, saved.revision)).rejects.toThrow(/Quota/);
    open.mockRestore();
    expect(await storage.load()).toEqual(saved);
  });
});
