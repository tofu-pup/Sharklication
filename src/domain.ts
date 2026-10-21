import { CATALOG, rewardOrder } from "./catalog";

export const ACTIVITY_IDS = ["reef", "feeding", "dive"] as const;
export type ActivityId = (typeof ACTIVITY_IDS)[number];
export type FactState = "New" | "Practising" | "Secure";
export type Fact = { a: number; b: number };
export const RULES = { reef: 6, feeding: 3, dive: 10, newPairsPerDay: 3, maxCorrections: 3 };
export const ACTIVITY_INFO = {
  reef: { title: "Reef Trail", subtitle: "Follow the pattern. Find the next step.", icon: "🪸", tag: "PATTERNS", minutes: "6 little discoveries" },
  feeding: { title: "Feeding Time", subtitle: "A few hungry friends. Equal shares.", icon: "🐟", tag: "UNDERSTANDING", minutes: "3 tasty puzzles" },
  dive: { title: "Discovery Dive", subtitle: "Put your times-table skills to the test.", icon: "🤿", tag: "RECALL", minutes: "10 mixed questions" },
} as const;

export interface Settings {
  homeTimezone: string;
  enabledTables: number[];
  autoUnlock: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
}
export interface Question extends Fact {
  id: string;
  activity: ActivityId;
  correction: boolean;
  attempts: number;
  hinted: boolean;
  resolved: boolean;
}
export interface TaskRun {
  id: string;
  questions: Question[];
  index: number;
  corrections: number;
  complete: boolean;
}
export interface DailyRecord {
  plan: Fact[];
  tasks: Partial<Record<ActivityId, TaskRun>>;
  completedAt?: string;
  rewardId?: string;
}
export interface FactProgress {
  independentAttempts: number;
  independentCorrect: number;
  assistedAttempts: number;
  successfulDates: string[];
  outcomes: Array<{ date: string; independent: boolean; correct: boolean }>;
  nextReview: string;
  state: FactState;
}
export interface Attempt extends Fact {
  id: string;
  timestamp: string;
  date: string;
  activity: ActivityId;
  answer: number;
  correct: boolean;
  hinted: boolean;
  independent: boolean;
  correction: boolean;
  firstAttempt: boolean;
}
export interface SaveEnvelope {
  schemaVersion: 1;
  samplingVersion?: 2;
  revision: number;
  profile: { name: string; createdAt: string; welcomed: boolean };
  settings: Settings;
  days: Record<string, DailyRecord>;
  facts: Record<string, FactProgress>;
  attempts: Attempt[];
  collection: Array<{ sharkId: string; unlockedAt: string; rewardDate: string }>;
  rewardOrder: string[];
  extra?: { date: string; run: TaskRun };
  bonusCompletions?: Array<{ runId: string; date: string; activity: ActivityId; completedAt: string }>;
}

export function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
export function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createInitialSave(now = new Date(), random = Math.random): SaveEnvelope {
  return {
    schemaVersion: 1,
    samplingVersion: 2,
    revision: 0,
    profile: { name: "Lily", createdAt: now.toISOString(), welcomed: false },
    settings: { homeTimezone: "Europe/Oslo", enabledTables: [2, 5, 10], autoUnlock: true, soundEnabled: false, reducedMotion: false },
    days: {}, facts: {}, attempts: [], collection: [],
    rewardOrder: rewardOrder(random),
  };
}
export function localDateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function addDays(key: string, amount: number): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}
export function isDayComplete(day?: DailyRecord): boolean {
  return !!day && ACTIVITY_IDS.every((id) => day.tasks[id]?.complete);
}
export function streakForDays(days: Record<string, DailyRecord>, today: string) {
  const dates = Object.keys(days).filter((key) => isDayComplete(days[key])).sort();
  let longest = 0, run = 0, previous: string | undefined;
  for (const date of dates) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  let cursor = isDayComplete(days[today]) ? today : addDays(today, -1);
  let current = 0;
  while (dates.includes(cursor)) { current++; cursor = addDays(cursor, -1); }
  return { current, longest, days: dates.length };
}
export const factKey = ({ a, b }: Fact) => `${a}x${b}`;
export const pairKey = ({ a, b }: Fact) => `${Math.min(a, b)}x${Math.max(a, b)}`;
export function nextReviewDate(date: string, successes: number): string {
  return addDays(date, [1, 3, 7, 14][Math.min(Math.max(successes - 1, 0), 3)]);
}
export function effectiveTables(save: SaveEnvelope): number[] {
  const tables = [...save.settings.enabledTables];
  if (save.settings.autoUnlock) {
    const secure = Object.values(save.facts).filter((f) => f.state === "Secure").length;
    for (const table of [3, 4, 6, 7, 8, 9, 1].slice(0, Math.floor(secure / 3))) {
      if (!tables.includes(table)) tables.push(table);
    }
  }
  return tables.sort((a, b) => a - b);
}

