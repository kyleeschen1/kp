import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildMatrixEdition } from "../scripts/build-matrix-edition.ts";
import { example } from "../src/authoring/matrix-columns/example.ts";
import { compile } from "../src/authoring/matrix-columns/compile.ts";
import { projectionLoss } from "../content/authoring/linear-algebra/projection-loss.ts";
import { evaluate } from "../src/math/authoring/matrices.ts";
import { editionHash } from "../src/experiments/matrix-column-combinations/edition-location.ts";

const cases = [example(), { schemaVersion: "kp.matrix-columns.v1", id: projectionLoss.id,
  left: evaluate(projectionLoss.product.left, {}), right: evaluate(projectionLoss.product.right, {}), reading: projectionLoss.reading }];
let server: Server, origin: string, scratch: string;
test.beforeAll(async () => {
  mkdirSync("tmp/codex", { recursive: true }); scratch = mkdtempSync("tmp/codex/matrix-edition-browser-");
  const editions = new Map<string, string>();
  for (const source of cases) {
    const path = join(scratch, `${source.id}.json`); writeFileSync(path, JSON.stringify(source, null, 2) + "\n");
    const edition = await buildMatrixEdition(path, { interactive: true }); editions.set(source.id, edition.directory);
  }
  server = createServer((req, res) => {
    const [id, ...parts] = new URL(req.url!, "http://localhost").pathname.slice(1).split("/");
    const directory = editions.get(id!), path = parts.join("/") || "index.html";
    if (!directory) { res.writeHead(404).end(); return; }
    const manifest = JSON.parse(readFileSync(join(directory, "edition.json"), "utf8"));
    if (!Object.hasOwn(manifest.files, path)) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "text/javascript" : path.endsWith(".html") ? "text/html" : "application/octet-stream");
    res.end(readFileSync(join(directory, path)));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Missing port");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});
async function seek(page: Page, value: number) {
  await page.locator("[data-scrub]").evaluate((node, value) => {
    if (!(node instanceof HTMLInputElement)) throw new Error("Expected slider");
    node.value = String(value); node.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await expect(page.locator("[data-scrub]")).toHaveValue(String(value));
}
for (const source of cases) test(`${source.id}: source-only production reader preserves both columns, reversal and pinned reload`, async ({ page, browser }, info) => {
  const errors: string[] = [], external: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => errors.push(request.url()));
  page.on("response", response => { if (response.status() >= 400) errors.push(response.url()); });
  page.on("request", request => { if (!request.url().startsWith(origin)) external.push(request.url()); });
  await page.goto(`${origin}/${source.id}/`);
  const root = page.locator("#comb-player"), revision = compile(source).revision;
  await expect(root).toHaveAttribute("data-ready", "true");
  await expect(page.locator("h1")).toHaveText(source.reading.title);
  await expect(root).toHaveAttribute("data-source-id", `${source.id}.AB`);
  for (const column of [0, 1]) {
    await root.locator("[data-column-navigation] a").nth(column).click();
    await expect(root).toHaveAttribute("data-column", String(column));
    const poses = new Map<number, (string | null)[]>();
    for (const p of [0, .25, .5, .75, 1, .75, .5, .25, 0]) {
      await seek(page, p);
      expect(await root.locator(".comb-stage").getAttribute("aria-hidden")).toBe("true");
      const pose = await root.locator(".comb-material > span").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")));
      expect(pose.length).toBeGreaterThan(0);
      if (poses.has(p)) expect(pose).toEqual(poses.get(p)); else poses.set(p, pose);
      if (p === 1) for (const row of [0, 1]) {
        await expect(root.locator(`[data-kp-comb-key="c-${row}-${column}"]`)).toHaveText(String(compile(source).result[row]![column]));
        await expect(root.locator(`[data-contributor-occurrence="scaled-1-${row}:input:0"]`)).toHaveAttribute("data-source-id", compile(source).product.right.rows[1]![column]!.id);
      }
    }
  }
  await seek(page, .4213); const pinned = page.url();
  expect(new URL(pinned).hash).toBe(editionHash(revision, .4213));
  await page.reload(); await expect(root).toHaveAttribute("data-ready", "true");
  await expect(root).toHaveAttribute("data-column", "1"); await expect(root.locator("[data-scrub]")).toHaveValue("0.4213");
  const context = await browser.newContext();
  try {
    const fresh = await context.newPage(); await fresh.goto(pinned);
    await expect(fresh.locator("#comb-player")).toHaveAttribute("data-ready", "true");
    await expect(fresh.locator("[data-scrub]")).toHaveValue("0.4213");
  } finally { await context.close(); }
  await page.setViewportSize({ width: 390, height: 844 }); await seek(page, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await root.screenshot({ path: info.outputPath(`${source.id}-phone.png`) });
  expect(errors).toEqual([]); expect(external).toEqual([]);
});
test("no script, missing reader and invalid embedded sources retain the complete reading", async ({ browser, page }) => {
  const source = cases[0]!;
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await context.newPage(); await staticPage.goto(`${origin}/${source.id}/`);
    await expect(staticPage.locator("#comb-player")).toBeHidden();
    await expect(staticPage.locator("[data-reading-beat]")).toHaveCount(14);
    await expect(staticPage.locator("math")).toHaveCount(3);
    for (const cues of source.reading.cues) for (const cue of Object.values(cues)) expect(await staticPage.locator("body").textContent()).toContain(cue);
  } finally { await context.close(); }
  await page.route("**/reader.js", route => route.abort());
  await page.goto(`${origin}/${source.id}/`);
  await expect(page.locator("[data-matrix-reading]")).toBeVisible();
  await page.unroute("**/reader.js");
  await page.route(`${origin}/${source.id}/`, async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/(<script type="application\/json" data-matrix-source>).*?(<\/script>)/, "$1{}$2");
    await route.fulfill({ response, body });
  });
  await page.goto(`${origin}/${source.id}/`);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-gap", "true");
  await expect(page.locator("[data-matrix-reading]")).toBeVisible();
});
test("foreign positions fail visibly, valid restoration recovers and departure releases the player", async ({ page }) => {
  const source = cases[0]!, revision = compile(source).revision;
  await page.goto(`${origin}/${source.id}/#revision=other&p=.5`);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-gap", "true");
  await expect(page.locator("[data-matrix-reading]")).toBeVisible();
  await page.evaluate(hash => { location.hash = hash; }, editionHash(revision, .42));
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("[data-scrub]")).toHaveValue("0.42");
  await page.evaluate(hash => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    history.replaceState(null, "", hash);
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  }, editionHash(revision, .64));
  await expect(page.locator("[data-scrub]")).toHaveValue("0.64");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  const stopped = page.url(); await seek(page, .2); expect(page.url()).toBe(stopped);
});
