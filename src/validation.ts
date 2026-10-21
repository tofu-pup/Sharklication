import { z } from "zod";
import { CATALOG } from "./catalog";
import { ACTIVITY_IDS, RULES, isDayComplete, upgradeSampling, type SaveEnvelope } from "./domain";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");
const timestamp = z.iso.datetime();
const count = z.number().int().min(0).max(100_000);
const factor = z.number().int().min(1).max(12);
const id = z.string().min(1).max(200);
const activity = z.enum(ACTIVITY_IDS);
const fact = z.object({ a: factor, b: factor }).strict();
const question = fact.extend({
  id, activity, correction: z.boolean(), attempts: count,
  hinted: z.boolean(), resolved: z.boolean(),
}).strict();
const task = z.object({
  id, questions: z.array(question).min(1).max(13),
  index: z.number().int().min(0).max(13), corrections: z.number().int().min(0).max(3), complete: z.boolean(),
}).strict().superRefine((run, ctx) => {
  if (run.complete !== (run.index === run.questions.length) || run.index > run.questions.length) {
    ctx.addIssue({ code: "custom", message: "Invalid checkpoint" });
  }
  if (run.questions.some((q, i) => i < run.index && !q.resolved)
    || run.corrections !== run.questions.filter((q) => q.correction).length
    || new Set(run.questions.map((q) => q.id)).size !== run.questions.length) {
    ctx.addIssue({ code: "custom", message: "Invalid question progress" });
  }
});
const daily = z.object({
  plan: z.array(fact).length(10),
  tasks: z.object({ reef: task.optional(), feeding: task.optional(), dive: task.optional() }).strict(),
  completedAt: timestamp.optional(), rewardId: id.optional(),
}).strict();
const factProgress = z.object({
  independentAttempts: count, independentCorrect: count, assistedAttempts: count,
  successfulDates: z.array(dateKey).max(100_000),
  outcomes: z.array(z.object({ date: dateKey, independent: z.boolean(), correct: z.boolean() }).strict()).max(20),
  nextReview: dateKey, state: z.enum(["New", "Practising", "Secure"]),
}).strict().refine((f) => f.independentCorrect <= f.independentAttempts && new Set(f.successfulDates).size === f.successfulDates.length, "Invalid fact statistics");
const backupSchema = z.object({
  schemaVersion: z.literal(1),
  samplingVersion: z.literal(2).optional(),
  revision: count,
  profile: z.object({ name: z.string().trim().min(1).max(40), createdAt: timestamp, welcomed: z.boolean() }).strict(),
  settings: z.object({
    homeTimezone: z.string().max(100).refine((timezone) => {
      try { new Intl.DateTimeFormat("en", { timeZone: timezone }); return true; } catch { return false; }
    }, "Unknown timezone"),
    enabledTables: z.array(factor).min(1).max(12).refine((tables) => new Set(tables).size === tables.length),
    autoUnlock: z.boolean(), soundEnabled: z.boolean(), reducedMotion: z.boolean(),
  }).strict(),
  days: z.record(dateKey, daily),
  facts: z.record(z.string().regex(/^(?:[1-9]|1[0-2])x(?:[1-9]|1[0-2])$/), factProgress),
  attempts: z.array(fact.extend({
    id, timestamp, date: dateKey, activity, answer: z.number().int().min(0).max(144),
    correct: z.boolean(), hinted: z.boolean(), correction: z.boolean(), firstAttempt: z.boolean(), independent: z.boolean(),
  }).strict()).max(100_000),
  collection: z.array(z.object({ sharkId: id, unlockedAt: timestamp, rewardDate: dateKey }).strict()).max(CATALOG.length),
  rewardOrder: z.array(id).min(1).max(CATALOG.length),
  extra: z.object({ date: dateKey, run: task }).strict().optional(),
  bonusCompletions: z.array(z.object({ runId: id, date: dateKey, activity, completedAt: timestamp }).strict()).optional(),
}).strict();

