import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { buildBayesEdition } from "./build-bayesian-edition.ts";

// Test-generated editions only; never mutate or remove an author's edition.
const repo = fileURLToPath(new URL("..", import.meta.url)), scratch = join(repo, "tmp/codex");
mkdirSync(scratch, { recursive: true });
const fixture = mkdtempSync(join(scratch, "edition-browser-"));
const editions: string[] = [];
const browser = await chromium.launch();
try {
  const source = createBayesDraft(); source.model.events[0]!.label = fixture.split("/").at(-1)!;
  const path = join(fixture, "source.json"); writeFileSync(path, JSON.stringify(source));
  const edition = buildBayesEdition(path); editions.push(edition.directory);
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), failures: string[] = [], requests = new Set<string>();
      page.on("pageerror", error => failures.push(error.message));
      // Fulfill strictly from the packaged edition: no dev server or source fallback.
      await page.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.origin !== "http://edition.local" || /%|\\/.test(url.pathname) || url.pathname.split("/").includes("..")) {
          failures.push(`unsafe:${url}`); await route.abort(); return;
        }
        const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
        try {
          const body = readFileSync(join(edition.directory, name)); requests.add(name);
          const ext = extname(name);
          await route.fulfill({ body, contentType: ext === ".html" ? "text/html" : ext === ".css" ? "text/css" : "application/octet-stream" });
        } catch { failures.push(`missing:${name}`); await route.abort(); }
      });
      await page.goto("http://edition.local/", { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      for (const details of await page.locator("details").all()) await details.evaluate(element => { element.setAttribute("open", ""); });
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(failures, []);
      assert.ok(requests.has("styles/tutorial/focus-deck-typography.css"));
      assert.ok([...requests].some(name => name.endsWith(".woff2")));
      assert.equal(await page.locator("script").count(), 0);
      assert.ok(await page.locator(".katex").count() > 0);
      const reading = await page.locator("main").innerText(); assert.ok(reading.length > 100);
      console.log(JSON.stringify({ family: "bayes", width, requests: requests.size, typography: true, nativeMath: true, failures }));
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  for (const directory of editions) rmSync(directory, { recursive: true, force: true });
  rmSync(fixture, { recursive: true, force: true });
}
