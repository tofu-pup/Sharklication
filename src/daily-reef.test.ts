import { describe, expect, it } from "vitest";
import { advance, createInitialSave, currentQuestion, getRun, localDateKey, markHint, seededRandom, solvedToday, startActivity, startExtra, submitAnswer } from "./domain";
import { parseBackup } from "./validation";

const now = new Date("2026-10-20T12:00:00Z");
const date = "2026-10-20";
const initial = () => startActivity(createInitialSave(now, seededRandom(4)), date, "dive", "daily", seededRandom(9));

describe("daily reef counters", () => {
  it("counts a solved question once, including supported answers and review, but never mistakes", () => {
    let save = initial();
    const q = currentQuestion(getRun(save, date, "dive")!)!;
    expect(solvedToday(save, date)).toEqual({ reef: 0, feeding: 0, dive: 0 });
    save = submitAnswer(save, date, "dive", q.id, 0, now);
    expect(solvedToday(save, date).dive).toBe(0);
    save = submitAnswer(save, date, "dive", q.id, q.a * q.b, now);
    expect(save.attempts.at(-1)?.independent).toBe(false);
    expect(solvedToday(save, date).dive).toBe(1);
    const resolved = save;
    save = submitAnswer(save, date, "dive", q.id, q.a * q.b, now);
    expect(save).toBe(resolved);
    expect(solvedToday(save, date).dive).toBe(1);
    // Even a repeated correct attempt record must not add a second resident.
    expect(solvedToday({ ...save, attempts: [...save.attempts, { ...save.attempts.at(-1)!, id: `${q.id}:99` }] }, date).dive).toBe(1);
    while (!save.days[date].tasks.dive!.complete) {
      const current = currentQuestion(save.days[date].tasks.dive!)!;
      save = submitAnswer(save, date, "dive", current.id, current.a * current.b, now);
      save = advance(save, date, "dive", now, false, current.id);
    }
    expect(solvedToday(save, date).dive).toBe(11);
    expect(save.collection).toHaveLength(0);
    expect(save.days[date].completedAt).toBeUndefined();
  });

  it("retains all extra sessions and separate activity totals across backup/reload without affecting rewards", () => {
    let save = initial();
    for (const activity of ["reef", "feeding", "dive", "feeding"] as const) {
      save = startExtra(save, date, "mixed", `extra-${activity}-${save.attempts.length}`, seededRandom(5), activity);
      const q = currentQuestion(save.extra!.run)!;
      save = markHint(save, date, activity, true);
      save = submitAnswer(save, date, activity, q.id, q.a * q.b, now, true);
    }
    expect(solvedToday(save, date)).toEqual({ reef: 1, feeding: 2, dive: 1 });
    const restored = parseBackup(JSON.stringify(save));
    expect(solvedToday(restored, date)).toEqual(solvedToday(save, date));
    expect(restored.days[date].tasks.dive!.index).toBe(0);
    expect(restored.collection).toHaveLength(0);
    expect(restored.facts[`${save.attempts.at(-1)!.a}x${save.attempts.at(-1)!.b}`].state).not.toBe("Secure");
  });

  it("uses saved home-date keys, including midnight and DST boundaries, without erasing earlier reefs", () => {
    let save = initial();
    const q = currentQuestion(save.days[date].tasks.dive!)!;
    save = submitAnswer(save, date, "dive", q.id, q.a * q.b, now);
    const midnight = localDateKey(new Date("2026-10-20T22:01:00Z"), "Europe/Oslo");
    expect(solvedToday(save, midnight)).toEqual({ reef: 0, feeding: 0, dive: 0 });
    expect(solvedToday(save, date).dive).toBe(1);
    const before = localDateKey(new Date("2026-10-25T00:30:00Z"), "Europe/Oslo");
    const after = localDateKey(new Date("2026-10-25T01:30:00Z"), "Europe/Oslo");
    expect(before).toBe(after);
    save = startActivity(save, before, "feeding", "dst", seededRandom(2));
    const dstQuestion = currentQuestion(save.days[before].tasks.feeding!)!;
    save = submitAnswer(save, before, "feeding", dstQuestion.id, dstQuestion.a * dstQuestion.b, new Date("2026-10-25T00:30:00Z"));
    expect(solvedToday(save, after).feeding).toBe(1);
  });

  it("rejects stale manual/automatic next events even when the following question is also resolved", () => {
    let save = initial();
    const first = currentQuestion(save.days[date].tasks.dive!)!;
    save = submitAnswer(save, date, "dive", first.id, first.a * first.b, now);
    save = advance(save, date, "dive", now, false, first.id);
    const second = currentQuestion(save.days[date].tasks.dive!)!;
    save = submitAnswer(save, date, "dive", second.id, second.a * second.b, now);
    expect(advance(save, date, "dive", now, false, first.id)).toBe(save);
    expect(save.days[date].tasks.dive!.index).toBe(1);
    expect(advance(save, date, "dive", now, false, second.id).days[date].tasks.dive!.index).toBe(2);
  });
});
