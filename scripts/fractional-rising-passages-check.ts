import assert from 'node:assert/strict';
import path from 'node:path';
import type { Page } from 'playwright';

const settle = (page: Page) => page.waitForTimeout(260);

/** Focused document-flow candidate checks; equation paint has its own smoke. */
export async function checkFractionalRisingPassages(page: Page, baseUrl: string, outputRoot: string) {
  const url = new URL('/reader/solve-fractional-linear/', baseUrl).toString();
  for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('body[data-kp-reader-hydrated="true"]');
    await page.waitForSelector('.kp-reader-options [data-kp-dev-toolbar]', { state: 'attached' });
    assert.equal(await page.locator('.kp-caption-document-intro h1').isVisible(), true);
    assert.equal(await page.locator('.kp-document-byline').textContent(), 'By Codex');
    assert.equal(await page.locator('.kp-reader-options [data-kp-dev-toolbar]').isVisible(), false);
    assert.deepEqual(await page.locator('.kp-reader-masthead').evaluate(node => [...node.children].map(child => child.className)),
      ['kp-reader-wordmark', 'kp-rising-navigation']);
    const widths = await page.evaluate(() => {
      const prose = document.querySelector('.kp-caption-document-intro > p:not(.kp-document-byline)')!.getBoundingClientRect();
      const frame = document.querySelector('.kp-caption-frame')!.getBoundingClientRect();
      return { prose: prose.width, frame: frame.width, leftDifference: prose.left - frame.left };
    });
    assert.ok(Math.abs(widths.prose - widths.frame) < 1 && Math.abs(widths.leftDifference) < 1,
      'Ordinary prose occupies the full rail-to-rail width');
    await page.screenshot({ path: path.join(outputRoot, `document-opening-${size.width}.png`) });
    assert.equal(await page.locator('[data-kp-beat="beat.read"]').getAttribute('data-kp-operation-id'), null);
    assert.equal(await page.locator('.kp-caption-operation-slider').count(), 0);
    assert.equal(await page.locator('.kp-caption-pin [data-kp-reader-motion-preference]').count(), 0);
    assert.equal(await page.locator('.kp-reader-masthead [data-kp-reader-motion-preference]').count(), 1);
    await page.locator('.kp-rising-navigation > summary').click();
    await page.getByRole('combobox', { name: 'Motion preference' }).selectOption('reduced');
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-motion-preference'), 'reduced');
    await page.getByRole('combobox', { name: 'Motion preference' }).selectOption('system');
    await page.screenshot({ path: path.join(outputRoot, `flow-preferences-${size.width}.png`) });
    await page.locator('.kp-reader-options .kp-dev-toolbar__review').click();
    assert.equal(await page.locator('.kp-rising-navigation').getAttribute('open'), null,
      'Opening review releases the options menu');
    const review = page.locator('[data-kp-dev-review-shell]');
    assert.equal(await review.locator('.panel').isVisible(), true);
    await review.locator('.close').click();
    assert.equal(await page.locator('.kp-reader-options .kp-dev-toolbar__review').evaluate(node => document.activeElement === node), true,
      'Closing review restores its accessible launcher inside Options');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.kp-rising-navigation').getAttribute('open'), null);
    assert.equal(await page.locator('.kp-rising-navigation > summary').evaluate(node => document.activeElement === node), true);
    assert.equal(await page.locator('.kp-rising-passage').count(), 7);
    assert.equal(await page.locator('.kp-caption-preview, .kp-caption-scroll-slot, .kp-rising-passage[hidden]').count(), 0);
    const accessiblePassage = page.locator('[data-kp-rising-beat="beat.cancel-denominator"]');
    assert.equal(await accessiblePassage.evaluate(node => getComputedStyle(node).opacity), '0');
    assert.equal(await accessiblePassage.evaluate(node => getComputedStyle(node).pointerEvents), 'none');
    await accessiblePassage.evaluate(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      const selection = document.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
    });
    await settle(page);
    assert.equal(await accessiblePassage.evaluate(node => getComputedStyle(node).opacity), '1', 'Selecting hidden prose reveals its real text');
    await page.evaluate(() => document.getSelection()?.removeAllRanges());
    await settle(page);
    assert.equal(await accessiblePassage.evaluate(node => getComputedStyle(node).opacity), '0', 'Clearing selection restores scroll-derived presence');
    assert.ok(await page.locator('.kp-rising-passage').evaluateAll((nodes) => nodes.every((node) =>
      getComputedStyle(node).position === 'sticky')));
    await page.evaluate(() => {
      dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await page.locator('.kp-rising-navigation > summary').click();
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
        gap: parseFloat(getComputedStyle(beat).getPropertyValue('--kp-flow-gap')),
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
          nextAlpha: Number(getComputedStyle(next).opacity),
          cardBottom: document.querySelector('.kp-caption-frame')!.getBoundingClientRect().bottom,
          stageTop: document.querySelector('.kp-reader-equation-viewport')!.getBoundingClientRect().top,
          progress: Number(document.body.dataset['kpReaderProgress']) };
      });
      if (fraction <= 1) {
        assert.ok(Math.abs(frame.bottom - geometry.line) < 1.1, 'Real paragraph remains held throughout reading, action and inspection');
        assert.ok(frame.nextAlpha <= .08, 'Next paragraph stays contextual until the operation finishes');
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
    for (const fraction of [1.35, 1.6]) {
      await page.evaluate(y => { dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y); }, geometry.arrival + geometry.hold * fraction);
      await settle(page);
      await page.screenshot({ path: path.join(outputRoot, `flow-depth-${size.width}-${fraction}.png`) });
    }
    const nextArrival = await page.locator('[data-kp-beat="beat.cancel-denominator"]').evaluate(node =>
      scrollY + node.getBoundingClientRect().top + node.querySelector('.kp-rising-passage')!.getBoundingClientRect().height -
      parseFloat(document.body.style.getPropertyValue('--kp-flow-line')));
    const completedAt = geometry.arrival + geometry.hold;
    assert.ok(geometry.gap > 120 && nextArrival - completedAt > 160,
      'The handoff must preserve generous physical spacing, not compress paragraphs to hide a blank interval');
    for (let position = completedAt; position <= nextArrival + 24; position += 12) {
      await page.evaluate(y => { dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y); }, position);
      await settle(page);
      const readable = await page.locator('.kp-rising-passage').evaluateAll(nodes => {
        const headerBottom = document.querySelector('.kp-reader-masthead')!.getBoundingClientRect().bottom;
        return nodes.some(node => {
          const rect = node.getBoundingClientRect();
          return Number(getComputedStyle(node).opacity) >= .98 &&
            (node as HTMLElement).dataset['kpPassageLayer'] === 'front' &&
            rect.top >= headerBottom && rect.bottom <= innerHeight;
        });
      });
      assert.ok(readable, 'A fully opaque foreground explanation must fit in the visible viewport throughout the handoff');
      assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), '667',
        'The equation rests while its explanations exchange');
    }
    const exchanges = [];
    for (const offset of [0, 12, 24, 36, 48, 36, 24, 12, 0]) {
      await page.evaluate((y) => { dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y); }, nextArrival - 24 + offset);
      await settle(page);
      const exchange = await page.evaluate(() => {
        const previous = document.querySelector('[data-kp-rising-beat="beat.multiply"]')!;
        const next = document.querySelector('[data-kp-rising-beat="beat.cancel-denominator"]')!;
        return { previous: Number(getComputedStyle(previous).opacity), next: Number(getComputedStyle(next).opacity),
          gap: next.getBoundingClientRect().top - previous.getBoundingClientRect().bottom };
      });
      if (offset <= 24) {
        assert.ok(exchange.previous >= .98, 'Outgoing prose stays readable until incoming prose has fully arrived');
        assert.ok(Math.abs(exchange.gap - geometry.gap) < 1, 'Paragraphs preserve their separation while moving');
      }
      if (offset === 48) assert.ok(exchange.previous <= .081, 'Outgoing prose withdraws after the handoff');
      assert.ok(Math.max(exchange.previous, exchange.next) >= .98, 'A handoff must not dim both explanations together');
      exchanges.push(exchange);
      if (offset === 12) await page.screenshot({ path: path.join(outputRoot, `flow-crossfade-${size.width}.png`) });
    }
    assert.deepEqual(exchanges[3], exchanges[5], 'Interrupted exchange reverses exactly');
    assert.ok(exchanges[0]!.next <= .08 && exchanges[2]!.next > .98, 'Faint approaching context rises into readable foreground near presentation');
    const lineHeight = await page.locator('.kp-rising-passage p').first().evaluate(node => {
      const style = getComputedStyle(node); return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
    });
    assert.ok(lineHeight >= 1.79, 'Prose has roomier line spacing');
    // Native scroll/URL restoration must retain operation ownership without a slider.
    await page.locator('.kp-rising-navigation > summary').click();
    await page.locator('.kp-lesson-toc a[href="#beat.multiply"]').click();
    await settle(page);
    await page.evaluate(y => { dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y); }, geometry.arrival + geometry.hold * .65);
    await settle(page);
    const restored = Number(await page.locator('body').getAttribute('data-kp-reader-progress'));
    await page.reload({ waitUntil: 'networkidle' });
    await settle(page);
    assert.ok(Math.abs(Number(await page.locator('body').getAttribute('data-kp-reader-progress')) - restored) <= 1,
      'Reload retains a partially completed operation without its retired control');

    // Resize/wrapping must remeasure actual prose, keeping its mathematical moment.
    const before = await page.locator('body').getAttribute('data-kp-reader-progress');
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-kp-rising-beat="beat.multiply"] p')!.style.fontSize = '22px';
    });
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), before);
    const spacing = await page.locator('.kp-animation-beats > li').evaluateAll(nodes => nodes.map(node => ({
      arrival: node.getBoundingClientRect().top + node.querySelector('.kp-rising-passage')!.getBoundingClientRect().height,
      height: node.querySelector('.kp-rising-passage')!.getBoundingClientRect().height,
      hold: parseFloat(getComputedStyle(node).getPropertyValue('--kp-flow-hold')),
      gap: parseFloat(getComputedStyle(node).getPropertyValue('--kp-flow-gap'))
    })));
    for (let i = 1; i < spacing.length; i++) {
      assert.ok(spacing[i - 1]!.gap > 120, 'Prose reflow must retain breathing room');
      assert.ok(Math.abs(spacing[i]!.arrival - spacing[i - 1]!.arrival - spacing[i - 1]!.hold -
        spacing[i]!.height - spacing[i - 1]!.gap) < 1, 'Passage spacing remains natural and stable after reflow');
    }
    await page.locator('.kp-rising-navigation > summary').click();
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
    assert.equal(await page.evaluate(() => {
      const anchor = window.getSelection()?.anchorNode;
      const element = anchor instanceof Element ? anchor : anchor?.parentElement;
      const passage = element?.closest('.kp-rising-passage');
      return passage ? getComputedStyle(passage).opacity : undefined;
    }), '1', 'Native find must reveal the actual matched paragraph');
    assert.equal(await page.locator('.kp-rising-passage[hidden]').count(), 0);
    await page.evaluate(() => { window.getSelection()?.removeAllRanges(); location.hash = 'caption.beat.multiply'; });
    await settle(page);
    const returnBeat = await page.locator('[data-kp-caption-active="true"]').getAttribute('data-kp-rising-beat');
    await page.locator('.kp-rising-navigation > summary').click();
    await page.getByRole('button', { name: 'Read all', exact: true }).click();
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-caption-mode'), 'document');
    assert.ok(await page.locator('.kp-rising-passage').evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === '1')));
    const held = await page.locator('body').getAttribute('data-kp-reader-progress');
    await page.evaluate(() => scrollBy(0, 120));
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), held);
    await page.locator('.kp-rising-navigation > summary').click();
    await page.getByRole('button', { name: 'Read all', exact: true }).click();
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-kp-caption-mode'), 'captions');
    assert.equal(await page.locator('[data-kp-caption-active="true"]').getAttribute('data-kp-rising-beat'), returnBeat,
      'Returning from the transcript must retain the selected paragraph');
    await page.locator('.kp-rising-navigation > summary').click();
    await page.locator('.kp-lesson-toc a[href="#beat.solve"]').click();
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
  console.log('Document-flow passages: desktop/phone centering, readable generous exchange, held math, release, reversal, slider retirement, font reflow, native find, Read all and static/print passed.');
}
