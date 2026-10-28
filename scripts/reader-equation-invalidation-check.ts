import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from 'playwright';

/** Both prepared callers must separate prose reflow from equation metrics. */
export async function checkReaderEquationInvalidation(page: Page, baseUrl: string, outputRoot: string, baseline: boolean) {
  const results = [];
  for (const route of ['solve-fractional-linear', 'divide-both-sides']) {
    await page.goto(new URL(`/reader/${route}/?kpProgress=750&kpMotion=full`, baseUrl).href, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.dataset['kpAnimationHostStatus'] === 'ready');
    const layers = await page.locator('.kp-reader-canonical-equation-session-material').elementHandles();
    assert.ok(layers.length > 0);
    const reads = await page.locator('[data-kp-reader-equation-stage]').getAttribute('data-kp-reader-layout-reads');
    await page.locator('[data-kp-beat] .kp-beat-copy').first().evaluate(node => {
      if (!(node instanceof HTMLElement)) throw new Error('Missing prose');
      node.style.paddingBottom = '37px';
    });
    await page.waitForTimeout(250);
    const proseRetired = (await Promise.all(layers.map(layer => layer.evaluate(node => !node.isConnected)))).filter(Boolean).length;
    const proseReads = await page.locator('[data-kp-reader-equation-stage]').getAttribute('data-kp-reader-layout-reads');
    if (!baseline) { assert.equal(proseRetired, 0, `${route}: prose must retain preparation`); assert.equal(proseReads, reads); }
    const beforeFont = await page.locator('.kp-reader-canonical-equation-session-material').elementHandles();
    await page.evaluate(() => {
      document.fonts.dispatchEvent(new FontFaceSetLoadEvent('loadingdone', {
        fontfaces: [new FontFace('KP_unused_probe', 'local(Arial)')]
      }));
    });
    await page.waitForTimeout(250);
    const unrelatedFontRetired = (await Promise.all(beforeFont.map(layer => layer.evaluate(node => !node.isConnected)))).filter(Boolean).length;
    if (!baseline) assert.equal(unrelatedFontRetired, 0, `${route}: unrelated fonts must retain preparation`);
    await page.locator('[data-kp-reader-attention-scrubber]').evaluate(node => {
      if (!(node instanceof HTMLInputElement)) throw new Error('Missing progress');
      node.value = '750'; node.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    const beforeMathFont = await page.locator('.kp-reader-canonical-equation-session-material').elementHandles();
    assert.ok(beforeMathFont.length > 0);
    await page.evaluate(() => {
      const font = [...document.fonts].find(face => face.family.includes('KaTeX_Main'));
      if (!font) throw new Error('Missing used math font');
      document.fonts.dispatchEvent(new FontFaceSetLoadEvent('loadingdone', { fontfaces: [font] }));
    });
    await page.waitForTimeout(250);
    const mathFontRetired = (await Promise.all(beforeMathFont.map(layer => layer.evaluate(node => !node.isConnected)))).filter(Boolean).length;
    assert.equal(mathFontRetired, beforeMathFont.length, `${route}: equation fonts must retire preparation`);
    results.push({ route, initialLayers: layers.length, reads, proseRetired, proseReads, unrelatedFontRetired, mathFontRetired });
  }
  await writeFile(path.join(outputRoot, `invalidation-${baseline ? 'baseline' : 'current'}.json`), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
