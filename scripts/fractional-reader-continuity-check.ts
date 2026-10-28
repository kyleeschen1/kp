import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from 'playwright';
import { createFractionalRisingScroll } from '../src/reader/app/fractional-rising-scroll.ts';
import { sampleKpReaderScrollPosition } from '../src/reader/runtime/continuous-scroll-clock.ts';

/** Actual one-pixel scroll changes must reach material geometry. Callback
 * cadence is reported separately and is not a count of presented frames. */
export async function checkFractionalReaderContinuity(page: Page, baseUrl: string, outputRoot: string, baseline: boolean) {
  await page.goto(new URL('/reader/solve-fractional-linear/?kpMotion=full', baseUrl).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const { geometry, anchor } = await measureFractionalScroll(page);
  const cases = [];
  // These interiors are the existing motifs' moving intervals, after their
  // intentional holds. A hold is not a repeated-frame regression.
  for (const [name, start, end] of [['cancellation', .237, .265], ['evaluation', .39, .42], ['denominator', .737, .765]] as const) {
    const from = Math.ceil(sampleKpReaderScrollPosition(start, geometry) - anchor);
    const to = Math.floor(sampleKpReaderScrollPosition(end, geometry) - anchor);
    const result = await page.evaluate(async ({ from, to }) => {
      const settle = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
      const paint = () => [...document.querySelectorAll<HTMLElement>(
        '[data-kp-reader-transition-active="true"] [data-kp-equation-material-owner-id]'
      )].map(owner => [owner.dataset['kpEquationMaterialOwnerId'], ...['left', 'top', 'width', 'height', 'transform', 'opacity']
        .map(property => owner.style.getPropertyValue(property)),
        ...['transform', 'clip-path'].map(property => owner.firstElementChild instanceof HTMLElement
          ? owner.firstElementChild.style.getPropertyValue(property) : '')]);
      dispatchEvent(new WheelEvent('wheel'));
      scrollTo(0, from); await settle();
      const samples = [];
      for (const direction of [1, -1]) {
        for (let y = direction === 1 ? from : to; direction === 1 ? y <= to : y >= from; y += direction) {
          scrollTo(0, y); await settle();
          samples.push({ direction, y: scrollY, progress: Number(document.body.dataset['kpReaderProgress']), signature: JSON.stringify(paint()) });
        }
      }
      return samples;
    }, { from, to });
    const forward = result.filter(sample => sample.direction === 1);
    const reverse = result.filter(sample => sample.direction === -1).reverse();
    assert.ok(forward.length > 20 && forward.every(sample => sample.signature !== '[]'), `${name} must exercise material motion`);
    const repeated = forward.slice(1).filter((sample, index) => sample.y !== forward[index]!.y && sample.signature === forward[index]!.signature).length;
    const mismatches = forward.filter((sample, index) => sample.signature !== reverse[index]!.signature).length;
    cases.push({ name, samples: forward.length, repeated, reversalMismatches: mismatches });
    if (!baseline) {
      assert.equal(repeated, 0, `${name}: changing scroll positions must not repeat rounded material geometry`);
      assert.equal(mismatches, 0, `${name}: reverse must reach identical material geometry`);
    }
  }
  const report = { baseline, environment: 'Chromium, settled one-pixel real-scroll samples; not a frame-rate benchmark', cases };
  await writeFile(path.join(outputRoot, `continuity-${baseline ? 'baseline' : 'current'}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

export async function measureFractionalScroll(page: Page) {
  const measured = await page.evaluate(() => ({
    stops: [...document.querySelectorAll<HTMLElement>('[data-kp-beat]')].map(beat => ({
      progressPermille: Number(beat.dataset['kpCheckpoint']),
      positionPx: scrollY + beat.getBoundingClientRect().top + beat.querySelector('.kp-rising-passage')!.getBoundingClientRect().height
    })),
    anchor: innerHeight * Number(document.body.dataset['kpReaderViewportAnchor']),
    available: innerHeight - document.querySelector('.kp-reader-masthead')!.getBoundingClientRect().height
  }));
  return { geometry: createFractionalRisingScroll({ stops: measured.stops }, measured.available), anchor: measured.anchor };
}