// One shared daily pool caps new commutative pairs across all three activities.
export function dailyPlan(save: SaveEnvelope, date: string, tables: number[], random = Math.random): Fact[] {
  const max = tables.some((t) => t > 10) ? 12 : 10;
  const candidates = tables.flatMap((a) => Array.from({ length: max }, (_, i) => ({ a, b: i + 1 })));
  const knownPairs = new Set(Object.keys(save.facts).map((key) => {
    const [a, b] = key.split("x").map(Number);
    return pairKey({ a, b });
  }));
  const firstDay = Object.keys(save.days).length === 0
    || (Object.keys(save.days).length === 1 && !!save.days[date]);
  const limit = firstDay ? 10 : RULES.newPairsPerDay;
  const newPairs = new Set<string>();
  const products = new Set<number>();
  for (let round = 0; round < max && newPairs.size < limit; round++) {
    for (const table of shuffle(tables, random)) {
      const options = shuffle(candidates.filter((f) => f.a === table && !knownPairs.has(pairKey(f)) && !newPairs.has(pairKey(f))), random);
      const fact = options.find((f) => !products.has(f.a * f.b)) ?? options[0];
      if (fact) { newPairs.add(pairKey(fact)); products.add(fact.a * fact.b); }
      if (newPairs.size >= limit) break;
    }
  }
  const allowed = candidates.filter((f) => knownPairs.has(pairKey(f)) || newPairs.has(pairKey(f)));
  const weak = allowed.filter((f) => {
    const progress = save.facts[factKey(f)];
    return progress && (progress.nextReview <= date || progress.state !== "Secure");
  });
  const focus = allowed.filter((f) => !save.facts[factKey(f)] || save.settings.enabledTables.includes(f.a));
  const familiar = allowed.filter((f) => save.facts[factKey(f)]?.state === "Secure");
  return rotateFacts(allowed, 10, random, [weak, focus, familiar]);
}

export function rotateFacts(allowed: Fact[], count: number, random = Math.random, pools = [allowed, allowed, allowed]): Fact[] {
  const unique = [...new Map(allowed.map((f) => [factKey(f), f])).values()];
  const used = new Map<string, number>();
  const products = new Map<number, number>();
  const result: Fact[] = [];
  for (let i = 0; i < count; i++) {
    const leastUsed = Math.min(...unique.map((f) => used.get(factKey(f)) ?? 0));
    let eligible = unique.filter((f) => (used.get(factKey(f)) ?? 0) === leastUsed);
    const previous = result.at(-1);
    const differentAnswer = eligible.filter((f) => !previous || f.a * f.b !== previous.a * previous.b);
    if (differentAnswer.length) eligible = differentAnswer;
    const leastProduct = Math.min(...eligible.map((f) => products.get(f.a * f.b) ?? 0));
    eligible = eligible.filter((f) => (products.get(f.a * f.b) ?? 0) === leastProduct);
    const pick = random();
    const selected = pools[pick < 0.6 ? 0 : pick < 0.85 ? 1 : 2];
    const matches = eligible.filter((f) => selected.some((candidate) => factKey(candidate) === factKey(f)));
    const pool = matches.length ? matches : eligible;
    const chosen = pool[Math.floor(random() * pool.length)];
    result.push({ ...chosen });
    used.set(factKey(chosen), (used.get(factKey(chosen)) ?? 0) + 1);
    products.set(chosen.a * chosen.b, (products.get(chosen.a * chosen.b) ?? 0) + 1);
  }
  return result;
}

