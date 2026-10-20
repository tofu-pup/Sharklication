import { describe, expect, it } from "vitest";
import {
  ACTIVITY_IDS, RULES, addDays, advance, createInitialSave, currentQuestion, dailyPlan,
  effectiveTables, factKey, getRun, hintFor, localDateKey, markHint, nextReviewDate,
  pairKey, seededRandom, sequenceFor, startActivity, startExtra, streakForDays, submitAnswer,
  type ActivityId, type SaveEnvelope,
} from "./domain";
import { CATALOG } from "./catalog";
import { migrateSave, parseBackup, validateBackup } from "./validation";

const date = "2026-10-20";
const time = new Date("2026-10-20T12:00:00Z");
const initial = () => createInitialSave(time, seededRandom(9));
function finish(save: SaveEnvelope, activity: ActivityId, day = date) {
  let next = startActivity(save, day, activity, `${activity}-${day}`, seededRandom(4));
  while (!getRun(next, day, activity)?.complete) {
    const q = currentQuestion(getRun(next, day, activity)!)!;
    next = submitAnswer(next, day, activity, q.id, q.a * q.b, time);
    next = advance(next, day, activity, time);
  }
  return next;
}
function assessed(save: SaveEnvelope, day: string, correct = true, hint = false) {
  const next = startActivity(save, day, "dive", `assessment-${day}`, seededRandom(4));
  const run = next.days[day].tasks.dive!;
  run.questions[0].a = 7; run.questions[0].b = 8;
  const q = run.questions[0];
  return submitAnswer(hint ? markHint(next, day, "dive") : next, day, "dive", q.id, correct ? 56 : 55, time);
}

