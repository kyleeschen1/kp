import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, firefox, type Frame, type Page } from 'playwright';
import { createDocumentTheaterScroll, documentPassageCadence } from '../src/reader/app/document-theater-scroll.ts';
import { sampleKpReaderScrollPosition } from '../src/reader/runtime/continuous-scroll-clock.ts';
import type { KpReaderRuntimeMetricsSnapshot } from '../src/reader/runtime/reader-runtime-metrics.ts';

// Exercise the real notebook iframe without changing the application's clock,
// geometry, preparation policy or renderer. These are callback timings, not FPS.
const browserName = process.argv.find(arg => arg.startsWith('--browser='))?.slice(10) ?? 'chromium';
assert.ok(browserName === 'chromium' || browserName === 'firefox', 'Expected chromium or firefox');
const baseURL = process.argv.find(arg => arg.startsWith('--base-url='))?.slice(11) ?? 'http://127.0.0.1:8000';
const phone = process.argv.includes('--phone');
const viewport = phone ? { width: 390, height: 844 } : { width: 1280, height: 900 };
const output = 'tmp/codex/fraction-notebook-scroll';
await mkdir(output, { recursive: true });
const browser = await (browserName === 'firefox' ? firefox : chromium).launch({ headless: true });
const reports = [];
try {
  for (const host of ['reader', 'notebook-reading', 'notebook-editing'] as const) {
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
    try {
      await context.addInitScript(editing => {
        sessionStorage.setItem('kp.fraction-editing', String(editing));
        sessionStorage.setItem('kp.workspace.header', 'false');
      }, host === 'notebook-editing');
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(new URL(host === 'reader' ? '/reader/solve-fractional-linear/?reading=reasoning&kpMotion=full'
        : '/experiments/fraction-notebook/', baseURL).href, { waitUntil: 'networkidle' });
      if (host !== 'reader') {
        await page.waitForFunction(() => document.querySelector('.fn-status')?.textContent?.includes('preview up to date'));
        if (host === 'notebook-editing') await page.locator('.fn-animation-slot').scrollIntoViewIfNeeded();
      }
      const surface = host === 'reader' ? page : page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'));
      assert.ok(surface, 'Expected the canonical reader iframe');
      await surface.waitForFunction(() => document.body.dataset['kpReaderHydrated'] === 'true');
      await surface.evaluate(() => document.fonts.ready);
      const measured = await surface.evaluate(() => ({
        viewport: { width: innerWidth, height: innerHeight },
        stops: [...document.querySelectorAll<HTMLElement>('[data-kp-beat]')].map(beat => ({
          progressPermille: Number(beat.dataset['kpCheckpoint']),
          positionPx: scrollY + beat.getBoundingClientRect().top + beat.querySelector('.kp-rising-passage')!.getBoundingClientRect().height
        })),
        anchor: innerHeight * Number(document.body.dataset['kpReaderViewportAnchor']),
        available: innerHeight - document.querySelector('.kp-reader-masthead')!.getBoundingClientRect().height
      }));
      const geometry = createDocumentTheaterScroll({ stops: measured.stops }, measured.available);
      const samples = [];
      for (const visit of ['first', 'repeat']) {
        for (const [operation, start, end] of [['cancellation', .237, .265], ['evaluation', .39, .42], ['denominator', .737, .765]] as const) {
          const from = sampleKpReaderScrollPosition(start, geometry) - measured.anchor;
          const to = sampleKpReaderScrollPosition(end, geometry) - measured.anchor;
          const result = await sweep(surface, from, to, start * 1000);
          assert.ok(result.changedScroll > 0 && result.changedPaint > 0, 'Expected changing scroll and material paint');
          samples.push({ visit, operation, scrollSpanPx: to - from, ...result });
        }
      }
      assert.deepEqual(errors, [], 'No browser runtime errors');
      const beforeResize = Number(await surface.locator('body').getAttribute('data-kp-reader-progress'));
      await page.setViewportSize({ width: viewport.width, height: viewport.height - 100 });
      await surface.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      const afterResize = Number(await surface.locator('body').getAttribute('data-kp-reader-progress'));
      assert.ok(Math.abs(afterResize - beforeResize) <= 1, 'Height changes must preserve the semantic reading position');
      await page.setViewportSize(viewport);
      await surface.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      if (phone) await page.screenshot({ path: `${output}/${browserName}-${host}-phone.png` });
      const report = { host, viewport: measured.viewport, operationScrollPx: documentPassageCadence(measured.available).act,
        resize: { beforeResize, afterResize }, samples };
      reports.push(report);
      console.log(JSON.stringify(report));
    } finally { await context.close(); }
  }
  await writeFile(`${output}/${browserName}${phone ? '-phone' : ''}.json`, JSON.stringify({ browserName,
    note: 'Local development, headless, no CPU throttling. Controlled scroll sweeps measure RAF callback cadence and existing reader counters, not presented frames or physical input. First visits may benefit from idle preparation.',
    reports }, null, 2));
} finally { await browser.close(); }

