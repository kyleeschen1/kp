import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`comment arrives from cancellation terms at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/fraction-notebook/?reading=1');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  await frame.evaluate(() => document.fonts.ready);
  const arrival = await frame.evaluate(() => {
    const beat = document.querySelector<HTMLElement>('[data-kp-beat="beat.cancel-additive"]')!;
    return scrollY + beat.getBoundingClientRect().top + beat.querySelector<HTMLElement>('.kp-rising-passage')!.offsetHeight
      - parseFloat(getComputedStyle(document.body).getPropertyValue('--kp-flow-line'));
  });
  const samples = new Map<number, unknown>();
  let readingBox: { x: number; y: number; width: number; height: number } | null = null;
  // Start inside the mathematical act: settled prose cannot depend on a cached
  // native source from having watched the approach first.
  for (const offset of [200, -170, -100, -16, 40, 90, 200, 40, -100, -170]) {
    await frame.evaluate(async y => {
      dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y);
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }, arrival + offset);
    await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
    const state = await frame.evaluate(() => {
      const overlay = document.querySelector<HTMLElement>('[data-object-comment=true]:not([hidden])');
      const label = overlay?.querySelector<HTMLElement>('[data-kp-focus-deck-annotation]');
      const style = label && getComputedStyle(label);
      return { progress: Number(document.body.dataset['kpReaderProgress']),
        active: !!overlay, emergence: overlay?.dataset['commentEmergence'],
        released: overlay?.dataset['commentReleased'],
        withdrawal: overlay?.dataset['commentWithdrawal'], transform: style?.transform, opacity: style?.opacity,
        selectors: label?.dataset['anchorSelectors'] };
    });
    if (samples.has(offset)) expect(state).toEqual(samples.get(offset));
    samples.set(offset, state);
    if (offset < 100) {
      expect(state.active).toBe(true);
      expect(state.progress).toBe(167);
      expect(state.selectors).toBe('equation.fractional-linear.after-subtract.lhs.plus3 equation.fractional-linear.after-subtract.lhs.minus3');
    } else {
      expect(state.active).toBe(true); expect(state.released).toBe('true'); expect(state.progress).toBeGreaterThan(167);
      await expect(frame.locator('[data-object-comment=true] path')).toHaveCount(0);
    }
    if (offset === -16 || offset === 40) { expect(state.emergence).toBe('1'); expect(state.opacity).toBe('1'); }
    if (offset === 40 || offset === 200) {
      const box = await frame.locator('[data-object-comment=true]:not([hidden]) [data-kp-focus-deck-annotation]').boundingBox();
      if (readingBox) expect(box).toEqual(readingBox);
      readingBox = box;
    }
    await page.screenshot({ path: info.outputPath(`comment-${width}-${offset}.png`) });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await frame.evaluate(async y => { scrollTo(0, y); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }, arrival - 100);
  await expect(frame.locator('[data-object-comment=true]:not([hidden])')).toHaveAttribute('data-comment-emergence', '1');
  await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
  expect(errors).toEqual([]);
});
