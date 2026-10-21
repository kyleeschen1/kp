import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCalculusEdition, buildInteractiveCalculusEdition } from "../scripts/build-calculus-edition.ts";

let server: Server, origin: string;
async function setRange(page: Page, selector: string, value: number) {
  await page.locator(selector).evaluate((node, value) => {
    if (!(node instanceof HTMLInputElement)) throw new Error("Expected range");
    node.value = String(value); node.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
test.beforeAll(async () => {
  const editions = new Map([
    ["static", buildCalculusEdition("content/authoring/transfer/stationary-change.json")],
    ["stationary", await buildInteractiveCalculusEdition("content/authoring/transfer/stationary-change.json")],
    ["reversals", await buildInteractiveCalculusEdition("content/authoring/transfer/two-reversals.json")]
  ]);
  server = createServer((req, res) => {
    const [key, ...parts] = new URL(req.url!, "http://localhost").pathname.slice(1).split("/");
    const edition = editions.get(key || "static"), path = parts.join("/") || "index.html";
    if (!edition) { res.writeHead(404).end(); return; }
    const manifest = JSON.parse(readFileSync(join(edition.directory, "edition.json"), "utf8"));
    if (!Object.hasOwn(manifest.files, path)) { res.writeHead(404).end(); return; }
    const type = path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "text/javascript" : path.endsWith(".html") ? "text/html" : "application/octet-stream";
    res.setHeader("Content-Type", type); res.end(readFileSync(join(edition.directory, path)));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Missing local port");
  origin = `http://127.0.0.1:${address.port}`;
});

for (const key of ["stationary", "reversals"]) test(`${key}: reload and reverse retain embedded source and exact sample`, async ({ page, browser }) => {
  await page.goto(`${origin}/${key}/`);
  const card = page.locator(".change-card");
  await expect(card).toHaveAttribute("data-kp-focus-deck-static", "false");
  const revision = await card.getAttribute("data-change-revision");
  await setRange(page, "[data-change-h]", -.3);
  await setRange(page, "[data-kp-focus-deck-scrubber]", 3.5);
  const sample = await page.locator("[data-change-value]").allTextContents();
  await expect.poll(() => page.url()).toContain("step=3.5");
  const pinned = page.url();
  await page.reload();
  await expect(card).toHaveAttribute("data-change-position", "3.5");
  expect(await page.locator("[data-change-value]").allTextContents()).toEqual(sample);
  for (const position of [4, 0, 3.5]) await setRange(page, "[data-kp-focus-deck-scrubber]", position);
  expect(await page.locator("[data-change-value]").allTextContents()).toEqual(sample);
  const context = await browser.newContext();
  try {
    const fresh = await context.newPage(); await fresh.goto(pinned);
    await expect(fresh.locator(".change-card")).toHaveAttribute("data-change-revision", revision!);
    expect(await fresh.locator("[data-change-value]").allTextContents()).toEqual(sample);
    await setRange(fresh, "[data-change-h]", 0);
    await expect(fresh.locator('[data-change-value="errorPerH"]')).toHaveText("—");
  } finally { await context.close(); }
  const other = key === "stationary" ? "reversals" : "stationary";
  await page.goto(`${origin}/${other}/${new URL(pinned).hash}`);
  await expect(page.locator("[data-change-diagnostic]")).toContainText("Open the matching edition");
  await expect(card).toHaveAttribute("data-change-position", "0");
  expect(new URL(page.url()).hash).toBe(new URL(pinned).hash);
});
test.afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test("static selected-source edition reads without JavaScript or external resources", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage(), failed: string[] = [], external: string[] = [];
    page.on("requestfailed", r => failed.push(r.url()));
    page.on("response", r => { if (r.status() >= 400) failed.push(`${r.status()}: ${r.url()}`); });
    page.on("request", r => { if (!r.url().startsWith(origin)) external.push(r.url()); });
    await page.goto(`${origin}/static/`);
    // Firefox with page JavaScript disabled does not run callbacks attached to
    // fonts.ready; inspect the browser's font state without scheduling page code.
    await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loaded");
    await expect(page.locator("h1")).toHaveText("Zero slope does not mean no change");
    await expect(page.locator(".change-card")).toHaveAttribute("data-kp-focus-deck-static", "true");
    for (const id of ["input", "inner", "outer", "compose", "limit"]) await expect(page.locator(`[data-kp-focus-deck-beat="${id}"]`)).toBeVisible();
    await expect(page.locator(".kp-focus-deck__navigation")).toBeHidden();
    expect(await page.locator("math").count()).toBeGreaterThan(20);
    expect(failed).toEqual([]); expect(external).toEqual([]);
  } finally { await context.close(); }
});

for (const [key, title, derivative] of [
  ["stationary", "Zero slope does not mean no change", "+0.00000"],
  ["reversals", "Two local reversals can make an increase", "+4.00000"]
]) test(`${key}: packaged reader opens its selected source in a fresh browser`, async ({ page }) => {
  const errors: string[] = [], external: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on("request", r => { if (!r.url().startsWith(origin)) external.push(r.url()); });
  await page.goto(`${origin}/${key}/`);
  await expect(page.locator("h1")).toHaveText(title!);
  await expect(page.locator(".change-card")).toHaveAttribute("data-kp-focus-deck-static", "false");
  await expect(page.locator('[data-change-value="derivative"]')).toHaveText(derivative!);
  await expect(page.locator("textarea, [data-change-author]")).toHaveCount(0);
  expect(errors).toEqual([]); expect(external).toEqual([]);
});