export function validateBackup(value: unknown): SaveEnvelope {
  const result = backupSchema.safeParse(value);
  if (!result.success) throw new Error(`Invalid or unsupported backup: ${result.error.issues[0]?.message ?? "check its format"}. Existing progress has not changed.`);
  const save = result.data;
  const ids = new Set(CATALOG.map((s) => s.id));
  const fail = () => { throw new Error("The backup contains inconsistent progress or unknown shark IDs. Existing progress has not changed."); };
  if (new Set(save.rewardOrder).size !== save.rewardOrder.length || save.rewardOrder.some((id) => !ids.has(id))) fail();
  if (Object.keys(save.days).length > 30_000 || Object.keys(save.facts).length > 144) fail();
  if (new Set(save.attempts.map((a) => a.id)).size !== save.attempts.length) fail();
  if (save.bonusCompletions) {
    if (new Set(save.bonusCompletions.map((entry) => entry.runId)).size !== save.bonusCompletions.length) fail();
    const correct = new Set(save.attempts.filter((attempt) => attempt.correct).map((attempt) => `${attempt.date}/${attempt.activity}/${attempt.id.slice(0, attempt.id.lastIndexOf(":"))}`));
    const requiredReviews = new Map<string, string[]>();
    for (const attempt of save.attempts) {
      if (attempt.activity !== "dive" || attempt.correct || !attempt.firstAttempt || attempt.correction) continue;
      const questionId = attempt.id.slice(0, attempt.id.lastIndexOf(":"));
      const runId = questionId.slice(0, questionId.lastIndexOf("-"));
      const key = `${attempt.date}/${attempt.activity}/${runId}`;
      const reviews = requiredReviews.get(key) ?? [];
      if (reviews.length < RULES.maxCorrections) reviews.push(questionId);
      requiredReviews.set(key, reviews);
    }
    for (const entry of save.bonusCompletions) {
      const prefix = `${entry.date}/${entry.activity}/`;
      // Every primary question needs a durable correct answer before its set can earn a friend.
      for (let i = 0; i < RULES[entry.activity]; i++) {
        if (!correct.has(`${prefix}${entry.runId}-${i}`)) fail();
      }
      if ((requiredReviews.get(`${prefix}${entry.runId}`) ?? []).some((questionId) => !correct.has(`${prefix}${questionId}-review`))) fail();
      if (save.days[entry.date] && Object.values(save.days[entry.date].tasks).some((run) => run?.id === entry.runId)) fail();
      if (save.extra?.run.id === entry.runId && (!save.extra.run.complete || save.extra.date !== entry.date || save.extra.run.questions[0].activity !== entry.activity)) fail();
    }
  }
  if (save.attempts.some((a) => a.correct !== (a.answer === a.a * a.b) || (a.independent && (a.activity !== "dive" || !a.firstAttempt || a.hinted || a.correction)))) fail();
  if (new Set(save.collection.map((c) => c.sharkId)).size !== save.collection.length
    || new Set(save.collection.map((c) => c.rewardDate)).size !== save.collection.length) fail();
  for (const [date, day] of Object.entries(save.days)) {
    for (const activity of ACTIVITY_IDS) {
      const run = day.tasks[activity];
      if (run && (run.questions.some((q) => q.activity !== activity)
        || run.questions.filter((q) => !q.correction).length !== RULES[activity]
        || (activity !== "dive" && run.corrections !== 0))) fail();
    }
    if (isDayComplete(day) !== !!day.completedAt || !!day.completedAt !== !!day.rewardId) fail();
    if (day.rewardId && day.rewardId !== "ocean-explorer" && !save.collection.some((c) => c.rewardDate === date && c.sharkId === day.rewardId)) fail();
  }
  for (const entry of save.collection) {
    if (!ids.has(entry.sharkId) || !save.rewardOrder.includes(entry.sharkId) || save.days[entry.rewardDate]?.rewardId !== entry.sharkId || !isDayComplete(save.days[entry.rewardDate])) fail();
  }
  if (save.extra) {
    const run = save.extra.run, activity = run.questions[0].activity;
    if (run.questions.some((q) => q.activity !== activity)
      || run.questions.filter((q) => !q.correction).length !== RULES[activity]
      || (activity !== "dive" && run.corrections !== 0)) fail();
  }
  return save;
}
export function migrateSave(value: unknown): SaveEnvelope {
  // Keep legacy rewardOrder data intact for backup compatibility while adding new catalog IDs.
  const save = validateBackup(value);
  const missing = CATALOG.map((s) => s.id).filter((id) => !save.rewardOrder.includes(id));
  return upgradeSampling({ ...save, rewardOrder: [...save.rewardOrder, ...missing] });
}
export function parseBackup(text: string): SaveEnvelope {
  if (text.length > 15_000_000) throw new Error("This backup exceeds the 15 MB import limit.");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error("This file is not valid JSON. Existing progress has not changed."); }
  return migrateSave(value);
}
