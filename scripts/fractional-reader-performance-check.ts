import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";
import { checkFractionalReaderJumps } from './fractional-reader-jump-audit.ts';

declare global {
  interface Window {
    kpFractionalMeasurementProbe: { total: number; prose: number; beat: number };
    kpFractionalProgressProbe: number[];
  }
}

/** Bounded diagnostic, not a production memory or cross-browser benchmark. */
export async function checkFractionalReaderPerformance(page: Page, baseUrl: string, outputRoot: string) {
  // Count calls without performing additional layout reads. This diagnostic
  // belongs only to the browser harness, never the reader payload.
  await page.addInitScript(() => {
    window.kpFractionalMeasurementProbe = { total: 0, prose: 0, beat: 0 };
    window.kpFractionalProgressProbe = [];
    const progressObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.target !== document.body) continue;
        if (record.oldValue !== null) window.kpFractionalProgressProbe.push(Number(record.oldValue));
        const current = document.body.dataset['kpReaderProgress'];
        if (current !== undefined) window.kpFractionalProgressProbe.push(Number(current));
      }
    });
    progressObserver.observe(document, { subtree: true, attributes: true, attributeOldValue: true,
      attributeFilter: ['data-kp-reader-progress'] });
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const counts = window.kpFractionalMeasurementProbe;
      counts.total++;
      if (this.classList.contains('kp-rising-passage')) counts.prose++;
      if (this.hasAttribute('data-kp-beat')) counts.beat++;
      return original.call(this);
    };
  });
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
      boundsReads: await page.evaluate(() => ({ ...window.kpFractionalMeasurementProbe })),
      runtime: await runtime()
    };
  };
  const initial = await sample();
  await page.waitForTimeout(3000);
  const idle = await sample();
  const cycles = [];
  await client.send('Profiler.enable');
  await client.send('Profiler.start');
  for (let cycle = 0; cycle < 4; cycle += 1) {
    const timing = await page.evaluate(async () => {
      const url = '/src/reader/runtime/reader-runtime-metrics.ts';
      const { inspectKpReaderRuntimeMetrics } = await import(/* @vite-ignore */ url);
      const frames: { frameMs: number; progress: number; boundsReads: number; builds: number; buildMs: number; applies: number }[] = [];
      const max = document.documentElement.scrollHeight - innerHeight;
      let previous = performance.now();
      let previousReads = window.kpFractionalMeasurementProbe.total;
      let previousRuntime = inspectKpReaderRuntimeMetrics(window);
      for (let index = 0; index <= 120; index += 1) {
        const progress = index <= 60 ? index / 60 : (120 - index) / 60;
        scrollTo(0, max * progress);
        await new Promise<void>((resolve) => requestAnimationFrame((now) => {
          const runtime = inspectKpReaderRuntimeMetrics(window);
          const reads = window.kpFractionalMeasurementProbe.total;
          frames.push({ frameMs: now - previous, progress: Number(document.body.dataset['kpReaderProgress']),
            boundsReads: reads - previousReads,
            builds: runtime.canonicalSessionBuilds - previousRuntime.canonicalSessionBuilds,
            buildMs: runtime.canonicalSessionBuildDurationMs - previousRuntime.canonicalSessionBuildDurationMs,
            applies: runtime.canonicalSessionApplies - previousRuntime.canonicalSessionApplies });
          previous = now;
          previousReads = reads;
          previousRuntime = runtime;
          resolve();
        }));
      }
      const deltas = frames.map((frame) => frame.frameMs).sort((a, b) => a - b);
      return { p95FrameMs: deltas[Math.floor(deltas.length * .95)], maxFrameMs: deltas.at(-1),
        over33ms: deltas.filter((ms) => ms > 33.4).length, frames };
    });
    await page.waitForTimeout(300);
    cycles.push({ ...await sample(), ...timing });
  }
  const { profile } = await client.send('Profiler.stop');
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
  const parents = new Map(profile.nodes.flatMap((node) => (node.children ?? []).map((child) => [child, node.id] as const)));
  const selfTime = new Map<number, number>();
  const inclusiveTime = new Map<number, number>();
  (profile.samples ?? []).forEach((id, index) => {
    const ms = (profile.timeDeltas?.[index] ?? 0) / 1000;
    selfTime.set(id, (selfTime.get(id) ?? 0) + ms);
    for (let ancestor: number | undefined = id; ancestor !== undefined; ancestor = parents.get(ancestor)) {
      inclusiveTime.set(ancestor, (inclusiveTime.get(ancestor) ?? 0) + ms);
    }
  });
  const top = (times: Map<number, number>) => [...times].map(([id, sampledMs]) => ({
    sampledMs, function: nodes.get(id)!.callFrame.functionName,
    url: nodes.get(id)!.callFrame.url, line: nodes.get(id)!.callFrame.lineNumber + 1
  })).sort((a, b) => b.sampledMs - a.sampledMs).slice(0, 30);
  const beforeRest = await sample();
  await page.waitForTimeout(3000);
  const afterRest = await sample();
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource").filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming);
    return { requests: entries.length, decodedBytes: entries.reduce((sum, entry) => sum + entry.decodedBodySize, 0) };
  });
  const result = { environment: "local Vite development server, headless Chromium; forced-GC heap excludes GPU/native allocations", readyMs,
    resources, declaredResponseBytes: responseBytes.reduce((a, b) => a + b, 0), initial, idle, cycles, beforeRest, afterRest,
    cpu: { note: 'Sampled inclusive times overlap; instrumentation and profiler affect timing.', self: top(selfTime), inclusive: top(inclusiveTime) } };
  await writeFile(path.join(outputRoot, "performance.json"), JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify({ readyMs, resources, initial, idle, cycles: cycles.map(({ frames, ...cycle }) => ({ ...cycle, frameSamples: frames.length })), beforeRest, afterRest }, null, 2) + "\n");
  assert.equal(await page.locator(".kp-caption-frame").count(), 1);
  assert.equal(await page.locator(".kp-caption-preview").count(), 0);
  assert.equal(afterRest.boundsReads.prose, initial.boundsReads.prose, 'Scrolling must not remeasure prose');
  assert.equal(afterRest.boundsReads.beat, initial.boundsReads.beat, 'Scrolling must not remeasure beat anchors');
  assert.equal(afterRest.runtime.scrollGeometryReads, initial.runtime.scrollGeometryReads, 'Scrolling must reuse narrative geometry');
  assert.deepEqual(afterRest.boundsReads, beforeRest.boundsReads, 'Settled idle must not keep measuring');
  assert.equal(afterRest.layouts, beforeRest.layouts, 'Settled idle must not keep laying out');
  await client.detach();
  await checkFractionalReaderJumps(page, baseUrl, outputRoot);
}
