import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

test("real service-worker upgrades defer questions and settings, preserve progress, and apply on reconnect", async ({ page }) => {
  test.setTimeout(120_000);
  let version = 1;
  const dist = resolve("dist");
  const mime: Record<string, string> = {
    ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
    ".json": "application/json", ".webmanifest": "application/manifest+json",
    ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml",
  };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url!, "http://localhost").pathname);
      if (!pathname.startsWith("/Sharklication/")) { response.writeHead(404).end(); return; }
      const relative = pathname.slice("/Sharklication/".length) || "index.html";
      const file = resolve(dist, relative);
      if (!file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
      const bytes = await readFile(file);
      response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
      // Each revision is a genuinely different worker script, not a mocked registration.
      response.end(relative === "sw.js" ? `${bytes.toString("utf8")}\n// Upgrade fixture revision ${version}\n` : bytes);
    } catch (error) {
      response.writeHead(404).end(String(error));
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server failed to bind.");
  try {
    await page.goto(`http://127.0.0.1:${address.port}/Sharklication/`);
    await page.getByRole("button", { name: /Let's explore/ }).click();
    await expect(page.getByText("Offline ready", { exact: true })).toBeVisible();
    await page.locator(".activity-card.dive").click();
    await page.getByLabel("Your answer", { exact: true }).fill("14");
    const before = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((done, fail) => {
        const request = indexedDB.open("sharklication", 1);
        request.onsuccess = () => done(request.result);
        request.onerror = () => fail(request.error);
      });
      const save = await new Promise<unknown>((done, fail) => {
        const request = db.transaction("progress").objectStore("progress").get("current");
        request.onsuccess = () => done(request.result);
        request.onerror = () => fail(request.error);
      });
      db.close();
      return save;
    });
    let loads = 0;
    page.on("load", () => loads++);
    version = 2;
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    await expect(page.getByRole("status").filter({ hasText: "this question won't be interrupted" })).toBeVisible();
    await expect(page.getByLabel("Your answer", { exact: true })).toHaveValue("14");
    expect(loads).toBe(0);
    await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: /Pause & return/ }).click()]);
    await expect(page.getByRole("heading", { name: /Small steps/ })).toBeVisible();
    const after = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((done) => {
        const request = indexedDB.open("sharklication", 1);
        request.onsuccess = () => done(request.result);
      });
      const save = await new Promise<unknown>((done) => {
        const request = db.transaction("progress").objectStore("progress").get("current");
        request.onsuccess = () => done(request.result);
      });
      db.close();
      return save;
    });
    expect(after).toEqual(before);
    await page.getByRole("button", { name: "Open parent settings" }).click();
    await page.getByLabel("Explorer name").fill("Unsaved name");
    const priorLoads = loads;
    version = 3;
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    await expect(page.getByRole("status").filter({ hasText: "Finish any settings or backup changes" })).toBeVisible();
    await expect(page.getByLabel("Explorer name")).toHaveValue("Unsaved name");
    expect(loads).toBe(priorLoads);
    await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: /My ocean/ }).click()]);
    await expect(page.getByRole("heading", { name: /Small steps/ })).toBeVisible();
    version = 4;
    await Promise.all([page.waitForEvent("load"), page.evaluate(() => { window.dispatchEvent(new Event("online")); })]);
    await expect(page.getByRole("heading", { name: /Small steps/ })).toBeVisible();
    await page.getByRole("button", { name: "Open parent settings" }).click();
    await expect(page.getByLabel("Explorer name")).toHaveValue("Lily");
  } finally {
    await new Promise<void>((done, fail) => {
      server.close((error) => error ? fail(error) : done());
      server.closeAllConnections();
    });
  }
});
