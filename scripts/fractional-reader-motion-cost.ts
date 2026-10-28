import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from 'playwright';
import { measureFractionalScroll } from './fractional-reader-continuity-check.ts';
import { sampleKpReaderScrollPosition } from '../src/reader/runtime/continuous-scroll-clock.ts';

/** Operation-local cost and callback cadence. No prose holds are included in
 * the sweep; profiling is opt-in and separately labelled, never FPS evidence. */
export async function checkFractionalMotionCost(page: Page, baseUrl: string, outputRoot: string, label: string, profile: boolean) {
  if (!/^[a-z-]+$/.test(label)) throw new Error('Expected a lowercase report label');
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  const metrics = async () => {
    const { metrics } = await client.send('Performance.getMetrics');
    return Object.fromEntries(metrics.filter(item => ['ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount'].includes(item.name)).map(item => [item.name, item.value]));
  };
  const samples = [];
  if (profile) { await client.send('Profiler.enable'); await client.send('Profiler.start'); }
  for (const cpu of [1, 4]) {
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.goto(new URL('/reader/solve-fractional-linear/?kpMotion=full', baseUrl).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const { geometry, anchor } = await measureFractionalScroll(page);
    for (const visit of ['first', 'repeat']) {
      for (const [operation, start, end] of [['cancellation', .237, .265], ['evaluation', .39, .42], ['denominator', .737, .765]] as const) {
        const from = sampleKpReaderScrollPosition(start, geometry) - anchor;
        const to = sampleKpReaderScrollPosition(end, geometry) - anchor;
        const entryBefore = await metrics();
        await page.evaluate(async y => {
          dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y);
          await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
        }, from);
        const entryAfter = await metrics();
        const traversal = await page.evaluate(async ({ from, to }) => {
          const frames: { interval: number; scroll: number; painted: boolean }[] = [];
          const owners = [...document.querySelectorAll<HTMLElement>('[data-kp-reader-transition-active="true"] [data-kp-equation-material-owner-id]')];
          let previous: number | undefined;
          let started: number | undefined;
          let signature = '';
          await new Promise<void>(resolve => {
            const frame = (now: number) => {
              started ??= now;
              const current = owners.map(owner => `${owner.style.left}/${owner.style.top}/${owner.style.transform}`).join('|');
              if (previous !== undefined) frames.push({ interval: now - previous, scroll: scrollY, painted: current !== signature });
              previous = now; signature = current;
              const progress = Math.min(1, (now - started) / 1200);
              scrollTo(0, from + (to - from) * progress);
              if (progress === 1) resolve(); else requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
          });
          const intervals = frames.map(frame => frame.interval).sort((a, b) => a - b);
          return { callbacks: frames.length, changedGeometry: frames.filter(frame => frame.painted).length,
            changedScroll: frames.slice(1).filter((frame, index) => frame.scroll !== frames[index]!.scroll).length,
            callbackP95Ms: intervals[Math.floor(intervals.length * .95)], callbackMaxMs: intervals.at(-1),
            over33ms: intervals.filter(ms => ms > 33.4).length };
        }, { from, to });
        const after = await metrics();
        const difference = (a: typeof after, b: typeof after) => Object.fromEntries(Object.keys(a).map(key => [key, a[key]! - b[key]!]));
        samples.push({ cpu, visit, operation, entry: difference(entryAfter, entryBefore), sweep: difference(after, entryAfter), ...traversal });
      }
    }
  }
  let attribution;
  if (profile) {
    const { profile: data } = await client.send('Profiler.stop');
    const nodes = new Map(data.nodes.map(node => [node.id, node]));
    const times = new Map<number, number>();
    (data.samples ?? []).forEach((id, index) => times.set(id, (times.get(id) ?? 0) + (data.timeDeltas?.[index] ?? 0) / 1000));
    attribution = [...times].map(([id, milliseconds]) => ({ milliseconds, ...nodes.get(id)!.callFrame }))
      .sort((a, b) => b.milliseconds - a.milliseconds).slice(0, 35);
  }
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await client.detach();
  const result = { label, profile, note: 'Local Chromium operation sweeps at 1x/4x CPU. RAF callbacks and changing DOM geometry are not presented-frame counts; first visit may benefit from idle preparation.', samples, attribution };
  await writeFile(path.join(outputRoot, `motion-cost-${label}.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
