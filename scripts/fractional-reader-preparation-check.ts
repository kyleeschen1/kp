import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from 'playwright';
import { inspectPaint, assertFractionalEvaluationPaint } from './fractional-linear-theme-comparison.ts';

/** Pressures actual prepared DOM, not a synthetic cache-hit counter. */
export async function checkFractionalReaderPreparation(page: Page, baseUrl: string, outputRoot: string) {
  // Force an available idle budget for this ownership test. Performance runs
  // use the browser's real budgets; this prevents load-dependent test coverage.
  await page.addInitScript(() => {
    const request = window.requestIdleCallback.bind(window);
    window.requestIdleCallback = (callback, options) => request(deadline => callback({
      didTimeout: deadline.didTimeout, timeRemaining: () => 50
    }), options);
  });
  await page.goto(new URL('/reader/solve-fractional-linear/?kpMotion=full', baseUrl).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const seek = async (progress: number) => {
    await page.locator('[data-kp-reader-attention-scrubber]').evaluate(async (node, value) => {
      if (!(node instanceof HTMLInputElement)) throw new Error('Expected semantic scrubber');
      node.value = String(value); node.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }, progress);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), String(progress));
    await assertFractionalEvaluationPaint(page);
  };
  const metrics = () => page.evaluate(async () => {
    const path = '/src/reader/runtime/reader-runtime-metrics.ts';
    return (await import(/* @vite-ignore */ path)).inspectKpReaderRuntimeMetrics(window);
  });
  const paint = async () => {
    const sample = await inspectPaint(page);
    return sample.glyphs.filter(glyph => glyph.opacity > .01).map(glyph => ({
      id: glyph.id, text: glyph.text, x: glyph.x, y: glyph.y,
      width: glyph.width, height: glyph.height, opacity: glyph.opacity
    })).sort((a, b) => a.id.localeCompare(b.id) || a.x - b.x);
  };
  const points = [233, 417, 750, 917];
  await page.waitForFunction(async () => {
    const path = '/src/reader/runtime/reader-runtime-metrics.ts';
    return (await import(/* @vite-ignore */ path)).inspectKpReaderRuntimeMetrics(window).adjacentPrewarmCompilations === 1;
  }, undefined, { timeout: 5000 });
  const initial = await metrics();
  assert.equal(initial.adjacentPrewarmCompilations, 1, 'Idle preparation must execute in this ownership test');
  assert.equal(initial.canonicalSessionApplies, 0, 'Preparing a hidden neighbor must not advance the visible equation');
  const references = new Map<number, Awaited<ReturnType<typeof paint>>>();
  for (const progress of points) { await seek(progress); references.set(progress, await paint()); }
  const warmed = await metrics();
  assert.equal(warmed.canonicalSessionBuilds, 4);
  for (let cycle = 0; cycle < 12; cycle++) {
    for (const progress of [...points].reverse().concat(points)) {
      await seek(progress);
      const actual = await paint();
      const expected = references.get(progress)!;
      assert.equal(actual.length, expected.length, `Visible ownership at ${progress}`);
      actual.forEach((glyph, index) => {
        const reference = expected[index]!;
        assert.equal(glyph.id, reference.id); assert.equal(glyph.text, reference.text);
        for (const key of ['x', 'y', 'width', 'height', 'opacity'] as const) {
          assert.ok(Math.abs(glyph[key] - reference[key]) < .25, `Stale ${key} at ${progress}: ${glyph[key]} vs ${reference[key]}`);
        }
      });
      assert.ok(await page.locator('.kp-reader-canonical-equation-session-material').count() <= 4);
    }
  }
  const repeated = await metrics();
  assert.equal(repeated.canonicalSessionBuilds, warmed.canonicalSessionBuilds, 'Warm reversal must not rebuild');
  const oldLayers = await page.locator('.kp-reader-canonical-equation-session-material').elementHandles();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  for (const layer of oldLayers) assert.equal(await layer.evaluate(node => node.isConnected), false, 'Resize retires every old preparation');
  for (const progress of points) await seek(progress);
  const resized = await metrics();
  const fontLayers = await page.locator('.kp-reader-canonical-equation-session-material').elementHandles();
  await page.evaluate(() => document.fonts.dispatchEvent(new Event('loadingdone')));
  await page.waitForTimeout(250);
  for (const layer of fontLayers) assert.equal(await layer.evaluate(node => node.isConnected), false, 'Font readiness invalidates retained geometry');
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  assert.equal(await page.locator('.kp-reader-canonical-equation-session-material').count(), 0);
  const report = { initial, warmed, repeated, resized, cycles: 12, points, resizeRetired: oldLayers.length, fontRetired: fontLayers.length, disposed: true };
  await writeFile(path.join(outputRoot, 'preparation.json'), JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
