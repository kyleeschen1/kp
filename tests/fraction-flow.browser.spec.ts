import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`compact bracket groups reserve scrolling only for animation at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/fraction-notebook/?reading=1#beat.cancel-additive');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  await frame.evaluate(() => document.fonts.ready);
  const source = frame.locator('[data-kp-beat="beat.cancel-additive"] .kp-rising-passage');
  const upcoming = frame.locator('[data-kp-beat="beat.simplify-difference"] .kp-rising-passage');
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-progress', '167');
  const originalText = await source.textContent();
  for (const passage of [source, upcoming]) {
    await expect(passage).toHaveCSS('position', 'sticky');
    await expect(passage).toHaveCSS('opacity', '1');
  }
  await expect(frame.locator('.anchored-labels:visible')).toHaveCount(0);
  // An operation can hold its cue while animating; wheel input stays native.
  await frame.evaluate(() => scrollBy({ top: 80, behavior: 'instant' }));
  await expect.poll(() => source.evaluate(node => node.getBoundingClientRect().top - parseFloat(getComputedStyle(node).top))).toBeCloseTo(0, 0);
  const input = await frame.evaluate(() => {
    const wheel = new WheelEvent('wheel', { deltaY: 30, bubbles: true, cancelable: true });
    document.querySelector('.kp-caption-sequence')!.dispatchEvent(wheel);
    return wheel.defaultPrevented;
  });
  expect(input).toBe(false);
  // Bring the next passage into view before its reading line; it must already
  // be readable, rather than waiting for an annotation/attention handoff.
  await upcoming.evaluate(node => scrollBy({ top: node.getBoundingClientRect().top - innerHeight * .75, behavior: 'instant' }));
  await expect(upcoming).toBeInViewport();
  await expect(upcoming).toHaveCSS('opacity', '1');
  await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
  const fit = await frame.evaluate(() => {
    const surface = document.querySelector<HTMLElement>('[data-kp-reader-transition-active=true] [data-kp-reader-fit-surface]')!;
    const bounds = JSON.parse(surface.dataset['kpReaderEquationFitCenteringBounds']!);
    const transform = new DOMMatrixReadOnly(getComputedStyle(surface).transform);
    const viewport = document.querySelector('.kp-reader-equation-viewport')!.getBoundingClientRect();
    const rail = document.querySelector('.kp-caption-frame')!.getBoundingClientRect();
    const active = document.querySelector<HTMLElement>('.kp-rising-passage[data-kp-caption-active=true]')!;
    const height = active.getBoundingClientRect().height;
    const equationHeight = parseFloat(document.body.style.getPropertyValue('--kp-document-equation-height'));
    const ordinary = [...document.querySelectorAll<HTMLElement>('[data-kp-beat]:not([data-kp-operation-id])')];
    return { center: (bounds.left + bounds.width / 2) * transform.a + transform.e,
      right: bounds.left * transform.a + transform.e + bounds.width * transform.a, width: viewport.width,
      frameHeight: rail.height, expectedHeight: height + equationHeight + 46,
      ordinary: ordinary.map(beat => ({ hold: parseFloat(getComputedStyle(beat).getPropertyValue('--kp-flow-hold')),
        gap: parseFloat(getComputedStyle(beat).marginBottom),
        position: getComputedStyle(beat.querySelector('.kp-rising-passage')!).position })),
      brackets: ['::before', '::after'].map(side => { const css = getComputedStyle(document.querySelector('.kp-caption-frame')!, side);
        return { display: css.display, width: css.width, height: parseFloat(css.height) }; }) };
  });
  expect(fit.center / fit.width).toBeGreaterThan(.4);
  expect(fit.center / fit.width).toBeLessThan(.6);
  expect(fit.right).toBeLessThanOrEqual(fit.width);
  expect(fit.frameHeight).toBeCloseTo(fit.expectedHeight, 0);
  expect(fit.ordinary.length).toBeGreaterThan(1);
  for (const reading of fit.ordinary) expect(reading).toEqual({ hold: 0, gap: 16, position: 'relative' });
  for (const bracket of fit.brackets) {
    expect(bracket.display).not.toBe('none'); expect(bracket.width).toBe('10px');
    expect(Math.abs(bracket.height - fit.frameHeight)).toBeLessThanOrEqual(2);
  }
  await page.screenshot({ path: info.outputPath(`flow-${width}.png`) });
  await frame.locator('.kp-lesson-toc a[href="#beat.cancel-additive"]').evaluate((link: HTMLAnchorElement) => link.click());
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-progress', '167');
  await expect(source).toHaveText(originalText!);
  await page.screenshot({ path: info.outputPath(`group-${width}.png`) });
  await frame.locator('.kp-lesson-toc a[href="#beat.read"]').evaluate((link: HTMLAnchorElement) => link.click());
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-progress', '0');
  const reading = frame.locator('[data-kp-beat="beat.read"] .kp-rising-passage');
  const readingTop = (await reading.boundingBox())!.y;
  await frame.evaluate(() => scrollBy({ top: 30, behavior: 'instant' }));
  await expect.poll(async () => readingTop - (await reading.boundingBox())!.y).toBeCloseTo(30, 0);
  await page.screenshot({ path: info.outputPath(`reading-${width}.png`) });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(upcoming).toHaveCSS('opacity', '1');
  await frame.locator('.kp-caption-reading-mode').evaluate((button: HTMLButtonElement) => button.click());
  await expect(frame.locator('body')).toHaveAttribute('data-kp-caption-mode', 'document');
  await expect(source).toHaveText(originalText!);
  expect(errors).toEqual([]);
});
