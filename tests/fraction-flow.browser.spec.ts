import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) for (const reading of [false, true]) {
  test(`default fraction scroll at ${width}px, reading=${reading}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/experiments/fraction-notebook/${reading ? '?reading=1' : ''}#beat.cancel-additive`);
    await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
    if (!reading) await page.locator('.fn-animation-slot').scrollIntoViewIfNeeded();
    const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
    await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
    await frame.evaluate(() => document.fonts.ready);
    for (const id of ['beat.cancel-additive', 'beat.solve']) {
      const operation = await frame.locator(`[data-kp-beat="${id}"]`).evaluate(node => {
        const beat = node as HTMLElement, passage = beat.querySelector<HTMLElement>('.kp-rising-passage')!;
        return { arrival: scrollY + beat.getBoundingClientRect().top + passage.offsetHeight
          - parseFloat(getComputedStyle(document.body).getPropertyValue('--kp-flow-line')),
          start: Number(beat.dataset['kpOperationStart']), end: Number(beat.dataset['kpOperationEnd']),
          hold: parseFloat(getComputedStyle(beat).getPropertyValue('--kp-flow-hold')),
          position: getComputedStyle(passage).position };
      });
      expect(operation).toMatchObject({ hold: 380, position: 'sticky' });
      for (const distance of [50, 100, 170, 240, 380, 240, 100]) {
        const progress = await frame.evaluate(async top => {
          dispatchEvent(new WheelEvent('wheel')); scrollTo({ top, behavior: 'instant' });
          await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
          return Number(document.body.dataset['kpReaderProgress']);
        }, operation.arrival + distance);
        const amount = Math.max(0, (distance - 100) / 280);
        expect(Math.abs(progress - (operation.start + (operation.end - operation.start) * amount))).toBeLessThanOrEqual(2);
      }
    }
    await expect(frame.locator('[data-object-comment=true]:visible, [data-anchored-error]:visible')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