export function makeRun(activity: ActivityId, plan: Fact[], id: string, offset = activity === "feeding" ? 6 : activity === "dive" ? 9 : 0): TaskRun {
  return {
    id, index: 0, complete: false, corrections: 0,
    questions: Array.from({ length: RULES[activity] }, (_, i) => ({
      ...plan[(i + offset) % plan.length], id: `${id}-${i}`, activity, correction: false,
      attempts: 0, hinted: false, resolved: false,
    })),
  };
}
export function startActivity(save: SaveEnvelope, date: string, activity: ActivityId, id: string, random = Math.random): SaveEnvelope {
  const next = structuredClone(save);
  next.days[date] ??= { plan: dailyPlan(save, date, effectiveTables(save), random), tasks: {} };
  next.days[date].tasks[activity] ??= makeRun(activity, next.days[date].plan, id);
  return next;
}
export function startExtra(save: SaveEnvelope, date: string, mode: "weak" | "mixed" | number, id: string, random = Math.random, activity: ActivityId = "dive"): SaveEnvelope {
  const next = structuredClone(save);
  const tables = typeof mode === "number" ? [mode] : effectiveTables(save);
  let plan = dailyPlan(save, date, tables, random);
  if (mode === "weak") {
    const weak = Object.entries(save.facts).filter(([key, f]) => tables.includes(Number(key.split("x")[0])) && (f.state !== "Secure" || f.nextReview <= date));
    if (weak.length) plan = Array.from({ length: 10 }, (_, i) => {
      const [a, b] = weak[i % weak.length][0].split("x").map(Number);
      return { a, b };
    });
  }
  const reviewIndex = plan.findIndex((fact) => {
    const progress = save.facts[factKey(fact)];
    return progress && (progress.nextReview <= date || progress.state !== "Secure");
  });
  if (reviewIndex > 0) plan = [...plan.slice(reviewIndex), ...plan.slice(0, reviewIndex)];
  next.extra = { date, run: makeRun(activity, plan, id, 0) };
  return next;
}
export function currentQuestion(run: TaskRun): Question | undefined { return run.questions[run.index]; }
export function hintFor({ a, b }: Fact): string {
  if (a === 1) return `One group of ${b} is ${b}.`;
  const left = Math.floor(a / 2), right = a - left;
  return `Split ${a} groups into ${left} + ${right}. ${left} × ${b} = ${left * b}, and ${right} × ${b} = ${right * b}. Add those two parts.`;
}
export function sequenceFor({ a, b }: Fact): Array<number | null> {
  const start = Math.max(0, b - 2);
  return Array.from({ length: 4 }, (_, i) => start + i === b ? null : (start + i) * a);
}
export function workedFor({ a, b }: Fact): string { return `${a} equal groups of ${b} make ${a * b}. ${a} × ${b} = ${a * b}.`; }

function assess(save: SaveEnvelope, q: Question, attempt: Attempt) {
  const key = factKey(q);
  const progress = save.facts[key] ??= {
    independentAttempts: 0, independentCorrect: 0, assistedAttempts: 0,
    successfulDates: [], outcomes: [], nextReview: addDays(attempt.date, 1), state: "Practising",
  };
  if (!attempt.independent) progress.assistedAttempts++;
  if (attempt.activity !== "dive" || !attempt.firstAttempt || attempt.correction) return;
  if (attempt.independent) {
    progress.independentAttempts++;
    if (attempt.correct) progress.independentCorrect++;
  }
  progress.outcomes.push({ date: attempt.date, independent: attempt.independent, correct: attempt.correct });
  progress.outcomes = progress.outcomes.slice(-20);
  if (attempt.independent && attempt.correct && !progress.successfulDates.includes(attempt.date)) progress.successfulDates.push(attempt.date);
  const lastTwo = progress.outcomes.slice(-2);
  progress.state = progress.successfulDates.length >= 3 && lastTwo.length === 2 && lastTwo.every((o) => o.correct && o.independent) ? "Secure" : "Practising";
  progress.nextReview = attempt.independent && attempt.correct
    ? nextReviewDate(attempt.date, progress.successfulDates.length)
    : addDays(attempt.date, 1);
}