describe("calendar dates and streak rules", () => {
  it("uses configured home dates rather than UTC", () => {
    expect(localDateKey(new Date("2026-10-20T22:30:00Z"), "Europe/Oslo")).toBe("2026-10-21");
    expect(localDateKey(new Date("2026-10-20T01:00:00Z"), "America/Los_Angeles")).toBe("2026-10-19");
  });
  it("handles spring and autumn daylight saving boundaries as calendar days", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(localDateKey(new Date("2026-10-25T00:30:00Z"), "Europe/Oslo")).toBe("2026-10-25");
    expect(localDateKey(new Date("2026-10-25T01:30:00Z"), "Europe/Oslo")).toBe("2026-10-25");
  });
  it("qualifies only all three activities, once, in any order", () => {
    for (const order of [["reef", "feeding", "dive"], ["dive", "reef", "feeding"], ["feeding", "dive", "reef"]] as ActivityId[][]) {
      let save = initial();
      save = finish(save, order[0]); save = finish(save, order[1]);
      expect(save.collection).toHaveLength(0);
      expect(streakForDays(save.days, date).current).toBe(0);
      save = finish(save, order[2]);
      expect(save.collection).toHaveLength(1);
      expect(streakForDays(save.days, date).current).toBe(1);
      const duplicate = advance(save, date, order[2], time);
      expect(duplicate.collection).toHaveLength(1);
      expect(duplicate).toBe(save);
      expect(validateBackup(save)).toEqual(save);
    }
  });
  it("keeps yesterday's streak, resets after a missed date, and preserves longest/collection on clock rollback", () => {
    let save = initial();
    for (const day of ["2026-10-18", "2026-10-19"]) for (const activity of ACTIVITY_IDS) save = finish(save, activity, day);
    expect(streakForDays(save.days, "2026-10-20")).toMatchObject({ current: 2, longest: 2 });
    expect(streakForDays(save.days, "2026-10-21")).toMatchObject({ current: 0, longest: 2 });
    expect(streakForDays(save.days, "2026-10-17")).toMatchObject({ current: 0, longest: 2 });
    expect(save.collection).toHaveLength(2);
    for (const activity of ACTIVITY_IDS) save = finish(save, activity, "2026-10-21");
    expect(streakForDays(save.days, "2026-10-21")).toMatchObject({ current: 1, longest: 2 });
    expect(new Set(save.collection.map((s) => s.sharkId)).size).toBe(3);
  });
  it("keeps prior-date partial work separate at midnight", () => {
    let save = finish(initial(), "reef");
    save = startActivity(save, addDays(date, 1), "reef", "tomorrow");
    expect(save.days[date].tasks.reef?.complete).toBe(true);
    expect(save.days[addDays(date, 1)].tasks.reef?.complete).toBe(false);
    expect(save.collection).toHaveLength(0);
  });
});
describe("maths and adaptive selection", () => {
  it("generates correct, unambiguous missing multiples for all 144 factor orientations", () => {
    for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) {
      const sequence = sequenceFor({ a, b });
      const filled = sequence.map((value) => value === null ? a * b : value);
      expect(sequence.filter((v) => v === null)).toHaveLength(1);
      expect(filled.every((value, i) => i === 0 || value - filled[i - 1] === a)).toBe(true);
      expect(filled.every((value) => value >= 0 && Number.isInteger(value))).toBe(true);
      expect(hintFor({ a, b })).toContain(a === 1 ? String(b) : `${Math.floor(a / 2) * b}`);
    }
  });
  it("uses a varied first day, caps unseen pairs on later days, and stays in enabled factors", () => {
    for (let seed = 0; seed < 100; seed++) {
      const plan = dailyPlan(initial(), date, [2, 5, 10], seededRandom(seed));
      expect(new Set(plan.map(pairKey)).size).toBe(10);
      expect(new Set(plan.map((f) => f.a * f.b)).size).toBe(10);
      const experienced = finish(initial(), "reef", "2026-10-19");
      const known = new Set(Object.keys(experienced.facts).map((key) => {
        const [a, b] = key.split("x").map(Number); return pairKey({ a, b });
      }));
      const later = dailyPlan(experienced, date, [2, 5, 10], seededRandom(seed));
      expect(new Set(later.filter((f) => !known.has(pairKey(f))).map(pairKey)).size).toBeLessThanOrEqual(RULES.newPairsPerDay);
      expect(plan.every((f) => [2, 5, 10].includes(f.a) && f.b >= 1 && f.b <= 10)).toBe(true);
      const hard = dailyPlan(initial(), date, [12], seededRandom(seed));
      expect(hard.every((f) => f.a === 12 && f.b <= 12)).toBe(true);
      expect(hard).toHaveLength(10);
    }
  });
  it("uses due/weak, focus and familiar weights with empty-pool redistribution", () => {
    const save = initial();
    const secure = assessed(assessed(assessed(save, "2026-10-17"), "2026-10-18"), "2026-10-19").facts["7x8"];
    save.facts["7x8"] = { ...secure, nextReview: "2026-12-01" };
    save.facts["7x3"] = { ...secure, state: "Practising", nextReview: "2026-10-18" };
    const random = seededRandom(56);
    const plans = Array.from({ length: 1000 }, () => dailyPlan(save, date, [7], random));
    const firstPicks = plans.map((plan) => plan[0]);
    expect(firstPicks.filter((f) => factKey(f) === "7x3").length).toBeGreaterThan(500);
    expect(plans.every((plan) => new Set(plan.map(factKey)).size === 10)).toBe(true);
  });
  it("keeps checkpoints and generated questions stable on resume/settings changes", () => {
    const save = startActivity(initial(), date, "reef", "first", seededRandom(7));
    const changed = { ...save, settings: { ...save.settings, enabledTables: [7, 8] } };
    const resumed = startActivity(changed, date, "reef", "ignored", seededRandom(200));
    expect(resumed.days[date]).toEqual(save.days[date]);
  });
  it("requires three distinct independent days and the latest two independent correct assessments", () => {
    let save = assessed(initial(), "2026-10-17");
    expect(save.facts["7x8"].state).toBe("Practising");
    save = assessed(save, "2026-10-18");
    save = assessed(save, "2026-10-19");
    expect(save.facts["7x8"].state).toBe("Secure");
    expect(save.facts["7x8"].nextReview).toBe("2026-10-26");
    expect(effectiveTables(save)).toContain(2);
    save = assessed(save, date, false);
    expect(save.facts["7x8"].state).toBe("Practising");
    expect(save.facts["7x8"].nextReview).toBe("2026-10-21");
  });
  it("does not infer secure recall from hints, corrections or visual activities", () => {
    let save = initial();
    for (const day of ["2026-10-17", "2026-10-18", "2026-10-19"]) {
      save = assessed(save, day, true, true);
      save = finish(finish(save, "reef", day), "feeding", day);
    }
    expect(save.facts["7x8"].state).toBe("Practising");
    expect(save.facts["7x8"].independentAttempts).toBe(0);
    expect(Object.values(save.facts).some((f) => f.state === "Secure")).toBe(false);
  });
  it("schedules 1, 3, 7 and 14 day reviews", () => {
    expect([1, 2, 3, 4, 5].map((n) => nextReviewDate(date, n))).toEqual(["2026-10-21", "2026-10-23", "2026-10-27", "2026-11-03", "2026-11-03"]);
  });
  it("repeats missed dive facts after two intervening questions, caps delayed corrections at three, and permits assisted completion", () => {
    let save = startActivity(initial(), date, "dive", "dive", seededRandom(7));
    const first = currentQuestion(getRun(save, date, "dive")!)!;
    save = submitAnswer(save, date, "dive", first.id, 0, time);
    expect(save.days[date].tasks.dive!.questions[3].id).toBe(`${first.id}-review`);
    while (!save.days[date].tasks.dive?.complete) {
      const q = currentQuestion(getRun(save, date, "dive")!)!;
      if (q.attempts < 2) {
        save = submitAnswer(save, date, "dive", q.id, 0, time);
        continue;
      }
      save = submitAnswer(save, date, "dive", q.id, q.a * q.b, time);
      save = advance(save, date, "dive", time);
    }
    expect(save.days[date].tasks.dive!.corrections).toBe(3);
    expect(save.days[date].tasks.dive!.questions).toHaveLength(13);
    expect(save.attempts.filter((a) => a.correct && a.independent)).toHaveLength(0);
    expect(validateBackup(save)).toEqual(save);
  });
  it("rejects duplicate correct submissions and stale question IDs", () => {
    const save = startActivity(initial(), date, "reef", "reef");
    const q = currentQuestion(getRun(save, date, "reef")!)!;
    const submitted = submitAnswer(save, date, "reef", q.id, q.a * q.b, time);
    expect(submitAnswer(submitted, date, "reef", q.id, q.a * q.b, time)).toBe(submitted);
    expect(submitAnswer(save, date, "reef", "stale-id", 12, time)).toBe(save);
    expect(submitted.attempts).toHaveLength(1);
  });
  it("never gives free swim a daily star or reward", () => {
    let save = startExtra(initial(), date, "weak", "extra");
    while (!save.extra!.run.complete) {
      const q = currentQuestion(save.extra!.run)!;
      save = submitAnswer(save, date, "dive", q.id, q.a * q.b, time, true);
      save = advance(save, date, "dive", time, true);
    }
    expect(save.collection).toHaveLength(0);
    expect(save.days).toEqual({});
    expect(validateBackup(save)).toEqual(save);
  });
  it.each(ACTIVITY_IDS)("keeps extra %s practice typed, adaptive, resumable and separate from daily rewards", (activity) => {
    let save = finish(initial(), "feeding");
    const daily = structuredClone(save.days);
    save = startExtra(save, date, "mixed", "typed-extra", seededRandom(4), activity);
    expect(save.extra!.run.questions).toHaveLength(RULES[activity]);
    expect(save.extra!.run.questions.every((q) => q.activity === activity && [2, 5, 10].includes(q.a))).toBe(true);
    expect(getRun(save, date, ACTIVITY_IDS.find((id) => id !== activity)!, true)).toBeUndefined();
    while (!save.extra!.run.complete) {
      const q = currentQuestion(save.extra!.run)!;
      save = submitAnswer(save, date, activity, q.id, q.a * q.b, time, true);
      save = parseBackup(JSON.stringify(save));
      save = advance(save, date, activity, time, true);
    }
    expect(save.days).toEqual(daily);
    expect(save.collection).toHaveLength(0);
    expect(save.attempts.slice(RULES.feeding).every((a) => a.activity === activity && a.independent === (activity === "dive"))).toBe(true);
    expect(validateBackup(save)).toEqual(save);
  });
  it("prioritizes due facts automatically in extra practice of every type", () => {
    const base = assessed(initial(), date, false);
    base.settings.enabledTables = [7];
    for (const activity of ACTIVITY_IDS) {
      const save = startExtra(base, date, "mixed", activity, seededRandom(7), activity);
      expect(save.extra!.run.questions.every((q) => q.a === 7 && q.activity === activity)).toBe(true);
      expect(save.extra!.run.questions.some((q) => q.a === 7 && q.b === 8)).toBe(true);
    }
  });
  it("awards each shark once then badges without losing prior discoveries", () => {
    let save = initial();
    for (let d = 0; d < CATALOG.length + 2; d++) {
      const day = addDays(date, d);
      for (const activity of ACTIVITY_IDS) save = finish(save, activity, day);
    }
    expect(save.collection).toHaveLength(CATALOG.length);
    expect(new Set(save.collection.map((entry) => entry.sharkId)).size).toBe(CATALOG.length);
    expect(save.days[addDays(date, CATALOG.length)].rewardId).toBe("ocean-explorer");
    expect(validateBackup(save)).toEqual(save);
  });
});
describe("backup validation and version boundaries", () => {
  it("keeps a legacy extra dive checkpoint intact without adding a new save field", () => {
    let legacy = startExtra(initial(), date, "mixed", "legacy-extra", seededRandom(2));
    const q = currentQuestion(legacy.extra!.run)!;
    legacy = submitAnswer(legacy, date, "dive", q.id, q.a * q.b, time, true);
    legacy = advance(legacy, date, "dive", time, true);
    expect(parseBackup(JSON.stringify(legacy))).toEqual(legacy);
    expect(legacy.extra!.run.index).toBe(1);
  });
  it("rejects extra runs that mix activity types or have invalid lengths or corrections", () => {
    const save = startExtra(initial(), date, "mixed", "extra", seededRandom(2), "feeding");
    const mixed = structuredClone(save);
    mixed.extra!.run.questions[1].activity = "dive";
    expect(() => validateBackup(mixed)).toThrow();
    const wrongSize = structuredClone(save);
    wrongSize.extra!.run.questions.pop();
    expect(() => validateBackup(wrongSize)).toThrow();
    const corrected = structuredClone(save);
    const q = corrected.extra!.run.questions[0];
    corrected.extra!.run.questions.push({ ...q, id: `${q.id}-review`, correction: true });
    corrected.extra!.run.corrections = 1;
    expect(() => validateBackup(corrected)).toThrow();
  });
  it("round trips a partially completed save and the released schema", () => {
    const save = finish(initial(), "feeding");
    expect(parseBackup(JSON.stringify(save))).toEqual(save);
    expect(migrateSave(save)).toEqual(save);
  });
  it("upgrades repeated-question playtest saves without changing submitted work or checkpoints", () => {
    const save = startActivity(initial(), date, "reef", "old-run");
    delete save.samplingVersion;
    const run = save.days[date].tasks.reef!;
    run.questions.forEach((q) => { q.a = 2; q.b = 7; });
    const first = run.questions[0];
    const submitted = submitAnswer(save, date, "reef", first.id, 14, time);
    const migrated = migrateSave(submitted);
    expect(migrated.attempts).toEqual(submitted.attempts);
    expect(migrated.days[date].tasks.reef!.questions[0]).toEqual(submitted.days[date].tasks.reef!.questions[0]);
    expect(migrated.days[date].tasks.reef!.index).toBe(0);
    expect(new Set(migrated.days[date].tasks.reef!.questions.map((q) => q.a * q.b)).size).toBeGreaterThan(3);
    expect(migrateSave(migrated)).toEqual(migrated);
  });
  it("appends new catalog IDs without reshuffling an older collection order", () => {
    const save = initial();
    save.rewardOrder = save.rewardOrder.slice(0, 3);
    const migrated = migrateSave(save);
    expect(migrated.rewardOrder.slice(0, 3)).toEqual(save.rewardOrder);
    expect(migrated.rewardOrder).toHaveLength(CATALOG.length);
  });
  it("extends an exhausted eighteen-shark album and keeps earned rewards, attempts and checkpoints", () => {
    let legacy = initial();
    const originalIds = new Set(CATALOG.slice(0, 18).map((shark) => shark.id));
    legacy.rewardOrder = legacy.rewardOrder.filter((id) => originalIds.has(id));
    for (let day = 0; day < 18; day++) {
      for (const activity of ACTIVITY_IDS) legacy = finish(legacy, activity, addDays("2026-09-01", day));
    }
    expect(legacy.collection).toHaveLength(18);
    const migrated = parseBackup(JSON.stringify(legacy));
    expect(migrated.rewardOrder.slice(0, 18)).toEqual(legacy.rewardOrder);
    expect(migrated.rewardOrder.slice(18)).toEqual(CATALOG.slice(18).map((shark) => shark.id));
    expect(migrated.collection).toEqual(legacy.collection);
    expect(migrated.attempts).toEqual(legacy.attempts);
    expect(migrated.days).toEqual(legacy.days);
    expect(migrated.facts).toEqual(legacy.facts);
    expect(migrateSave(migrated)).toEqual(migrated);
    let next = migrated;
    for (const activity of ACTIVITY_IDS) next = finish(next, activity, "2026-09-19");
    expect(next.collection).toHaveLength(19);
    expect(next.collection.at(-1)?.sharkId).toBe("great-white-shark");
    expect(validateBackup(next)).toEqual(next);
  });
  it.each([
    (s: SaveEnvelope) => ({ ...s, schemaVersion: 999 }),
    (s: SaveEnvelope) => ({ ...s, settings: { ...s.settings, enabledTables: [] } }),
    (s: SaveEnvelope) => ({ ...s, settings: { ...s.settings, enabledTables: [13] } }),
    (s: SaveEnvelope) => ({ ...s, settings: { ...s.settings, homeTimezone: "Not/AZone" } }),
    (s: SaveEnvelope) => ({ ...s, collection: [{ sharkId: "invented-shark", unlockedAt: time.toISOString(), rewardDate: date }] }),
    (s: SaveEnvelope) => ({ ...s, days: { "2026-02-31": { plan: [], tasks: {} } } }),
  ])("rejects corrupt or unsupported imports before replacing data", (mutate) => {
    const save = initial();
    expect(() => validateBackup(mutate(save))).toThrow();
    expect(save.days).toEqual({});
  });
  it("rejects fabricated completions, duplicate rewards and invalid maths", () => {
    let save = initial();
    for (const activity of ACTIVITY_IDS) save = finish(save, activity);
    const duplicate = structuredClone(save);
    duplicate.collection.push(duplicate.collection[0]);
    expect(() => validateBackup(duplicate)).toThrow();
    const partial = structuredClone(save);
    partial.days[date].tasks.reef!.complete = false;
    expect(() => validateBackup(partial)).toThrow();
    save.attempts[0].correct = !save.attempts[0].correct;
    expect(() => validateBackup(save)).toThrow();
    expect(() => parseBackup("{")).toThrow(/JSON/);
  });
});
