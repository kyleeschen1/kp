import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { buildInteractiveAlgebraEdition } from "../scripts/algebra-interactive-edition.ts";
import whole from "../content/authoring/algebra/whole-and-parts.json" with { type: "json" };
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { compile } from "../src/authoring/algebra/compile.ts";

let server: Server, origin: string;
const cases = [
  { key: "whole", source: whole, path: "content/authoring/algebra/whole-and-parts.json" },
  { key: "primary", source: primary, path: "src/authoring/examples/composed-algebra-intuition.json" }
];
async function seek(page: Page, step: number) {
  await page.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
    if (!(node instanceof HTMLInputElement)) throw new Error("Expected slider");
    node.value = String(value); node.dispatchEvent(new Event("input", { bubbles: true }));
  }, step);
  await expect.poll(async () => Number(await page.locator("[data-composed-card]").getAttribute("data-composed-step"))).toBeCloseTo(step, 8);
}
test.beforeAll(async () => {
  const editions = new Map<string, Awaited<ReturnType<typeof buildInteractiveAlgebraEdition>>>();
  for (const c of cases) editions.set(c.key, await buildInteractiveAlgebraEdition(c.path));
  server = createServer((req, res) => {
    const [key, ...parts] = new URL(req.url!, "http://localhost").pathname.slice(1).split("/");
    const edition = editions.get(key!), path = parts.join("/") || "index.html";
    if (!edition) { res.writeHead(404).end(); return; }
    const manifest = JSON.parse(readFileSync(join(edition.directory, "edition.json"), "utf8"));
    if (!Object.hasOwn(manifest.files, path)) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "text/javascript" : path.endsWith(".html") ? "text/html" : "application/octet-stream");
    res.end(readFileSync(join(edition.directory, path)));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Missing port");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

for (const c of cases) test(`${c.key}: native motion, exact reload, reverse, local closure and text above`, async ({ page, browser }, info) => {
  const failures: string[] = [], external: string[] = [];
  page.on("pageerror", e => failures.push(e.message));
  page.on("requestfailed", r => failures.push(r.url()));
  page.on("response", r => { if (r.status() >= 400) failures.push(r.url()); });
  page.on("request", r => { if (!r.url().startsWith(origin)) external.push(r.url()); });
  await page.goto(`${origin}/${c.key}/`);
  const root = page.locator("[data-algebra-edition]"), card = page.locator("[data-composed-card]");
  await expect(root).toHaveAttribute("data-composed-status", "ready");
  await expect(root).toHaveAttribute("data-composed-revision", compile(c.source).revisionId);
  await expect(card.locator("[data-kp-reader-transition]")).toHaveCount(c.source.states.length - 1);
  const poses = new Map<number, { id: string | undefined; text: string | null; x: number; y: number; opacity: string }[]>();
  const steps = Array.from({ length: 2 * c.source.states.length - 1 }, (_, i) => i / 2);
  for (const step of [...steps, ...[...steps].reverse()]) {
    await seek(page, step);
    if (Number.isInteger(step)) await expect(card).toHaveAttribute("data-common-factor-state", c.source.states[step]!.id);
    const pose = await card.locator('[data-kp-reader-transition-active="true"]').evaluate(node => [...node.querySelectorAll<HTMLElement>("[data-kp-equation-material-semantic-entity-id]")].map(e => {
      const r = e.getBoundingClientRect(); return { id: e.dataset["kpEquationMaterialSemanticEntityId"], text: e.textContent, x: r.x, y: r.y, opacity: getComputedStyle(e).opacity };
    }));
    if (step % 1) expect(pose.length).toBeGreaterThan(0);
    const prior = poses.get(step);
    if (prior) {
      expect(pose.map(({ x, y, ...identity }) => identity)).toEqual(prior.map(({ x, y, ...identity }) => identity));
      // Firefox can quantize a transparent leaf by one 1/60px layout unit.
      // Keep exact identities/paint ownership and a subpixel geometry tolerance.
      pose.forEach((p, i) => { expect(p.x).toBeCloseTo(prior[i]!.x, 1); expect(p.y).toBeCloseTo(prior[i]!.y, 1); });
    } else poses.set(step, pose);
  }
  await seek(page, 1.5);
  await expect.poll(() => page.url()).toContain("step=1.5");
  const pinned = page.url();
  await page.reload(); await expect(card).toHaveAttribute("data-composed-step", "1.5");
  const context = await browser.newContext();
  try {
    const fresh = await context.newPage(); await fresh.goto(pinned);
    await expect(fresh.locator("[data-composed-card]")).toHaveAttribute("data-composed-step", "1.5");
    await expect(fresh.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-revision", compile(c.source).revisionId);
  } finally { await context.close(); }
  await page.setViewportSize({ width: 390, height: 844 });
  await seek(page, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const prose = await card.locator("[data-kp-focus-deck-viewport]").boundingBox(), stage = await card.locator("[data-distribution-stage]").boundingBox();
  expect(prose!.y + prose!.height).toBeLessThanOrEqual(stage!.y + 1);
  await card.screenshot({ path: info.outputPath(`${c.key}-phone.png`) });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.locator("[data-kp-focus-deck-scrubber]").focus(); await page.keyboard.press("End");
  await expect(card).toHaveAttribute("data-composed-step", String(c.source.states.length - 1));
  expect(failures).toEqual([]); expect(external).toEqual([]);
});

test("invalid locations preserve evidence and recover without selecting another source", async ({ page }) => {
  await page.goto(`${origin}/whole/#step=2&revision=other`);
  await expect(page.locator("[data-composed-error]")).toContainText("matching source edition");
  await expect(page.locator("[data-composed-card]")).toHaveAttribute("data-composed-step", "0");
  await seek(page, 1); expect(new URL(page.url()).hash).toBe("#step=2&revision=other");
  await page.evaluate(hash => { location.hash = hash; }, `step=2&revision=${encodeURIComponent(compile(whole).revisionId)}`);
  await expect(page.locator("[data-composed-card]")).toHaveAttribute("data-composed-step", "2");
  await expect(page.locator("[data-composed-error]")).toBeHidden();
  await page.evaluate(() => { location.hash = "step=NaN"; });
  await expect(page.locator("[data-composed-error]")).toBeVisible();
});

test("no script and rejected source retain complete static meaning", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await context.newPage(); await staticPage.goto(`${origin}/whole/`);
    await expect(staticPage.locator("[data-composed-reader]")).toBeHidden();
    expect(await staticPage.locator("math").count()).toBeGreaterThanOrEqual(whole.states.length);
    for (const s of whole.states) expect(await staticPage.locator("body").textContent()).toContain(s.narration);
  } finally { await context.close(); }
  await page.route(`${origin}/whole/`, async route => {
    const response = await route.fetch(), body = (await response.text()).replace(/(<script type="application\/json" data-composed-initial-source>).*?(<\/script>)/, "$1{}$2");
    await route.fulfill({ response, body });
  });
  await page.goto(`${origin}/whole/`);
  await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-status", "repair-gap");
  await expect(page.locator("[data-composed-reader]")).toBeHidden();
  await expect(page.locator('[aria-label="Complete verified reading"]')).toBeVisible();
});

test("page lifecycle pauses retained readers and releases final ownership", async ({ page }) => {
  await page.goto(`${origin}/whole/`);
  await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-status", "ready");
  await seek(page, 1.5);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await expect(page.locator("[data-composed-card]")).toHaveAttribute("data-composed-step", "1.5");
  await seek(page, 2);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-status", "disposed");
  const previous = page.url();
  await page.locator("[data-kp-focus-deck-scrubber]").evaluate(node => { (node as HTMLInputElement).value = "0"; node.dispatchEvent(new Event("input")); });
  expect(page.url()).toBe(previous);
  await page.evaluate(() => { location.hash = ""; window.dispatchEvent(new Event("resize")); });
  await expect(page.locator("[data-composed-card]")).toHaveAttribute("data-composed-step", "2");
});

test("departure during native preparation cannot resurrect a reader", async ({ page }) => {
  await page.addInitScript(() => {
    const ready = document.fonts.ready;
    Object.defineProperty(document.fonts, "ready", { value: new Promise(resolve => {
      window.addEventListener("algebra-release-fonts", () => { void ready.then(resolve); }, { once: true });
    }) });
  });
  await page.goto(`${origin}/whole/`);
  await expect(page.locator("[data-kp-canonical-equation-host]")).toHaveCount(1);
  await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-status", "preparing");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await page.evaluate(() => window.dispatchEvent(new Event("algebra-release-fonts")));
  // Await the native continuation, then prove disposed controls cannot update
  // playback or location. No timeout stands in for completion.
  await expect(page.locator("[data-composed-card]")).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-status", "disposed");
  const before = page.url();
  await page.locator("[data-kp-focus-deck-scrubber]").evaluate(node => { (node as HTMLInputElement).value = "2"; node.dispatchEvent(new Event("input")); });
  expect(page.url()).toBe(before);
  await expect(page.locator("[data-composed-card]")).toHaveAttribute("data-composed-step", "0");
});

test("rapid scrub samples coalesce history writes and pending work cannot overwrite a new link", async ({ page }) => {
  await page.addInitScript(() => {
    const replace = history.replaceState.bind(history);
    let writes = 0;
    history.replaceState = (data, unused, url) => {
      document.documentElement.dataset["historyWrites"] = String(++writes);
      replace(data, unused, url);
    };
  });
  await page.goto(`${origin}/whole/`);
  await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-status", "ready");
  const writes = await page.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    const slider = node as HTMLInputElement;
    for (let i = 0; i < 100; i++) { slider.value = String(i / 100); slider.dispatchEvent(new Event("input")); }
    return Number(document.documentElement.dataset["historyWrites"] || 0);
  });
  expect(writes).toBe(0);
  await expect(page.locator("html")).toHaveAttribute("data-history-writes", "1");
  await expect.poll(() => new URL(page.url()).hash).toContain("step=0.99");
  await seek(page, 2);
  const departingHash = await page.evaluate(() => {
    location.hash = "step=1&revision=other";
    // Navigation can depart before the queued hashchange handler runs.
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    return location.hash;
  });
  expect(departingHash).toBe("#step=1&revision=other");
  await expect(page.locator("[data-composed-error]")).toContainText("matching source edition");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  expect(new URL(page.url()).hash).toBe("#step=1&revision=other");
});

test("cost: cold and warm complete local reader navigation", async ({ browser, browserName }, info) => {
  test.skip(browserName !== "chromium", "Timing diagnostics use one fixed engine; preservation runs in all three.");
  const samples = [];
  for (let sample = 1; sample <= 3; sample++) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.addInitScript(() => {
        const tasks: number[] = [];
        new PerformanceObserver(list => {
          tasks.push(...list.getEntries().map(entry => entry.duration));
          document.documentElement.dataset["algebraLongTasks"] = JSON.stringify(tasks);
        }).observe({ type: "longtask", buffered: true });
      });
      for (const mode of ["cold", "warm"]) {
        if (mode === "cold") await page.goto(`${origin}/whole/`); else await page.reload();
        await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-status", "ready");
        samples.push({ sample, mode, ...await page.evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
          const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
          return { observedReadyMs: performance.now(), loadMs: nav.loadEventEnd, requests: resources.length,
            scriptRequests: resources.filter(r => new URL(r.name).pathname.endsWith(".js")).length,
            decodedBytes: nav.decodedBodySize + resources.reduce((n, r) => n + r.decodedBodySize, 0),
            transferBytes: nav.transferSize + resources.reduce((n, r) => n + r.transferSize, 0),
            longTasks: JSON.parse(document.documentElement.dataset["algebraLongTasks"] || "[]") };
        }) });
      }
    } finally { await context.close(); }
  }
  const report = { qualification: "Unthrottled localhost HTTP without compression or explicit cache headers. Warm is same-context reload; readiness includes automation overhead. Diagnostic samples, not learner-device performance or cross-edition caching guarantees.", samples };
  console.log(JSON.stringify(report));
  await info.attach("navigation-costs.json", { body: JSON.stringify(report), contentType: "application/json" });
});

test("shared development server opens the exact generated edition", async ({ page }) => {
  const edition = await buildInteractiveAlgebraEdition("content/authoring/algebra/whole-and-parts.json");
  await page.goto(`http://localhost:8000/${relative(process.cwd(), edition.directory)}/index.html`);
  await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-status", "ready");
  await expect(page.locator("[data-algebra-edition]")).toHaveAttribute("data-composed-revision", edition.revisionId);
  await seek(page, 1.5);
  await expect.poll(() => page.url()).toContain("step=1.5");
  await page.reload(); await expect(page.locator("[data-composed-card]")).toHaveAttribute("data-composed-step", "1.5");
});
