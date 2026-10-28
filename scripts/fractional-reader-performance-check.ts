import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";

/** Bounded diagnostic, not a production memory or cross-browser benchmark. */
export async function checkFractionalReaderPerformance(page: Page, baseUrl: string, outputRoot: string) {
  const client = await page.context().newCDPSession(page);
  await client.send("Performance.enable");
  const responseBytes: number[] = [];
  page.on("response", (response) => {
    const length = Number(response.headers()["content-length"]);
    if (Number.isFinite(length)) responseBytes.push(length);
  });
  const started = Date.now();
  await page.goto(new URL("/reader/solve-fractional-linear/", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.dataset["kpCaptionMode"] === "captions"
    && document.body.dataset["kpReaderHydrated"] === "true");
  await page.evaluate(() => document.fonts.ready);
  const readyMs = Date.now() - started;
  const runtime = () => page.evaluate(async () => {
    const url = "/src/reader/runtime/reader-runtime-metrics.ts";
    const metrics = await import(/* @vite-ignore */ url);
    return metrics.inspectKpReaderRuntimeMetrics(window);
  });
  const sample = async () => {
    await client.send("HeapProfiler.collectGarbage");
    const { metrics } = await client.send("Performance.getMetrics");
    return {
      heapBytes: metrics.find((metric) => metric.name === "JSHeapUsedSize")?.value,
      nodes: metrics.find((metric) => metric.name === "Nodes")?.value,
      layouts: metrics.find((metric) => metric.name === "LayoutCount")?.value,
      scriptSeconds: metrics.find((metric) => metric.name === "ScriptDuration")?.value,
      runtime: await runtime()
    };
  };
  const initial = await sample();
  await page.waitForTimeout(3000);
  const idle = await sample();
  const cycles = [];
  for (let cycle = 0; cycle < 4; cycle += 1) {
    const timing = await page.evaluate(async () => {
      const deltas: number[] = [];
      const max = document.documentElement.scrollHeight - innerHeight;
      let previous = performance.now();
      for (let index = 0; index <= 120; index += 1) {
        const progress = index <= 60 ? index / 60 : (120 - index) / 60;
        scrollTo(0, max * progress);
        await new Promise<void>((resolve) => requestAnimationFrame((now) => {
          deltas.push(now - previous);
          previous = now;
          resolve();
        }));
      }
      deltas.sort((a, b) => a - b);
      return { p95FrameMs: deltas[Math.floor(deltas.length * .95)], maxFrameMs: deltas.at(-1) };
    });
    await page.waitForTimeout(300);
    cycles.push({ ...await sample(), ...timing });
  }
  const beforeRest = await sample();
  await page.waitForTimeout(3000);
  const afterRest = await sample();
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource").filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming);
    return { requests: entries.length, decodedBytes: entries.reduce((sum, entry) => sum + entry.decodedBodySize, 0) };
  });
  const result = { environment: "local Vite development server, headless Chromium; forced-GC heap excludes GPU/native allocations", readyMs,
    resources, declaredResponseBytes: responseBytes.reduce((a, b) => a + b, 0), initial, idle, cycles, beforeRest, afterRest };
  await writeFile(path.join(outputRoot, "performance.json"), JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  assert.equal(await page.locator(".kp-caption-frame").count(), 1);
  assert.equal(await page.locator(".kp-caption-preview").count(), 0);
  await client.detach();
}
