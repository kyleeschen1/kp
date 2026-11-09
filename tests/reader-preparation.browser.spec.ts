import { test, expect, type Page } from '@playwright/test';
import { inspectPaint } from '../scripts/fractional-linear-theme-comparison.ts';

const examples = [
  { slug: 'what-counts', points: [166, 500, 833], capacity: 3 },
  { slug: 'solve-fractional-linear', points: [233, 417, 750, 917], capacity: 4 },
  { slug: 'divide-both-sides', points: [420, 500, 580], capacity: 1 }
] as const;

test('cold preparation profile identifies work in the actual compositor', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'CPU sampling is a Chromium diagnostic; other tests use real Firefox timings.');
  await page.goto('/reader/what-counts/?kpMotion=full');
  await expect(page.locator('body')).toHaveAttribute('data-kp-animation-host-status', 'ready', { timeout: 60_000 });
  const profiler = await page.context().newCDPSession(page);
  await profiler.send('Performance.enable');
  const before = await profiler.send('Performance.getMetrics');
  await profiler.send('Profiler.enable');
  await profiler.send('Profiler.setSamplingInterval', { interval: 250 });
  await profiler.send('Profiler.start');
  for (const progress of [500, 833]) { await seek(page, progress); await paint(page); }
  const { profile } = await profiler.send('Profiler.stop');
  const after = await profiler.send('Performance.getMetrics');
  await profiler.detach();
  const nodes = new Map(profile.nodes.map(node => [node.id, node]));
  const costs = new Map<string, number>();
  for (let index = 0; index < (profile.samples?.length ?? 0); index++) {
    const node = nodes.get(profile.samples![index]!);
    if (!node?.callFrame.url.includes('/src/')) continue;
    const key = `${node.callFrame.functionName}:${node.callFrame.url.split('/src/')[1]?.split('?')[0]}:${node.callFrame.lineNumber + 1}`;
    costs.set(key, (costs.get(key) ?? 0) + (profile.timeDeltas?.[index] ?? 0) / 1000);
  }
  const browserWork = Object.fromEntries(after.metrics.filter(metric => /^(LayoutCount|RecalcStyleCount|LayoutDuration|RecalcStyleDuration)$/.test(metric.name))
    .map(metric => [metric.name, metric.value - (before.metrics.find(entry => entry.name === metric.name)?.value ?? 0)]));
  console.log(JSON.stringify({ browserWork, coldProfile: [...costs].sort((a, b) => b[1] - a[1]).slice(0, 20) }));
  await info.attach('cold-preparation.cpuprofile', { body: JSON.stringify(profile), contentType: 'application/json' });
});

test('idle preparation is invisible and the reusable host consumes its exact prepared scene', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'One actual compositor canary; real timing is measured separately.');
  // Control eligibility, not paint or semantic progress. This ownership test
  // must execute preparation even on a loaded machine; it is not timing data.
  await page.addInitScript(() => {
    const now = performance.now.bind(performance);
    performance.now = () => now() / 10;
    const request = window.requestIdleCallback.bind(window);
    window.requestIdleCallback = (callback, options) => request(deadline => callback({
      didTimeout: deadline.didTimeout, timeRemaining: () => 50
    }), options);
  });
  await page.goto('/reader/what-counts/?kpMotion=full');
  await expect(page.locator('body')).toHaveAttribute('data-kp-animation-host-status', 'ready', { timeout: 60_000 });
  const before = await paint(page);
  await expect.poll(async () => (await metrics(page)).adjacentPrewarmCompilations, { timeout: 10_000 }).toBe(1);
  expect(await paint(page)).toEqual(before);
  const prepared = await metrics(page);
  await seek(page, 500);
  await paint(page);
  expect((await metrics(page)).canonicalSessionBuilds).toBe(prepared.canonicalSessionBuilds);
});

async function seek(page: Page, progress: number) {
  await page.locator('[data-kp-reader-attention-scrubber]').evaluate(async (element, value) => {
    if (!(element instanceof HTMLInputElement)) throw new Error('Missing semantic scrubber');
    element.value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  }, progress);
  await expect(page.locator('body')).toHaveAttribute('data-kp-reader-progress', String(progress));
}

const metrics = (page: Page) => page.evaluate(async () => {
  const path = '/src/reader/runtime/reader-runtime-metrics.ts';
  return (await import(/* @vite-ignore */ path)).inspectKpReaderRuntimeMetrics(window);
});

