import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`nearby tooltip returns through its scroll passage at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/fraction-notebook/?reading=1#beat.cancel-additive');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  await frame.evaluate(() => document.fonts.ready);
  const source = frame.locator('[data-kp-beat="beat.cancel-additive"] .kp-rising-passage');
  const tooltip = frame.locator('[data-object-comment=true]:not([hidden])');
  await expect(tooltip).toBeVisible();
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-progress', '167');
  const originalText = await source.locator('p').textContent();
  await expect(tooltip.locator('[data-kp-focus-deck-annotation]')).toHaveText(originalText!);
  const arrival = await frame.evaluate(() => {
    const beat = document.querySelector<HTMLElement>('[data-kp-beat="beat.cancel-additive"]')!;
    return scrollY + beat.getBoundingClientRect().top + beat.querySelector<HTMLElement>('.kp-rising-passage')!.offsetHeight
      - parseFloat(getComputedStyle(document.body).getPropertyValue('--kp-flow-line'));
  });
  const samples = new Map<number, unknown>();
  let sourceTop: number | undefined;
  // Seek beyond the tooltip, return by scrolling, and compare repeated samples.
  for (const offset of [200, 260, -170, -100, -16, 40, 90, 200, 40, -100, -170]) {
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
        withdrawal: overlay?.dataset['commentWithdrawal'], transform: style?.transform, opacity: style?.opacity,
        selectors: label?.dataset['anchorSelectors'] };
    });
    if (samples.has(offset)) expect(state).toEqual(samples.get(offset));
    samples.set(offset, state);
    if (offset < 100) {
      expect(state.active).toBe(true);
      expect(state.progress).toBe(167);
      expect(state.selectors).toBe('equation.fractional-linear.after-subtract.lhs.plus3 equation.fractional-linear.after-subtract.lhs.minus3');
      await expect(source).toHaveCSS('opacity', '0');
    } else {
      expect(state.active).toBe(false); expect(state.progress).toBeGreaterThan(167);
      await expect(source).toHaveCSS('opacity', '1');
      await expect(source).toHaveCSS('position', 'relative');
      await expect(source.locator('p')).toHaveText(originalText!);
      const box = (await source.boundingBox())!;
      if (offset === 260) expect(sourceTop! - box.y).toBeCloseTo(60, 0);
      if (offset === 200) sourceTop = box.y;
    }
    if (offset === -16 || offset === 40) { expect(state.emergence).toBe('1'); expect(state.opacity).toBe('1'); }
    if (offset === 40) {
      const gap = await frame.evaluate(() => {
        const label = document.querySelector<HTMLElement>('[data-object-comment=true]:not([hidden]) [data-kp-focus-deck-annotation]')!;
        const owner = document.querySelector<HTMLElement>('[data-kp-reader-native-endpoint]')!;
        const side = owner.dataset['kpReaderNativeEndpoint'];
        const native = owner.querySelector(`[data-kp-reader-transition-active=true] [data-kp-reader-native="${side}"]`)!;
        const targets = [...native.querySelectorAll<HTMLElement>('[data-kp-reader-selector-id]')].filter(node =>
          label.dataset['anchorSelectors']!.split(' ').includes(node.dataset['kpReaderSelectorId']!));
        return Math.min(...targets.map(node => node.getBoundingClientRect().top)) - label.getBoundingClientRect().bottom;
      });
      expect(gap).toBeCloseTo(16, 0);
    }
    await page.screenshot({ path: info.outputPath(`comment-${width}-${offset}.png`) });
  }
  // Existing outline navigation must return to the source hold, not to the
  // cancelled result, without replaying intermediate motion.
  await frame.locator('.kp-lesson-toc a[href="#beat.cancel-additive"]').evaluate((link: HTMLAnchorElement) => link.click());
  await expect(tooltip).toBeVisible();
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-progress', '167');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await frame.evaluate(async y => { scrollTo(0, y); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }, arrival - 100);
  await expect(frame.locator('[data-object-comment=true]:not([hidden])')).toHaveAttribute('data-comment-emergence', '1');
  await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
  await frame.locator('.kp-caption-reading-mode').evaluate((button: HTMLButtonElement) => button.click());
  await expect(frame.locator('body')).toHaveAttribute('data-kp-caption-mode', 'document');
  await expect(tooltip).toHaveCount(0);
  await expect(source).toHaveCSS('opacity', '1');
  await expect(source.locator('p')).toHaveText(originalText!);
  expect(errors).toEqual([]);
});