export function getRun(save: SaveEnvelope, date: string, activity: ActivityId, extra = false) {
  return extra ? save.extra?.date === date && save.extra.run.questions[0]?.activity === activity ? save.extra.run : undefined : save.days[date]?.tasks[activity];
}
export function markHint(save: SaveEnvelope, date: string, activity: ActivityId, extra = false): SaveEnvelope {
  const next = structuredClone(save);
  const q = getRun(next, date, activity, extra)?.questions[getRun(next, date, activity, extra)!.index];
  if (q && !q.resolved) q.hinted = true;
  return next;
}
export function submitAnswer(save: SaveEnvelope, date: string, activity: ActivityId, questionId: string, answer: number, now: Date, extra = false): SaveEnvelope {
  const next = structuredClone(save);
  const run = getRun(next, date, activity, extra);
  const q = run && currentQuestion(run);
  if (!run || !q || q.id !== questionId || q.resolved || run.complete || !Number.isInteger(answer) || answer < 0 || answer > 144) return save;
  const attempt: Attempt = {
    id: `${q.id}:${q.attempts}`, date, timestamp: now.toISOString(), activity, a: q.a, b: q.b,
    answer, correct: answer === q.a * q.b, hinted: q.hinted, correction: q.correction,
    firstAttempt: q.attempts === 0, independent: activity === "dive" && q.attempts === 0 && !q.hinted && !q.correction,
  };
  if (next.attempts.some((a) => a.id === attempt.id)) return save;
  next.attempts.push(attempt);
  assess(next, q, attempt);
  q.attempts++;
  q.resolved = attempt.correct;
  if (!attempt.correct) {
    q.hinted = true;
    if (activity === "dive" && !q.correction && q.attempts === 1 && run.corrections < RULES.maxCorrections) {
      run.questions.splice(Math.min(run.index + 3, run.questions.length), 0, { ...q, id: `${q.id}-review`, attempts: 0, hinted: false, resolved: false, correction: true });
      run.corrections++;
    }
  }
  return next;
}
export function advance(save: SaveEnvelope, date: string, activity: ActivityId, now: Date, extra = false, questionId?: string, random = Math.random): SaveEnvelope {
  const next = structuredClone(save);
  const run = getRun(next, date, activity, extra);
  if (!run || run.complete || !currentQuestion(run)?.resolved || (questionId !== undefined && currentQuestion(run)?.id !== questionId)) return save;
  run.index++;
  if (run.index < run.questions.length) return next;
  run.complete = true;
  if (extra) {
    next.bonusCompletions ??= [];
    if (!next.bonusCompletions.some((entry) => entry.runId === run.id)) {
      next.bonusCompletions.push({ runId: run.id, date, activity, completedAt: now.toISOString() });
    }
    return next;
  }
  const day = next.days[date];
  if (isDayComplete(day) && !day.completedAt) {
    day.completedAt = now.toISOString();
    const collected = new Set(next.collection.map((entry) => entry.sharkId));
    const remaining = CATALOG.filter((entry) => !collected.has(entry.id));
    const shark = remaining[Math.min(remaining.length - 1, Math.floor(random() * remaining.length))]?.id;
    if (shark) {
      day.rewardId = shark;
      next.collection.push({ sharkId: shark, unlockedAt: now.toISOString(), rewardDate: date });
    } else day.rewardId = "ocean-explorer";
  }
  return next;
}
export function summary(save: SaveEnvelope, today: string) {
  const independent = save.attempts.filter((a) => a.independent);
  return {
    samples: independent.length,
    correct: independent.filter((a) => a.correct).length,
    assisted: save.attempts.filter((a) => !a.independent).length,
    secure: Object.values(save.facts).filter((f) => f.state === "Secure").length,
    review: Object.entries(save.facts).filter(([, f]) => f.nextReview <= today),
  };
}
export function catalogEntry(id: string) { return CATALOG.find((s) => s.id === id); }

export function upgradeSampling(save: SaveEnvelope): SaveEnvelope {
  if (save.samplingVersion === 2) return save;
  const next = structuredClone(save);
  for (const [date, day] of Object.entries(next.days)) {
    if (isDayComplete(day)) continue;
    const random = seededRandom(Number(date.replaceAll("-", "")));
    const firstDay = Object.keys(next.days).length === 1;
    day.plan = firstDay
      ? dailyPlan(next, date, effectiveTables(next), random)
      : rotateFacts(day.plan, 10, random);
    for (const activity of ACTIVITY_IDS) {
      const run = day.tasks[activity];
      if (!run || run.complete) continue;
      const replacement = makeRun(activity, day.plan, run.id);
      let primary = 0;
      for (let i = 0; i < run.questions.length; i++) {
        const q = run.questions[i];
        if (q.correction) continue;
        const fact = replacement.questions[primary++];
        if (i >= run.index && !q.attempts && !q.hinted && !q.resolved) { q.a = fact.a; q.b = fact.b; }
      }
    }
  }
  next.samplingVersion = 2;
  return next;
}
