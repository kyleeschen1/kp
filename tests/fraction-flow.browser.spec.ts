import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`fraction prose flows past an indented equation at ${width}px`, async ({ page }, info) => {
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
    await expect(passage).toHaveCSS('position', 'relative');
    await expect(passage).toHaveCSS('opacity', '1');
  }
  await expect(frame.locator('.anchored-labels:visible')).toHaveCount(0);
  const before = (await source.boundingBox())!;
  // Real document motion, not a scroll-to-stop adapter or sticky caption.
  await frame.evaluate(() => scrollBy({ top: 80, behavior: 'instant' }));
  await expect.poll(async () => before.y - (await source.boundingBox())!.y).toBeCloseTo(80, 0);
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
    const bounds = JSON.parse(surface.dataset['kpReaderEquationFitBounds']!);
    const transform = new DOMMatrixReadOnly(getComputedStyle(surface).transform);
    const viewport = document.querySelector('.kp-reader-equation-viewport')!.getBoundingClientRect();
    const rail = document.querySelector('.kp-caption-frame')!.getBoundingClientRect();
    return { indent: viewport.left - rail.left + bounds.left * transform.a + transform.e,
      right: bounds.left * transform.a + transform.e + bounds.width * transform.a, width: viewport.width,
      expected: parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.5 };
  });
  expect(fit.indent).toBeCloseTo(fit.expected, 0);
  expect(fit.right).toBeLessThanOrEqual(fit.width);
  await page.screenshot({ path: info.outputPath(`flow-${width}.png`) });
  await frame.locator('.kp-lesson-toc a[href="#beat.cancel-additive"]').evaluate((link: HTMLAnchorElement) => link.click());
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-progress', '167');
  await expect(source).toHaveText(originalText!);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(upcoming).toHaveCSS('opacity', '1');
  await frame.locator('.kp-caption-reading-mode').evaluate((button: HTMLButtonElement) => button.click());
  await expect(frame.locator('body')).toHaveAttribute('data-kp-caption-mode', 'document');
  await expect(source).toHaveText(originalText!);
  expect(errors).toEqual([]);
});
