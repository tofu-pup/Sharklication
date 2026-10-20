import { describe, expect, it } from "vitest";
import { ACTIVITY_IDS, advance, createInitialSave, currentQuestion, getRun, seededRandom, startActivity, startExtra, submitAnswer, type ActivityId, type SaveEnvelope } from "./domain";
import { migrateSave, parseBackup, validateBackup } from "./validation";

const now = new Date("2026-10-21T12:00:00Z"), date = "2026-10-21";
const initial = () => createInitialSave(now, seededRandom(4));
function finish(save: SaveEnvelope, activity: ActivityId, extra = false, id = `${activity}-${save.attempts.length}`) {
  save = extra ? startExtra(save, date, "mixed", id, seededRandom(5), activity) : startActivity(save, date, activity, id, seededRandom(5));
  while (!getRun(save, date, activity, extra)!.complete) {
    const q = currentQuestion(getRun(save, date, activity, extra)!)!;
    save = submitAnswer(save, date, activity, q.id, q.a * q.b, now, extra);
    save = advance(save, date, activity, now, extra, q.id);
  }
  return save;
}
describe("one bonus neighbour per completed extra set", () => {
  it("daily completion unlocks empty aquariums without awarding animals", () => {
    let save = initial();
    for (const activity of ACTIVITY_IDS) save = finish(save, activity);
    expect(save.bonusCompletions).toBeUndefined();
    expect(save.collection).toHaveLength(1);
    expect(parseBackup(JSON.stringify(save))).toEqual(save);
  });
  it.each(ACTIVITY_IDS)("awards one %s friend atomically with the final checkpoint, never for partial work", (activity) => {
    let save = startExtra(initial(), date, "mixed", "bonus", seededRandom(9), activity);
    const run = save.extra!.run;
    for (let i = 0; i < run.questions.length; i++) {
      const q = currentQuestion(save.extra!.run)!;
      save = submitAnswer(save, date, activity, q.id, q.a * q.b, now, true);
      expect(save.bonusCompletions ?? []).toHaveLength(0);
      save = advance(save, date, activity, now, true, q.id);
    }
    expect(save.extra!.run.complete).toBe(true);
    expect(save.bonusCompletions).toEqual([{ runId: "bonus", date, activity, completedAt: now.toISOString() }]);
    expect(advance(save, date, activity, now, true)).toBe(save);
    expect(parseBackup(JSON.stringify(save))).toEqual(save);
    expect(save.days).toEqual({});
    expect(save.collection).toHaveLength(0);
  });
  it("requires dive corrections too and does not add a friend for each answer", () => {
    let save = startExtra(initial(), date, "mixed", "review", seededRandom(2));
    const first = currentQuestion(save.extra!.run)!;
    save = submitAnswer(save, date, "dive", first.id, 0, now, true);
    while (!save.extra!.run.complete) {
      const q = currentQuestion(save.extra!.run)!;
      save = submitAnswer(save, date, "dive", q.id, q.a * q.b, now, true);
      expect(save.bonusCompletions ?? []).toHaveLength(0);
      save = advance(save, date, "dive", now, true, q.id);
    }
    expect(save.extra!.run.questions).toHaveLength(11);
    expect(save.bonusCompletions).toHaveLength(1);
    expect(parseBackup(JSON.stringify(save))).toEqual(save);
    const invalid = structuredClone(save);
    invalid.attempts = invalid.attempts.filter((attempt) => !attempt.correction);
    expect(() => validateBackup(invalid)).toThrow(/inconsistent/);
  });
  it("preserves more than twelve friends across replaced checkpoints, backup and new-day filtering", () => {
    let save = initial();
    for (let i = 0; i < 20; i++) save = finish(save, "feeding", true, `bonus-${i}`);
    expect(save.bonusCompletions).toHaveLength(20);
    save = finish(save, "reef", true, "other-habitat");
    const restored = parseBackup(JSON.stringify(save));
    expect(restored.bonusCompletions).toHaveLength(21);
    expect(restored.bonusCompletions!.filter((entry) => entry.date === date && entry.activity === "feeding")).toHaveLength(20);
    expect(restored.bonusCompletions!.filter((entry) => entry.date === "2026-10-22")).toHaveLength(0);
    expect(restored.collection).toHaveLength(0);
  });
  it("keeps legacy progress without inventing animals from old daily or extra attempts", () => {
    let legacy = finish(initial(), "feeding", true);
    delete legacy.bonusCompletions;
    expect(migrateSave(legacy)).toEqual(legacy);
    expect(migrateSave(legacy).bonusCompletions).toBeUndefined();
  });
  it("rejects duplicate, forged, daily-task and incomplete rewards in backups", () => {
    const valid = finish(initial(), "feeding", true, "bonus");
    const duplicate = structuredClone(valid);
    duplicate.bonusCompletions!.push(duplicate.bonusCompletions![0]);
    expect(() => validateBackup(duplicate)).toThrow();
    const forged = structuredClone(valid);
    forged.bonusCompletions![0].runId = "missing";
    expect(() => validateBackup(forged)).toThrow();
    const daily = finish(initial(), "feeding");
    daily.bonusCompletions = [{ runId: daily.days[date].tasks.feeding!.id, date, activity: "feeding", completedAt: now.toISOString() }];
    expect(() => validateBackup(daily)).toThrow();
    const unfinished = structuredClone(valid);
    unfinished.extra!.run.complete = false;
    unfinished.extra!.run.index--;
    expect(() => validateBackup(unfinished)).toThrow();
  });
});
