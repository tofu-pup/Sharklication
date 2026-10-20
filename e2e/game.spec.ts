import { expect, test, type Page } from "@playwright/test";
import type { ActivityId, SaveEnvelope } from "../src/domain";

async function saved(page: Page): Promise<SaveEnvelope> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("sharklication", 1);
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    const data = await new Promise<SaveEnvelope>((resolve, reject) => {
      const req = db.transaction("progress", "readonly").objectStore("progress").get("current");
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    db.close(); return data;
  });
}
async function welcome(page: Page) {
  await page.goto("./");
  await expect(page.getByText(/I'm Gobfrey, your whale-shark guide/)).toBeVisible();
  await page.getByRole("button", { name: /Let's explore/ }).click();
  await expect(page.getByRole("heading", { name: /Small steps/ })).toBeVisible();
}
async function begin(page: Page, name: string) {
  const card = page.locator(".activity-card").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await card.click();
  await expect(page.locator("#answer")).toBeVisible();
}
async function solveCurrent(page: Page, activity: ActivityId) {
  const save = await saved(page);
  const date = Object.keys(save.days).sort().at(-1)!;
  const run = save.days[date].tasks[activity]!;
  const q = run.questions[run.index];
  await page.getByLabel("Your answer", { exact: true }).fill(String(q.a * q.b));
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByRole("button", { name: /Next discovery/ })).toBeEnabled();
  await page.getByRole("button", { name: /Next discovery/ }).click();
  await expect.poll(async () => (await saved(page)).days[date].tasks[activity]!.index).toBe(run.index + 1);
}
async function finish(page: Page, activity: ActivityId, name: string) {
  await begin(page, name);
  for (let i = 0; i < (activity === "reef" ? 6 : activity === "feeding" ? 3 : 10); i++) await solveCurrent(page, activity);
}
test("complete all activities in a chosen order, reload mid-task, and issue one durable reward", async ({ page }) => {
  await welcome(page);
  await finish(page, "feeding", "Feeding Time");
  await page.getByRole("button", { name: /Back to my ocean/ }).click();
  expect((await saved(page)).collection).toHaveLength(0);
  await begin(page, "Reef Trail");
  await solveCurrent(page, "reef");
  await page.reload();
  await page.getByRole("button", { name: /Continue my expedition/ }).click();
  await expect(page.locator(".question-counter")).toContainText("2 / 6");
  for (let i = 0; i < 5; i++) await solveCurrent(page, "reef");
  await page.getByRole("button", { name: /Back to my ocean/ }).click();
  expect((await saved(page)).collection).toHaveLength(0);
  await finish(page, "dive", "Discovery Dive");
  await expect(page.getByRole("heading", { name: /Fin-tastic work/ })).toBeVisible();
  expect((await saved(page)).collection).toHaveLength(1);
  await page.reload();
  await expect(page.getByText("3 of 3 stars")).toBeVisible();
  await page.getByRole("button", { name: /See today's discovery/ }).click();
  await expect(page.getByRole("heading", { name: "Whale shark", exact: true })).toBeVisible();
  expect((await saved(page)).collection).toHaveLength(1);
  await page.getByRole("button", { name: /Open my album/ }).click();
  await page.getByRole("button", { name: /Real species Whale shark/ }).click();
  await expect(page.getByText("Rhincodon typus", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meet Whale shark" })).toBeVisible();
  await expect(page.locator(".shark-facts li")).toHaveCount(15);
  await expect(page.locator(".shark-story")).toContainText("largest living fish");
  await expect(page.getByRole("link", { name: /CC BY-SA 2.5/ })).toBeVisible();
});
test("wrong answers teach, reconstruction is possible, and supported success is not independent", async ({ page }) => {
  await welcome(page);
  await begin(page, "Discovery Dive");
  for (let i = 0; i < 2; i++) {
    await page.getByLabel("Your answer", { exact: true }).fill("0");
    await page.getByRole("button", { name: "Check my answer" }).click();
  }
  await expect(page.getByRole("button", { name: /Build the answer:/ })).toBeVisible();
  await page.getByRole("button", { name: /Build the answer:/ }).click();
  await page.getByRole("button", { name: "Check my answer" }).click();
  const attempts = (await saved(page)).attempts;
  expect(attempts.at(-1)?.correct).toBe(true);
  expect(attempts.at(-1)?.independent).toBe(false);
  expect(attempts).toHaveLength(3);
});
test("first-day recall rotates varied answers and failed saves retain the typed answer", async ({ page }) => {
  await welcome(page);
  await begin(page, "Discovery Dive");
  const save = await saved(page);
  const run = Object.values(save.days)[0].tasks.dive!;
  expect(new Set(run.questions.map((q) => q.a * q.b)).size).toBe(10);
  await page.getByLabel("Your answer", { exact: true }).fill("14");
  await page.evaluate(() => {
    indexedDB.open = () => { throw new DOMException("Simulated storage failure", "QuotaExceededError"); };
  });
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByRole("alert")).toContainText("Simulated storage failure");
  await expect(page.getByLabel("Your answer", { exact: true })).toHaveValue("14");
  await page.reload();
  expect((await saved(page)).attempts).toHaveLength(0);
});
test("production subpath works offline, including photographs, progress and standalone manifest paths", async ({ page, context }) => {
  await welcome(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; window.dispatchEvent(new Event("online")); });
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible({ timeout: 30_000 });
  const manifest = await page.evaluate(async () => (await fetch("/Sharklication/manifest.webmanifest")).json());
  expect(manifest.start_url).toBe("/Sharklication/");
  expect(manifest.scope).toBe("/Sharklication/");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Small steps/ })).toBeVisible();
  await finish(page, "reef", "Reef Trail");
  await page.getByRole("button", { name: /Back to my ocean/ }).click();
  await finish(page, "feeding", "Feeding Time");
  await page.getByRole("button", { name: /Back to my ocean/ }).click();
  await finish(page, "dive", "Discovery Dive");
  const photo = page.locator(".reward-reveal img");
  await expect(photo).toBeVisible();
  expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.reload();
  expect((await saved(page)).collection).toHaveLength(1);
  await page.getByRole("button", { name: /Shark album/ }).click();
  await page.getByRole("button", { name: /Real species Whale shark/ }).click();
  await expect(page.locator(".shark-story")).toContainText("biggest fish on Earth");
  await expect(page.locator(".shark-facts li")).toHaveCount(15);
});
test("backup round trip requires confirmation and invalid imports leave progress untouched", async ({ page }) => {
  await welcome(page);
  await finish(page, "feeding", "Feeding Time");
  const original = await saved(page);
  await page.getByRole("button", { name: "Open parent settings" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "corrupt.json", mimeType: "application/json", buffer: Buffer.from('{"schemaVersion":999}') });
  await expect(page.getByRole("alert")).toContainText("unsupported backup");
  expect((await saved(page)).attempts).toEqual(original.attempts);
  const imported = { ...original, profile: { ...original.profile, name: "Explorer" } };
  await page.locator('input[type="file"]').setInputFiles({ name: "valid.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(imported)) });
  await expect(page.getByText("Check before replacing progress")).toBeVisible();
  expect((await saved(page)).profile.name).toBe("Lily");
  await page.getByRole("button", { name: "Confirm replacement" }).click();
  await expect(page.getByLabel("Explorer name")).toHaveValue("Explorer");
  expect((await saved(page)).attempts).toEqual(original.attempts);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export backup/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/sharklication-backup/);
});
test("midnight changes the checklist without transferring or losing yesterday's work", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T21:59:00Z"));
  await welcome(page);
  await begin(page, "Reef Trail");
  await solveCurrent(page, "reef");
  await page.clock.setFixedTime(new Date("2026-10-20T22:01:00Z"));
  await page.getByLabel("Your answer", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.getByRole("status").filter({ hasText: "The day changed" })).toBeVisible();
  const save = await saved(page);
  expect(save.days["2026-10-20"].tasks.reef!.index).toBe(1);
  expect(save.days["2026-10-21"]).toBeUndefined();
  await expect(page.getByText("0 of 3 stars")).toBeVisible();
});
test("touch layouts avoid horizontal overflow, reduced motion persists, and runtime requests stay local", async ({ page }) => {
  const remote: string[] = [];
  page.on("request", (request) => { if (new URL(request.url()).origin !== "http://127.0.0.1:4173") remote.push(request.url()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await welcome(page);
  for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1180, height: 820 }]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Open parent settings" }).click();
  const reduceMotion = page.getByLabel("Reduce motion (system preference is also respected)");
  await reduceMotion.click();
  await expect(reduceMotion).toBeChecked();
  await page.reload();
  await expect(page.getByLabel("Reduce motion (system preference is also respected)")).toBeChecked();
  expect(remote).toEqual([]);
});

test("correct answers celebrate once without blocking the next question; system and saved motion preferences work", async ({ page }) => {
  await welcome(page);
  await begin(page, "Discovery Dive");
  const save = await saved(page), run = Object.values(save.days)[0].tasks.dive!, q = run.questions[0];
  await page.getByLabel("Your answer", { exact: true }).fill(String(q.a * q.b));
  await page.getByRole("button", { name: "Check my answer" }).click();
  const feedback = page.locator("#answer-feedback");
  await expect(page.getByRole("complementary", { name: "Gobfrey's encouragement and hints" })).toContainText("Gobfrey says: Whale done!");
  await expect(page.getByRole("img", { name: "Gobfrey, your friendly illustrated whale-shark guide" })).toBeVisible();
  await expect(feedback).toContainText("Fin-tastic thinking!");
  await expect(page.locator(".answer-burst span")).toHaveCount(10);
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "1");
  await expect(page.getByRole("button", { name: /Next discovery/ })).toBeEnabled();
  expect(await feedback.evaluate((el) => getComputedStyle(el).animationName)).toBe("success-arrive");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await feedback.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  expect(await page.locator(".answer-burst span").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await page.getByRole("button", { name: /Next discovery/ }).click();
  await expect(page.locator(".answer-burst")).toHaveCount(0);
  await expect(feedback).not.toHaveClass(/correct/);
  await page.getByRole("button", { name: /Pause & return/ }).click();
  await page.getByRole("button", { name: "Open parent settings" }).click();
  await page.getByLabel("Reduce motion (system preference is also respected)").click();
  await expect(page.getByLabel("Reduce motion (system preference is also respected)")).toBeChecked();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: /My ocean/ }).click();
  expect(await page.locator(".hero-ocean>img").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await page.reload();
  expect(await page.locator("main").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("a completed expedition card opens more of the same activity with no daily reward changes", async ({ page }) => {
  await welcome(page);
  for (const activity of ["feeding", "reef", "dive"] as ActivityId[]) {
    const title = { reef: "Reef Trail", feeding: "Feeding Time", dive: "Discovery Dive" }[activity];
    await finish(page, activity, title);
    await page.getByRole("button", { name: /^Back to my ocean/ }).click();
    const before = await saved(page);
    const card = page.locator(`.activity-card.${activity}`);
    await expect(card).toContainText("Do more");
    await card.click();
    await expect(page.getByRole("heading", { name: new RegExp(title), level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Check my answer" })).toBeVisible();
    let extra = (await saved(page)).extra!;
    expect(extra.run.questions.every((q) => q.activity === activity)).toBe(true);
    const q = extra.run.questions[0];
    await page.getByLabel("Your answer", { exact: true }).fill(String(q.a * q.b));
    await page.getByRole("button", { name: "Check my answer" }).click();
    await page.getByRole("button", { name: /Next discovery/ }).click();
    await expect.poll(async () => (await saved(page)).extra!.run.index).toBe(1);
    extra = (await saved(page)).extra!;
    await page.reload();
    await card.click();
    await expect(page.locator(".question-counter")).toContainText(`2 / ${extra.run.questions.length}`);
    const after = await saved(page);
    expect(after.extra?.run.id).toBe(extra.run.id);
    expect(after.days).toEqual(before.days);
    expect(after.collection).toEqual(before.collection);
    await page.getByRole("button", { name: /Pause & return/ }).click();
  }
});

test("free swim is one tap per type and Feeding Time has countable cartoon sharks and fish up to twelve by twelve", async ({ page }) => {
  await welcome(page);
  await page.getByRole("button", { name: /Free swim/ }).click();
  await expect(page.locator(".practice-card")).toHaveCount(3);
  await expect(page.getByText("Pick a times table")).toHaveCount(0);
  for (const activity of ["reef", "feeding", "dive"] as ActivityId[]) {
    await page.locator(`.practice-card.${activity}`).click();
    await expect(page.locator(`.play-${activity}`)).toBeVisible();
    expect((await saved(page)).extra?.run.questions[0].activity).toBe(activity);
    await page.getByRole("button", { name: /Free swim/ }).click();
  }
  const base = await saved(page);
  base.settings.enabledTables = [12]; base.settings.autoUnlock = false;
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: base.settings.homeTimezone }).format(new Date());
  const imported: SaveEnvelope = {
    ...base,
    extra: { date, run: {
      id: "twelve-feeding", index: 0, complete: false, corrections: 0,
      questions: Array.from({ length: 3 }, (_, i) => ({
        id: `twelve-feeding-${i}`, activity: "feeding", a: 12, b: 12,
        hinted: false, resolved: false, correction: false, attempts: 0,
      })),
    } },
  };
  await page.getByRole("button", { name: "Open parent settings" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "twelve.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(imported)) });
  await page.getByRole("button", { name: "Confirm replacement" }).click();
  await expect(page.getByLabel("Explorer name")).toHaveValue("Lily");
  await page.getByRole("button", { name: /Free swim/ }).click();
  await page.locator(".practice-card.feeding").click();
  await expect(page.locator(".feeding-shark")).toHaveCount(12);
  await expect(page.locator(".feeding-fish")).toHaveCount(144);
  await expect(page.getByRole("img", { name: /12 cartoon sharks, each with 12 fish/ })).toBeVisible();
  for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1180, height: 820 }]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: /Line them up/ }).click();
  await expect(page.locator(".feeding-groups.as-array")).toBeVisible();
  await expect(page.locator(".feeding-shark")).toHaveCount(12);
  await expect(page.locator(".feeding-fish")).toHaveCount(144);
  for (const group of await page.locator(".feeding-group").all()) await expect(group.locator(".feeding-fish")).toHaveCount(12);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const logo = page.getByRole("link", { name: "Sharklication home" });
  await expect(logo.locator("img")).toHaveAttribute("src", /sharklication-header\.webp$/);
  expect(await logo.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await logo.click();
  await expect(page.getByRole("heading", { name: /Small steps/ })).toBeVisible();
});
