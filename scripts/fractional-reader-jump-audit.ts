import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from 'playwright';

/** Direct jumps must select the destination, without replaying skipped states. */
export async function checkFractionalReaderJumps(page: Page, baseUrl: string, outputRoot: string) {
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  const route = new URL('/reader/solve-fractional-linear/', baseUrl);
  const snapshot = async () => {
    const { metrics } = await client.send('Performance.getMetrics');
    return {
      layouts: metrics.find((metric) => metric.name === 'LayoutCount')!.value,
      scriptSeconds: metrics.find((metric) => metric.name === 'ScriptDuration')!.value,
      ...await page.evaluate(async () => {
        const url = '/src/reader/runtime/reader-runtime-metrics.ts';
        const metrics = await import(/* @vite-ignore */ url);
        return { runtime: metrics.inspectKpReaderRuntimeMetrics(window),
          boundsReads: { ...window.kpFractionalMeasurementProbe },
          progress: Number(document.body.dataset['kpReaderProgress']) };
      })
    };
  };
  type Snapshot = Awaited<ReturnType<typeof snapshot>>;
  const results: { label: string; target: number; before: Snapshot; after: Snapshot;
    dispatchMs: number; frameTimes: number[]; observed: number[] }[] = [];
  await page.goto(route.toString(), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const jump = async (label: string, beat: string, target: number) => {
    const before = await snapshot();
    const change = await page.evaluate(async ({ beat }) => {
      const observed = [Number(document.body.dataset['kpReaderProgress'])];
      const observer = new MutationObserver((records) => {
        // oldValue preserves synchronous updates too; observing just the final
        // attribute would miss an accidental intermediate-state replay.
        for (const record of records) if (record.oldValue !== null) observed.push(Number(record.oldValue));
        observed.push(Number(document.body.dataset['kpReaderProgress']));
      });
      observer.observe(document.body, { attributes: true, attributeOldValue: true, attributeFilter: ['data-kp-reader-progress'] });
      const started = performance.now();
      document.querySelector<HTMLAnchorElement>(`.kp-lesson-toc a[href="#${beat}"]`)!.click();
      const dispatchMs = performance.now() - started;
      const frameTimes: number[] = [];
      for (let index = 0; index < 3; index++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => { frameTimes.push(performance.now() - started); resolve(); }));
      }
      observer.disconnect();
      return { dispatchMs, frameTimes, observed: [...new Set(observed)] };
    }, { beat });
    const after = await snapshot();
    assert.equal(after.progress, target);
    assert.ok(change.observed.every((progress) => progress === before.progress || progress === target),
      `${label} must not replay skipped mathematical states: ${change.observed.join(', ')}`);
    results.push({ label, target, before, after, ...change });
  };
  // The same far destination is reached both cold and after another operation.
  await jump('cold far forward', 'beat.solve', 833);
  await jump('far reverse', 'beat.read', 0);
  await jump('repeated far forward', 'beat.solve', 833);
  await jump('near reverse', 'beat.cancel-denominator', 667);
  await jump('near forward', 'beat.solve', 833);
  await jump('middle operation', 'beat.multiply', 500);

  const coldUrls = [];
  for (const progress of [233, 750, 917, 750]) {
    const url = new URL(route);
    url.searchParams.set('kpLesson', 'lesson.solve-x.fractional-linear');
    url.searchParams.set('kpVersion', '1');
    url.searchParams.set('kpProgress', String(progress));
    const started = Date.now();
    await page.goto(url.toString(), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const state = await snapshot();
    assert.equal(state.progress, progress);
    const observed = await page.evaluate(() => [...new Set(window.kpFractionalProgressProbe)]);
    assert.ok(observed.every((value) => value === 0 || value === progress),
      `URL ${progress} must not replay skipped states: ${observed.join(', ')}`);
    coldUrls.push({ navigationToNetworkIdleMs: Date.now() - started, observed, ...state });
  }
  const report = { environment: 'Local Vite development server, headless Chromium. Cold means fresh reader sessions, not an empty HTTP/module cache.',
    note: 'TOC dispatch timings exclude browser input delivery; frame timings include destination work and scheduling. URL timing includes networkidle wait.', results, coldUrls };
  await writeFile(path.join(outputRoot, 'jump-audit.json'), JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify({ jumps: results.map(({ label, dispatchMs, observed, before, after }) => ({ label, dispatchMs, observed,
    builds: after.runtime.canonicalSessionBuilds - before.runtime.canonicalSessionBuilds,
    reads: after.boundsReads.total - before.boundsReads.total, layouts: after.layouts - before.layouts })),
    coldUrls: coldUrls.map(({ progress, runtime, boundsReads }) => ({ progress, runtime, boundsReads })) }, null, 2) + '\n');
  await client.detach();
}
