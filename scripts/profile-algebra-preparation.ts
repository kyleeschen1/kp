import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SourceMap } from "node:module";
import { buildInteractiveAlgebraEdition } from "./algebra-interactive-edition.ts";
import { buildAlgebraReader } from "./algebra-reader-build.ts";
import { summarizeGradientCpuProfile } from "./profile-gradient-cost.ts";

const args = process.argv.slice(2), instrumented = args.includes("--profile");
const label = args.find(arg => arg.startsWith("--label="))?.slice(8) ?? "current";
if (!/^[a-z-]+$/.test(label) || args.some(arg => arg !== "--profile" && arg !== `--label=${label}`))
  throw new Error("Usage: npm run visual:algebra-preparation -- [--profile] [--label=lowercase-name]");
const edition = await buildInteractiveAlgebraEdition("content/authoring/algebra/whole-and-parts.json");
const manifest = JSON.parse(readFileSync(join(edition.directory, "edition.json"), "utf8"));
const files = new Map<string, Buffer>(Object.keys(manifest.files).map(path => [path, readFileSync(join(edition.directory, path))]));
// Attribution uses the same minified entry with hidden maps held locally. The
// ordinary cohort serves the exact immutable edition, with no profiling build.
if (instrumented) for (const entry of (await buildAlgebraReader("edition", true)).files) files.set(...entry);
const maps = new Map<string, SourceMap>();
for (const [path, bytes] of files) if (path.endsWith(".map")) maps.set(path.slice(0, -4), new SourceMap(JSON.parse(bytes.toString())));
const server = createServer((req, res) => {
  const path = new URL(req.url!, "http://localhost").pathname.slice(1) || "index.html", bytes = files.get(path);
  if (!bytes || path.endsWith(".map")) { res.writeHead(404).end(); return; }
  res.setHeader("Content-Type", path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : "application/octet-stream");
  res.end(bytes);
});
await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address(); if (!address || typeof address === "string") throw new Error("Missing port");
const origin = `http://127.0.0.1:${address.port}`;
const samples: unknown[] = [];
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  browser = await chromium.launch();
  for (const slowdown of instrumented ? [6] : [1, 6]) for (let repeat = 1; repeat <= 3; repeat++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    try {
      const page = await context.newPage(), cdp = await context.newCDPSession(page);
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("requestfailed", request => errors.push(request.url()));
      page.on("response", response => { if (response.status() >= 400) errors.push(response.url()); });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: slowdown });
      await cdp.send("Performance.enable");
      const before = await cdp.send("Performance.getMetrics");
      if (instrumented) { await cdp.send("Profiler.enable"); await cdp.send("Profiler.start"); }
      await page.goto(origin);
      await page.waitForSelector('[data-algebra-edition][data-composed-status="ready"]');
      const readyMs = await page.evaluate(() => performance.now());
      const after = await cdp.send("Performance.getMetrics");
      const delta = (name: string) => (after.metrics.find(m => m.name === name)?.value ?? 0) - (before.metrics.find(m => m.name === name)?.value ?? 0);
      const profile = instrumented ? (await cdp.send("Profiler.stop")).profile : undefined;
      const attribution = profile ? summarizeGradientCpuProfile(profile, frame => {
        if (!frame.url.startsWith(origin + "/")) return frame.functionName || "(native)";
        const path = new URL(frame.url).pathname.slice(1), map = maps.get(path);
        const source = map?.findOrigin(frame.lineNumber + 1, frame.columnNumber + 1);
        return source && "fileName" in source ? `${source.fileName}:${source.lineNumber} ${source.name ?? frame.functionName}` : `[unmapped] ${path} ${frame.functionName}`;
      }) : {};
      if (errors.length) throw new Error(errors.join("\n"));
      const sample = { slowdown, repeat, readyMs, scriptMs: delta("ScriptDuration") * 1000,
        layoutMs: delta("LayoutDuration") * 1000, styleMs: delta("RecalcStyleDuration") * 1000,
        layoutCount: delta("LayoutCount"), styleCount: delta("RecalcStyleCount"), ...attribution };
      samples.push(sample); console.log(JSON.stringify(sample));
    } finally { await context.close(); }
  }
} finally { await browser?.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
const directory = "tmp/codex/algebra-preparation"; mkdirSync(directory, { recursive: true });
writeFileSync(join(directory, `${label}${instrumented ? "-profile" : ""}.json`), JSON.stringify({ instrumented,
  qualification: "Cold local production reader, Chromium 390x844 DPR1, three fresh contexts per CPU multiplier. Readiness includes automation overhead. CPU multiplier is not device certification. Instrumented inclusive CPU rows overlap; source maps stay local.", samples }, null, 2));