async function sweep(surface: Page | Frame, from: number, to: number, expectedProgress: number) {
  return surface.evaluate(async ({ from, to, expectedProgress }) => {
    const url = '/src/reader/runtime/reader-runtime-metrics.ts';
    const inspect: (view: Window) => KpReaderRuntimeMetricsSnapshot =
      (await import(/* @vite-ignore */ url)).inspectKpReaderRuntimeMetrics;
    const before = inspect(window);
    const startTime = performance.now();
    dispatchEvent(new WheelEvent('wheel'));
    scrollTo(0, from);
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    if (Math.abs(Number(document.body.dataset['kpReaderProgress']) - expectedProgress) > 1)
      throw new Error('The hydrated reader must use the same scroll geometry as its compiled layout');
    const entered = inspect(window);
    const entryElapsedMs = performance.now() - startTime;
    const owners = [...document.querySelectorAll<HTMLElement>(
      '[data-kp-reader-transition-active="true"] [data-kp-equation-material-owner-id]')];
    if (!owners.length) throw new Error('A diagnostic must exercise material motion, not an idle renderer');
    const frames: { interval: number; scroll: number; changed: boolean; buildMs: number }[] = [];
    let previous: number | undefined, started: number | undefined, signature = '';
    let previousBuildMs = entered.canonicalSessionBuildDurationMs;
    await new Promise<void>(resolve => {
      const frame = (now: number) => {
        started ??= now;
        const paint = owners.map(owner => `${owner.style.left}/${owner.style.top}/${owner.style.transform}`).join('|');
        const runtime = inspect(window);
        if (previous !== undefined) frames.push({ interval: now - previous, scroll: scrollY,
          changed: paint !== signature, buildMs: runtime.canonicalSessionBuildDurationMs - previousBuildMs });
        previous = now; signature = paint; previousBuildMs = runtime.canonicalSessionBuildDurationMs;
        const progress = Math.min(1, (now - started) / 1200);
        scrollTo(0, from + (to - from) * progress);
        if (progress === 1) resolve(); else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    const after = inspect(window);
    const intervals = frames.map(frame => frame.interval).sort((a, b) => a - b);
    const difference = (a: typeof after, b: typeof after) => ({
      builds: a.canonicalSessionBuilds - b.canonicalSessionBuilds,
      buildMs: a.canonicalSessionBuildDurationMs - b.canonicalSessionBuildDurationMs,
      applies: a.canonicalSessionApplies - b.canonicalSessionApplies,
      scrollGeometryReads: a.scrollGeometryReads - b.scrollGeometryReads,
      observeMs: a.preparationPhases.observe.durationMs - b.preparationPhases.observe.durationMs,
      planMs: a.preparationPhases.plan.durationMs - b.preparationPhases.plan.durationMs,
      mountMs: a.preparationPhases.mount.durationMs - b.preparationPhases.mount.durationMs,
      reasons: Object.fromEntries(Object.entries(a.canonicalSessionBuildReasons).map(([key, value]) =>
        [key, Number(value) - (b.canonicalSessionBuildReasons[key] ?? 0)]).filter(([, value]) => value !== 0))
    });
    return { entryElapsedMs, entry: difference(entered, before), sweep: difference(after, entered),
      callbacks: frames.length, changedScroll: frames.slice(1).filter((frame, i) => frame.scroll !== frames[i]!.scroll).length,
      changedPaint: frames.filter(frame => frame.changed).length, p95Ms: intervals[Math.floor(intervals.length * .95)],
      maxMs: intervals.at(-1), over33ms: frames.filter(frame => frame.interval > 33.4) };
  }, { from, to, expectedProgress });
}
