import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { chromium, firefox, type Page } from 'playwright';
import { inspectPaint } from './fractional-linear-theme-comparison.ts';

const args = process.argv.slice(2);
const baseline = args.find(value => value.startsWith('--baseline='))?.slice(11);
const browserName = args.find(value => value.startsWith('--browser='))?.slice(10) ?? 'firefox';
const baseUrl = args.find(value => value.startsWith('--base-url='))?.slice(11) ?? 'http://127.0.0.1:8011';
const entry = args.find(value => value.startsWith('--entry='))?.slice(8) ?? 'saved';
if (!baseline || !/^[a-f0-9]{7,40}$/.test(baseline) || !['firefox', 'chromium'].includes(browserName) ||
    !['saved', 'opening'].includes(entry) || args.some(value => !/^--(baseline|browser|base-url|entry)=/.test(value)))
  throw new Error('Use --baseline=<commit> [--browser=firefox|chromium] [--entry=saved|opening] [--base-url=http://127.0.0.1:8011]');

const paths = ['src/reader/app/reader-canonical-equation-session.ts',
  'src/rendering/equation-material-layer-dom.ts', 'src/rendering/native-katex-paint-geometry.ts'];
const modules = new Map(paths.map(path => {
  const source = execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8' });
  return [path, stripTypeScriptTypes(source, { mode: 'strip' })] as const;
}));
const route = entry === 'opening' ? '/reader/what-counts/?kpMotion=full&kpVersion=1' : '/reader/what-counts/?kpCheckpoint=state.what-counts.collected&kpLesson=lesson.algebra.what-counts&kpMotion=full&kpProfile=standard&kpProgress=333&kpProjection=equation.symbolic&kpReading=0.454622&kpVersion=1#state.what-counts.collected';
const metrics = (page: Page) => page.evaluate(async () => {
  const path = '/src/reader/runtime/reader-runtime-metrics.ts';
  return (await import(/* @vite-ignore */ path)).inspectKpReaderRuntimeMetrics(window);
});
type Arm = 'baseline' | 'batched' | 'current';
const arms: readonly Arm[] = ['baseline', 'batched', 'current'];
const browser = await (browserName === 'firefox' ? firefox : chromium).launch();
const samples: { arm: Arm; repeat: number; builds: number; buildMs: number; initialBuildMs: number }[] = [];
let reference: Awaited<ReturnType<typeof inspectPaint>>['glyphs'][] | undefined;
try {
  // Warmup is excluded. Rotate the order of fresh browser contexts to reduce
  // ordering bias. Intercepted historical modules never modify the checkout or
  // the shared server; baseline paint is checked against current paint too.
  for (let repeat = 0; repeat < 4; repeat++) {
    for (let index = 0; index < arms.length; index++) {
      const arm = arms[(index + repeat) % arms.length]!;
      const context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
      try {
        if (arm !== 'current') for (const path of arm === 'baseline' ? paths : paths.slice(0, 1))
          await context.route(`**/${path}*`, request => request.fulfill({ contentType: 'application/javascript', body: modules.get(path)! }));
        // Isolate actual cold work. Natural-idle behavior has its own browser
        // regression; available speculation must not disguise a cold build here.
        await context.addInitScript(() => Object.defineProperty(window, 'requestIdleCallback', { value: undefined }));
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(new URL(route, baseUrl).href);
        await page.waitForFunction(() => document.body.dataset['kpAnimationHostStatus'] === 'ready', undefined, { timeout: 60_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        const before = await metrics(page);
        const paints = [];
        for (const progress of [500, 833]) {
          await page.locator('[data-kp-reader-attention-scrubber]').evaluate(async (element, value) => {
            if (!(element instanceof HTMLInputElement)) throw new Error('Missing semantic scrubber');
            element.value = String(value); element.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
          }, progress);
          const paint = await inspectPaint(page);
          paints.push(paint.glyphs.filter(glyph => glyph.opacity > .01).sort((a, b) => a.id.localeCompare(b.id) || a.x - b.x));
        }
        const after = await metrics(page);
        assert.deepEqual(errors, []);
        reference ??= paints;
        paints.forEach((glyphs, frame) => {
          assert.ok(glyphs.length > 0);
          assert.equal(glyphs.length, reference![frame]!.length);
          glyphs.forEach((glyph, index) => {
            const expected = reference![frame]![index]!;
            assert.equal(glyph.id, expected.id); assert.equal(glyph.text, expected.text);
            assert.equal(glyph.transitionActive, 'true');
            for (const key of ['x', 'y', 'width', 'height', 'opacity'] as const)
              assert.ok(Math.abs(glyph[key] - expected[key]) < .25, `${arm} changed ${glyph.id} ${key}`);
          });
        });
        const sample = { arm, repeat, builds: after.canonicalSessionBuilds - before.canonicalSessionBuilds,
          buildMs: after.canonicalSessionBuildDurationMs - before.canonicalSessionBuildDurationMs,
          initialBuildMs: before.canonicalSessionBuildDurationMs };
        assert.ok(sample.builds > 0, 'Cold comparison did not enter an unprepared scene');
        if (repeat > 0) samples.push(sample);
        console.log(JSON.stringify({ ...sample, warmup: repeat === 0 }));
      } finally { await context.close(); }
    }
  }
} finally { await browser.close(); }
const summary = arms.map(arm => {
  const cohort = samples.filter(sample => sample.arm === arm);
  const durations = cohort.map(sample => sample.buildMs).sort((a, b) => a - b);
  assert.ok(cohort.every(sample => sample.builds === samples[0]!.builds));
  const initial = cohort.map(sample => sample.initialBuildMs).sort((a, b) => a - b);
  return { arm, durations, medianMs: durations[1], initial, initialMedianMs: initial[1], buildsPerSample: cohort[0]!.builds };
});
const qualification = `Local development reader, v1 ${entry}, two seeks, three fresh contexts per arm after excluded warmup. Initial preparation is reported separately. Speculative idle preparation disabled in all arms. Baseline loads historical session/material/geometry modules; batched loads only the historical session; current uses the checkout. Actual visible glyphs compared across arms. Small diagnostic samples, not field CWV or universal latency guarantees.`;
await mkdir('tmp/codex/reader-preparation', { recursive: true });
await writeFile(`tmp/codex/reader-preparation/cold-${browserName}-${entry}.json`, JSON.stringify({ baseline, browserName, entry, qualification, samples, summary }, null, 2));
console.log(JSON.stringify({ qualification, summary }));