async function paint(page: Page) {
  const sample = await inspectPaint(page);
  const glyphs = sample.glyphs.filter(glyph => glyph.opacity > .01);
  expect(glyphs.length).toBeGreaterThan(0);
  expect(glyphs.every(glyph => glyph.transitionActive === 'true')).toBe(true);
  return glyphs.map(({ id, text, x, y, width, height, opacity }) =>
    ({ id, text, x, y, width, height, opacity })).sort((a, b) => a.id.localeCompare(b.id) || a.x - b.x);
}

for (const example of examples) test(`${example.slug}: automatic reuse preserves paint and invalidates stale preparation`, async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.goto(`/reader/${example.slug}/?kpMotion=full`);
  await expect(page.locator('body')).toHaveAttribute('data-kp-animation-host-status', 'ready', { timeout: 60_000 });
  const initial = await metrics(page);
  const references = new Map<number, Awaited<ReturnType<typeof paint>>>();
  for (const point of example.points) { await seek(page, point); references.set(point, await paint(page)); }
  const firstVisit = await metrics(page);
  expect(firstVisit.purePlanCompilations, 'Retained readers use one validated scene construction, without a separate pure-plan pass').toBe(0);
  expect(firstVisit.protectedTransitCompilations).toBeGreaterThan(0);
  for (let cycle = 0; cycle < 3; cycle++) for (const point of [...example.points].reverse().concat([...example.points])) {
    await seek(page, point);
    const actual = await paint(page), expected = references.get(point)!;
    expect(actual.length).toBe(expected.length);
    actual.forEach((glyph, index) => {
      const reference = expected[index]!;
      expect(glyph.id).toBe(reference.id); expect(glyph.text).toBe(reference.text);
      for (const key of ['x', 'y', 'width', 'height', 'opacity'] as const)
        expect(Math.abs(glyph[key] - reference[key]), `${point}: ${glyph.id} ${key}`).toBeLessThan(.25);
    });
    expect(await page.locator('.kp-reader-canonical-equation-session-material').count()).toBeLessThanOrEqual(example.capacity);
  }
  const repeated = await metrics(page);
  console.log(JSON.stringify({ reader: example.slug, browser: info.project.name,
    firstVisitBuilds: firstVisit.canonicalSessionBuilds,
    firstVisitBuildMs: Math.round(firstVisit.canonicalSessionBuildDurationMs),
    idleBuilds: firstVisit.adjacentPrewarmCompilations,
    preparationPhases: firstVisit.preparationPhases,
    reversalBuilds: repeated.canonicalSessionBuilds - firstVisit.canonicalSessionBuilds }));
  await info.attach('preparation-cost', { body: JSON.stringify({ initial, firstVisit, repeated }, null, 2), contentType: 'application/json' });
  expect(repeated.canonicalSessionBuilds, 'Returning to prepared scenes must not rebuild geometry').toBe(firstVisit.canonicalSessionBuilds);
  await seek(page, example.points.at(-1)!);
  expect((await metrics(page)).canonicalSessionApplies, 'A held mathematical frame does not need another paint apply').toBe(repeated.canonicalSessionApplies);

  // A presentation revision must not reuse a renderer prepared for another
  // motion contract, even when semantic progress and all dimensions match.
  const activeLayer = await page.locator('[data-kp-reader-transition-active="true"] .kp-reader-canonical-equation-session-material').elementHandle();
  expect(activeLayer).not.toBeNull();
  await page.locator('select[data-kp-reader-motion-preference]').selectOption('reduced', { force: true });
  await expect(page.locator('body')).toHaveAttribute('data-kp-reader-motion-mode', 'essential');
  expect(await activeLayer!.evaluate(node => node.isConnected)).toBe(false);
  await paint(page);
  await page.locator('select[data-kp-reader-motion-preference]').selectOption('full', { force: true });
  await expect(page.locator('body')).toHaveAttribute('data-kp-reader-motion-mode', 'continuous');
  await paint(page);

  const layers = await page.locator('.kp-reader-canonical-equation-session-material').elementHandles();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => Promise.all(layers.map(layer => layer.evaluate(node => node.isConnected))).then(values => values.every(value => !value))).toBe(true);
  for (const point of example.points) { await seek(page, point); await paint(page); }
  const fontLayers = await page.locator('.kp-reader-canonical-equation-session-material').elementHandles();
  await page.evaluate(() => document.fonts.dispatchEvent(new Event('loadingdone')));
  await expect.poll(async () => Promise.all(fontLayers.map(layer => layer.evaluate(node => node.isConnected))).then(values => values.every(value => !value))).toBe(true);
  await seek(page, example.points[0]); await paint(page);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(page.locator('.kp-reader-canonical-equation-session-material')).toHaveCount(0);
});
