import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import type { Page } from 'playwright';

/** Ordinary production timings: no prototype wrappers, CPU profiler or forced GC during motion. */
export async function checkFractionalReaderProduction(page: Page, baseUrl: string, outputRoot: string, label: string) {
  if (!/^[a-z-]+$/.test(label)) throw new Error('Production measurement label must be lowercase letters/hyphens.');
  const browser = page.context().browser()!;
  const samples = [];
  for (const width of [1280, 390]) for (const cpu of [1, 4]) for (const repeat of [1, 2]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'no-preference' });
    try {
      const target = await context.newPage();
      const errors: string[] = [];
      target.on('pageerror', error => errors.push(error.message));
      target.on('requestfailed', request => errors.push(request.url()));
      const cdp = await context.newCDPSession(target);
      await cdp.send('Performance.enable');
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      await target.addInitScript(() => {
        const result = { readyMs: 0, longTasks: [] as number[] };
        Object.defineProperty(window, 'kpProductionProbe', { value: result });
        const observer = new MutationObserver(() => {
          if (document.body?.dataset['kpAnimationHostStatus'] !== 'ready') return;
          result.readyMs = performance.now();
          observer.disconnect();
        });
        observer.observe(document, { subtree: true, attributes: true, attributeFilter: ['data-kp-animation-host-status'] });
        new PerformanceObserver(list => {
          result.longTasks.push(...list.getEntries().map(entry => entry.duration));
        }).observe({ type: 'longtask', buffered: true });
      });
      const metrics = async () => {
        const { metrics } = await cdp.send('Performance.getMetrics');
        return Object.fromEntries(metrics.filter(item => ['ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'Nodes', 'JSHeapUsedSize'].includes(item.name)).map(item => [item.name, item.value]));
      };
      const loads = [];
      for (const temperature of ['cold', 'warm']) {
        await target.goto(new URL('/reader/solve-fractional-linear/', baseUrl).toString(), { waitUntil: 'load' });
        await target.waitForFunction(() => document.body.dataset['kpAnimationHostStatus'] === 'ready');
        const startup = await target.evaluate(() => {
          const probe: { readyMs: number; longTasks: number[] } = Reflect.get(window, 'kpProductionProbe');
          const resources = performance.getEntriesByType('resource').filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming);
          return { ...probe, paints: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, ms: entry.startTime })),
            resources: resources.map(entry => ({ path: new URL(entry.name).pathname, bytes: entry.decodedBodySize, transfer: entry.transferSize })) };
        });
        assert.ok(startup.readyMs > 0);
        assert.ok(startup.resources.every(resource => !resource.path.startsWith('/src/')), 'Production measurement requires a production preview');
        loads.push({ temperature, ...startup, metrics: await metrics() });
      }
      await target.waitForTimeout(250);
      const before = await metrics();
      const traversal = await target.evaluate(async () => {
        const intervals: number[] = [];
        let previous: number | undefined;
        const max = document.documentElement.scrollHeight - innerHeight;
        for (let cycle = 0; cycle < 2; cycle++) for (let step = 0; step <= 120; step++) {
          scrollTo(0, max * (step <= 60 ? step / 60 : (120 - step) / 60));
          await new Promise<void>(resolve => requestAnimationFrame(now => {
            if (previous !== undefined) intervals.push(now - previous);
            previous = now; resolve();
          }));
        }
        intervals.sort((a, b) => a - b);
        return { p95FrameMs: intervals[Math.floor(intervals.length * .95)], maxFrameMs: intervals.at(-1),
          over50ms: intervals.filter(ms => ms > 50.1).length };
      });
      const after = await metrics();
      const costs = Object.fromEntries(Object.keys(before).map(key => [key, after[key]! - before[key]!]));
      await cdp.send('HeapProfiler.collectGarbage');
      const retained = await metrics();
      assert.deepEqual(errors, []);
      const sample = { width, cpu, repeat, loads, traversal, costs, retained };
      samples.push(sample);
      console.log(JSON.stringify({ width, cpu, repeat, readyMs: loads.map(load => load.readyMs), traversal, costs }));
    } finally { await context.close(); }
  }
  const paths = [...new Set(samples.flatMap(sample => sample.loads.flatMap(load => load.resources.map(resource => resource.path))))].filter(file => file.startsWith('/assets/'));
  const files = await Promise.all(paths.map(async file => {
    const data = await readFile(path.join('dist', file.slice(1)));
    return { file, bytes: data.length, gzipBytes: gzipSync(data).length };
  }));
  const report = { environment: 'Local production preview, fresh Chromium contexts, cold/warm HTTP cache, 1x/4x CPU, desktop/phone; two repetitions. No profiler. CPU multiplier is not device certification.',
    label, samples, files, totals: { bytes: files.reduce((sum, file) => sum + file.bytes, 0), gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0) } };
  await writeFile(path.join(outputRoot, `production-${label}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ label, assetCount: files.length, totals: report.totals }));
}
