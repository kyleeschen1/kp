import assert from 'node:assert/strict';
import path from 'node:path';
import type { Page } from 'playwright';
import { checkFractionalPassageSlider } from './fractional-passage-slider-check.ts';

const settle = (page: Page) => page.waitForTimeout(260);

/** Focused document-flow candidate checks; equation paint has its own smoke. */
export async function checkFractionalRisingPassages(page: Page, baseUrl: string, outputRoot: string) {
  const url = new URL('/reader/solve-fractional-linear/', baseUrl).toString();
  for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('.kp-caption-operation-slider', { state: 'attached' });
    assert.equal(await page.locator('[data-kp-beat="beat.read"]').getAttribute('data-kp-operation-id'), null);
    assert.equal(await page.locator('.kp-caption-operation-slider').isVisible(), false);
    assert.equal(await page.locator('.kp-caption-pin [data-kp-reader-motion-preference]').count(), 0);
    assert.equal(await page.locator('.kp-reader-masthead [data-kp-reader-motion-preference]').count(), 1);
    await page.locator('.kp-rising-navigation summary').click();
    await page.getByRole('combobox', { name: 'Motion preference' }).selectOption('reduced');
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-motion-preference'), 'reduced');
    await page.getByRole('combobox', { name: 'Motion preference' }).selectOption('system');
    await page.screenshot({ path: path.join(outputRoot, `flow-preferences-${size.width}.png`) });
    await page.locator('.kp-rising-navigation summary').click();
    assert.equal(await page.locator('.kp-rising-passage').count(), 7);
    assert.equal(await page.locator('.kp-caption-preview, .kp-caption-scroll-slot, .kp-rising-passage[hidden]').count(), 0);
    assert.ok(await page.locator('.kp-rising-passage').evaluateAll((nodes) => nodes.every((node) =>
      getComputedStyle(node).position === 'sticky')));
    await page.evaluate(() => {
      dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await page.locator('.kp-rising-navigation summary').click();
    await page.locator('.kp-lesson-toc a[href="#beat.multiply"]').click();
    await settle(page);
    const geometry = await page.evaluate(() => {
      const passage = document.querySelector<HTMLElement>('[data-kp-rising-beat="beat.multiply"]')!;
      const beat = passage.parentElement!;
      const frame = document.querySelector('.kp-caption-frame')!.getBoundingClientRect();
      const header = document.querySelector('.kp-reader-masthead')!.getBoundingClientRect().height;
      const line = parseFloat(document.body.style.getPropertyValue('--kp-flow-line'));
      const hold = parseFloat(document.body.style.getPropertyValue('--kp-flow-hold'));
      return { arrival: scrollY + beat.getBoundingClientRect().top + passage.getBoundingClientRect().height - line,
        gap: parseFloat(document.body.style.getPropertyValue('--kp-flow-gap')),
        line, hold, header, cardCenter: (frame.top + frame.bottom) / 2,
        expectedCenter: header + (innerHeight - header) / 2 };
    });
    assert.ok(Math.abs(geometry.cardCenter - geometry.expectedCenter) < 1, 'Frame centers in the viewport below the header');
    const frames = [];
    for (const fraction of [0, .25, .5, .74, .9, 1, 1.1, 1.2, 1.1, .9, .5, 0]) {
      await page.evaluate((y) => { dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y); }, geometry.arrival + geometry.hold * fraction);
      await settle(page);
      const frame = await page.evaluate(() => {
        const passage = document.querySelector('[data-kp-rising-beat="beat.multiply"]')!;
        const next = document.querySelector('[data-kp-rising-beat="beat.cancel-denominator"]')!;
        return { bottom: passage.getBoundingClientRect().bottom, nextTop: next.getBoundingClientRect().top,
          cardBottom: document.querySelector('.kp-caption-frame')!.getBoundingClientRect().bottom,
          stageTop: document.querySelector('.kp-reader-equation-viewport')!.getBoundingClientRect().top,
          progress: Number(document.body.dataset['kpReaderProgress']) };
      });
      if (fraction <= 1) {
        assert.ok(Math.abs(frame.bottom - geometry.line) < 1.1, 'Real paragraph remains held throughout reading, action and inspection');
        assert.ok(frame.nextTop >= frame.cardBottom, 'Next paragraph stays below theater until the operation finishes');
      } else {
        assert.ok(frame.bottom < geometry.line - 20, 'Paragraph releases into ordinary document scrolling');
        assert.equal(frame.progress, 667, 'Equation holds while the next paragraph approaches');
      }
      if (fraction >= 1) assert.equal(frame.progress, 667);
      frames.push(frame);
      if ([.5, .9, 1.2].includes(fraction)) await page.screenshot({ path: path.join(outputRoot, `flow-${size.width}-${fraction}.png`) });
    }
    assert.deepEqual(frames[2], frames[10], 'Reversing reaches the same prose and math placement');
    assert.ok(Math.max(...frames.map((frame) => frame.stageTop)) - Math.min(...frames.map((frame) => frame.stageTop)) < 1,
      'Equation workspace must not move during paragraph travel');
    const exchanges = [];
    for (const offset of [0, 12, 24, 12, 0]) {
      await page.evaluate((y) => { dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y); }, geometry.arrival + geometry.hold + geometry.gap - 14 + offset);
      await settle(page);
      const exchange = await page.evaluate(() => {
        const previous = document.querySelector('[data-kp-rising-beat="beat.multiply"]')!;
        const next = document.querySelector('[data-kp-rising-beat="beat.cancel-denominator"]')!;
        return { previous: Number(getComputedStyle(previous).opacity), next: Number(getComputedStyle(next).opacity),
          gap: next.getBoundingClientRect().top - previous.getBoundingClientRect().bottom,
          sliderHidden: (document.querySelector('.kp-caption-operation-slider') as HTMLInputElement).hidden };
      });
      assert.ok(Math.abs(exchange.previous + exchange.next - 1.12) < .001, 'Paired emphasis is complementary');
      assert.ok(Math.abs(exchange.gap - geometry.gap) < 1, 'Paragraphs preserve their separation while moving');
      assert.ok(exchange.sliderHidden, 'Completed slider dissolves before the caption handoff');
      exchanges.push(exchange);
      if (offset === 12) await page.screenshot({ path: path.join(outputRoot, `flow-crossfade-${size.width}.png`) });
    }
    assert.deepEqual(exchanges[1], exchanges[3], 'Interrupted exchange reverses exactly');
    assert.ok(exchanges[0]!.previous > .98 && exchanges[2]!.next > .98);
    await checkFractionalPassageSlider(page, outputRoot, size.width);

    // Resize/wrapping must remeasure actual prose, keeping its mathematical moment.
    const before = await page.locator('body').getAttribute('data-kp-reader-progress');
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-kp-rising-beat="beat.multiply"] p')!.style.fontSize = '22px';
    });
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), before);
    await page.locator('.kp-rising-navigation summary').click();
    await page.locator('.kp-lesson-toc a[href="#beat.multiply"]').click();
    await settle(page);
    assert.ok(await page.locator('[data-kp-rising-beat="beat.multiply"]').evaluate((node) =>
      Math.abs(node.getBoundingClientRect().bottom - parseFloat(document.body.style.getPropertyValue('--kp-flow-line'))) < 1.1));
    await page.screenshot({ path: path.join(outputRoot, `flow-long-prose-${size.width}.png`) });
    await page.reload({ waitUntil: 'networkidle' });
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), '500');
    assert.equal(await page.evaluate(() => 'find' in window && typeof window.find === 'function' && window.find('The same x remains')), true);
    await settle(page);
    assert.equal(await page.locator('.kp-rising-passage[hidden]').count(), 0);
    await page.evaluate(() => { window.getSelection()?.removeAllRanges(); location.hash = 'caption.beat.multiply'; });
    await settle(page);
    const returnBeat = await page.locator('[data-kp-caption-active="true"]').getAttribute('data-kp-rising-beat');
    await page.getByRole('button', { name: 'Read all', exact: true }).click();
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-caption-mode'), 'document');
    assert.ok(await page.locator('.kp-rising-passage').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
    const held = await page.locator('body').getAttribute('data-kp-reader-progress');
    await page.evaluate(() => scrollBy(0, 120));
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), held);
    await page.getByRole('button', { name: 'Read all', exact: true }).click();
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-caption-mode'), 'captions');
    assert.equal(await page.locator('[data-kp-caption-active="true"]').getAttribute('data-kp-rising-beat'), returnBeat,
      'Returning from the transcript must retain the selected paragraph');
    await page.locator('.kp-rising-navigation summary').click();
    await page.locator('.kp-lesson-toc a[href="#beat.solve"]').click();
    await page.locator('.kp-caption-operation-slider').press('End');
    await settle(page);
    const release = await page.locator('.kp-caption-sequence').evaluate((node) => {
      const frame = document.querySelector('.kp-caption-frame')!.getBoundingClientRect();
      const target = parseFloat(getComputedStyle(document.querySelector('.kp-caption-pin')!).top);
      return scrollY + node.getBoundingClientRect().bottom - frame.height - target;
    });
    await page.evaluate((y) => { dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y); }, release + 100);
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), '1000');
    assert.ok(await page.locator('.kp-caption-pin').evaluate((node) =>
      node.getBoundingClientRect().top < parseFloat(getComputedStyle(node).top) - 90));
    await page.screenshot({ path: path.join(outputRoot, `flow-release-${size.width}.png`) });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.kp-caption-preview').count(), 0);
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.kp-rising-passage').evaluateAll((nodes) => nodes.every((node) =>
    getComputedStyle(node).position !== 'sticky' && !node.hasAttribute('hidden'))), true);
  await page.emulateMedia({ media: 'screen' });
  await settle(page);
  const context = await page.context().browser()!.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await context.newPage();
    await staticPage.goto(url, { waitUntil: 'networkidle' });
    assert.equal(await staticPage.locator('.kp-rising-passage').count(), 7);
    assert.equal(await staticPage.locator('.kp-rising-passage').evaluateAll((nodes) => nodes.every((node) =>
      getComputedStyle(node).position === 'static' && !node.hasAttribute('hidden'))), true);
    assert.ok(await staticPage.locator('.kp-animation-beats > li').evaluateAll((nodes) => nodes.every((node) =>
      node.getBoundingClientRect().height - node.querySelector('.kp-rising-passage')!.getBoundingClientRect().height < 60)),
      'No-JS prose must not retain empty animation hold distances');
    assert.ok(await staticPage.locator('.kp-animation-static .katex').first().isVisible());
  } finally { await context.close(); }
  console.log('Document-flow passages: desktop/phone centering, real prose, holds, release, reversal, sliders, font reflow, native find, Read all and static/print passed.');
}
