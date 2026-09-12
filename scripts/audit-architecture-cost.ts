import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { cpus, platform, arch } from "node:os";
import { gzipSync } from "node:zlib";
import { assertArchitectureLoadingAcceptance } from "./architecture-loading-acceptance.ts";
import { profileGradientCost } from "./profile-gradient-cost.ts";

// Measurements, not deletion candidates or automatically refreshed budgets.
// Inventory only tracked files; browser mode executes already-built artifacts.
const paths = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const counts: Record<string, { files: number; bytes: number; lines: number }> = {};
const files = paths.filter(path => /^(src|tests|scripts|domains)\//.test(path) && /\.(ts|css|svelte|json)$/.test(path))
  .map(path => { const bytes = readFileSync(path), text = bytes.toString(); return { path, bytes: bytes.length,
    lines: text.split("\n").length, text }; });
for (const file of files) {
  const key = `${file.path.split("/")[0]}${extname(file.path)}`;
  const count = counts[key] ??= { files: 0, bytes: 0, lines: 0 };
  count.files++; count.bytes += file.bytes; count.lines += file.lines;
}
const sourceTests = files.filter(file => file.path.startsWith("tests/") && file.path.endsWith(".test.ts"));
const css = files.filter(file => file.path.endsWith(".css"));
const top = (selected: typeof files) => selected.sort((a, b) => b.bytes - a.bytes).slice(0, 10)
  .map(({ text: _text, ...file }) => file);
console.log(JSON.stringify({ kind: "inventory", revision, counts,
  testFiles: { unit: sourceTests.length, browser: files.filter(f => f.path.endsWith(".browser.spec.ts")).length,
    sourceReadingHeuristic: sourceTests.filter(f => /readFile|readFileSync/.test(f.text)).length },
  packageCommands: Object.keys(JSON.parse(readFileSync("package.json", "utf8")).scripts).length,
  css: { importantOccurrences: css.reduce((n, f) => n + (f.text.match(/!important/g)?.length ?? 0), 0),
    importOccurrences: css.reduce((n, f) => n + (f.text.match(/@import/g)?.length ?? 0), 0), largest: top(css) },
  largestSource: top(files.filter(f => f.path.startsWith("src/") && f.path.endsWith(".ts"))),
  largestTests: top([...sourceTests]),
  caveats: ["Lines include blanks/comments/generated code.", "readFile presence is a heuristic, not a redundant-test verdict."] }));

if (process.argv.includes("--browser")) {
  const acceptance = process.argv.includes("--acceptance");
  if (acceptance && !process.argv.includes("--gradient-only") && !process.argv.includes("--activation")) throw new Error("Tax loading acceptance requires explicit --activation accounting.");
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  console.log(JSON.stringify({ kind: "environment", revision, browser: browser.version(), platform: platform(), arch: arch(),
    cpu: cpus()[0]?.model, viewport: "390x844 DPR1", network: "local built-file fulfillment; no network emulation",
    caveat: "1x/6x CPU sensitivity probe, not calibrated phone/GPU/RAM or field-performance certification" }));
  const scenarios = [
    { id: "static-quadratic-reader", output: "dist", route: "/reader/quadratic-branching/", ready: "main", card: false },
    { id: "canonical-tax", output: "dist", route: "/experiments/kinetic-figure/supply-tax/", ready: "[data-kp-focus-deck]", card: true },
    { id: "gradient", output: "dist/gradient-contour", route: "/experiments/kinetic-figure/gradient-contour/",
      ready: '.graph-webgl[data-kp-surface-contour-capability="ready"]', card: true }
  ];
  try {
    for (const scenario of scenarios.filter(item => (!process.argv.includes("--tax-only") || item.id === "canonical-tax") && (!process.argv.includes("--gradient-only") || item.id === "gradient"))) for (const rate of [1, 6]) for (let repeat = 1; repeat <= 3; repeat++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
      try {
        const page = await context.newPage(), cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate }); await cdp.send("Performance.enable");
        await page.addInitScript(() => {
          const tasks: number[] = [];
          Object.defineProperty(globalThis, "__kpCostTasks", { value: tasks });
          new PerformanceObserver(list => { for (const entry of list.getEntries()) tasks.push(entry.duration); })
            .observe({ type: "longtask", buffered: true });
        });
        const errors: string[] = [], requested = new Map<string, { raw: number; gzip: number; kind: string }>();
        page.on("pageerror", error => errors.push(error.message));
        const manifest = readFileSync(resolve(scenario.output, ".vite/manifest.json"));
        await page.route("**/*", async route => {
          const url = new URL(route.request().url());
          if (url.origin !== "http://localhost:8000") { errors.push(`external:${url.origin}`); await route.abort(); return; }
          const path = url.pathname === scenario.route ? `${scenario.route.slice(1)}index.html` : url.pathname.slice(1);
          if (!/^[a-zA-Z0-9_./-]+$/.test(path) || path.split("/").includes("..")) { await route.abort(); return; }
          try {
            const bytes = readFileSync(resolve(scenario.output, path)), ext = extname(path);
            const contentType = ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : ext === ".html" ? "text/html" : "application/octet-stream";
            requested.set(path, { raw: bytes.length, gzip: gzipSync(bytes).length, kind: ext });
            await route.fulfill({ body: bytes, contentType });
          } catch { errors.push(`missing:${path}`); await route.abort(); }
        });
        await page.goto(`http://localhost:8000${scenario.route}`, { waitUntil: "load", timeout: 60000 });
        await page.locator(scenario.ready).first().waitFor({ timeout: 60000 });
        await page.evaluate(() => document.fonts.ready);
        const readyMs = await page.evaluate(() => performance.now());
        const before = await cdp.send("Performance.getMetrics");
        const dom = await page.evaluate(() => ({ elements: document.querySelectorAll("*").length,
          canvases: document.querySelectorAll("canvas").length,
          styleRules: [...document.styleSheets].reduce((n, s) => { try { return n + s.cssRules.length; } catch { return n; } }, 0),
          longTasks: (globalThis as { __kpCostTasks?: number[] }).__kpCostTasks ?? [] }));
        // One ordinary next-step interaction; a static reader is the idle baseline.
        // This is host overhead evidence, not certification of every motion motif.
        const frames = await page.evaluate(async card => {
          const button = document.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]");
          if (card && !button) throw new Error("Card must expose its canonical next control.");
          const gaps: number[] = []; let last = await new Promise<number>(r => requestAnimationFrame(r));
          const start = last; if (card) button!.click();
          while (last - start < 2000) { const now = await new Promise<number>(r => requestAnimationFrame(r)); gaps.push(now - last); last = now; }
          gaps.sort((a, b) => a - b);
          return { samples: gaps.length, p50Ms: gaps[Math.floor(gaps.length * .5)], p95Ms: gaps[Math.floor(gaps.length * .95)],
            maxMs: gaps.at(-1), over50ms: gaps.filter(x => x > 50).length };
        }, scenario.card);
        const after = await cdp.send("Performance.getMetrics");
        const metric = (data: typeof before, name: string) => data.metrics.find(m => m.name === name)?.value ?? 0;
        const resources = [...requested.entries()].map(([path, value]) => ({ path, ...value }));
        if (errors.length) throw new Error(errors.join("\n"));
        if (acceptance && (scenario.id === "canonical-tax" || scenario.id === "gradient")) assertArchitectureLoadingAcceptance({ scenario: scenario.id, phase: "initial", assets: resources, errors });
        const totals = Object.fromEntries([".js", ".css", ".woff2", ".woff", ".ttf", ".html"].map(kind => [kind,
          resources.filter(r => r.kind === kind).reduce((sum, r) => ({ raw: sum.raw + r.raw, gzip: sum.gzip + r.gzip }), { raw: 0, gzip: 0 })]));
        console.log(JSON.stringify({ kind: "browser", scenario: scenario.id, cpuSlowdown: rate, repeat,
          manifestSha256: createHash("sha256").update(manifest).digest("hex"), readyMs, dom, frames,
          startupScriptMs: metric(before, "ScriptDuration") * 1000, startupTaskMs: metric(before, "TaskDuration") * 1000,
          interactionScriptMs: (metric(after, "ScriptDuration") - metric(before, "ScriptDuration")) * 1000,
          jsHeapUsedBytes: metric(after, "JSHeapUsedSize"), totals, resources, errors }));
        if (scenario.id === "canonical-tax" && rate === 1 && repeat === 3 && process.argv.includes("--activation")) {
          const initial = new Set(requested.keys());
          const states = await page.locator("[data-kp-deferred-card]").evaluateAll(elements => elements.map(element => {
            const stage = element.querySelector("[data-kp-log-exponent-focus-card-stage], [data-kp-surface-contour-stage], [data-kp-typescript-focus-card-stage]")!;
            return { state: element.getAttribute("data-kp-deferred-card"), top: stage.getBoundingClientRect().top, bottom: stage.getBoundingClientRect().bottom, viewport: window.innerHeight };
          }));
          if (states.length !== 3 || states.some(item => (item.top >= item.viewport || item.bottom <= 0) && item.state !== "idle")) throw new Error(`Offscreen stages must remain unactivated: ${JSON.stringify(states)}`);
          for (const selector of ["[data-kp-log-exponent-focus-card]", "[data-kp-surface-contour-deck]", "[data-kp-typescript-focus-card]"]) {
            const card = page.locator(selector);
            await card.scrollIntoViewIfNeeded();
            await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute("data-kp-deferred-card") === "ready", selector);
            if (selector.includes("log-exponent")) await page.locator('[data-kp-log-exponent-animation-status="ready"]').waitFor();
            if (selector.includes("surface-contour")) await card.locator('[data-kp-surface-contour-capability="ready"]').waitFor();
            const beforeBeat = await card.getAttribute("data-kp-focus-deck-active-beat");
            await card.locator("[data-kp-focus-deck-next]").click();
            await page.waitForFunction(({ selector, beforeBeat }) => document.querySelector(selector)?.getAttribute("data-kp-focus-deck-active-beat") !== beforeBeat, { selector, beforeBeat });
          }
          if (errors.length) throw new Error(errors.join("\n"));
          if (acceptance) assertArchitectureLoadingAcceptance({ scenario: "canonical-tax", phase: "activated", assets: [...requested].map(([path, asset]) => ({ path, ...asset })), errors });
          console.log(JSON.stringify({ kind: "activation", scenario: scenario.id, initialStates: states,
            additional: [...requested].filter(([path]) => !initial.has(path)).map(([path, resource]) => ({ path, ...resource })), errors }));
        }
        if (rate === 1 && repeat === 3) {
          // Coverage is a separate run so instrumentation does not contaminate
          // the timing cohort. Unused here never means safe to delete globally.
          await page.coverage.startCSSCoverage();
          await page.reload({ waitUntil: "load" });
          await page.locator(scenario.ready).first().waitFor({ timeout: 60000 });
          await page.evaluate(() => document.fonts.ready);
          if (scenario.card) await page.locator("[data-kp-focus-deck-next]").first().click();
          await page.waitForTimeout(2000);
          const coverage = await page.coverage.stopCSSCoverage();
          console.log(JSON.stringify({ kind: "css-coverage", scenario: scenario.id,
            caveat: "UTF-16 code units used over load plus one next step at 390px, not all states/themes/widths or a deletion proof",
            stylesheets: coverage.map(item => ({ url: item.url, total: item.text?.length ?? null,
              used: item.ranges.reduce((n, range) => n + range.end - range.start, 0) })) }));
        }
        if (scenario.id === "gradient" && process.argv.includes("--profile")) await profileGradientCost(page, cdp, scenario.output, rate, repeat);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
