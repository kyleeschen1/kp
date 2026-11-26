import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`first passage exchanges frame prominence at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/fraction-notebook/?rail=1&frames=1&reading=1');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  await expect(frame.locator('body')).toHaveAttribute('data-kp-frame-exchange', 'true');
  await frame.evaluate(() => document.fonts.ready);
  const geometry = await frame.evaluate(() => {
    const copy = document.querySelector('.kp-caption-copy')!.getBoundingClientRect();
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const top = parseFloat(getComputedStyle(pin).top), height = pin.offsetHeight;
    return { top, before: scrollY + copy.top - top - height - 52,
      approach: scrollY + copy.top - top - height - 28,
      overlap: scrollY + (copy.top + copy.bottom) / 2 - top - height / 2,
      cleared: scrollY + copy.bottom - top + 52 };
  });
  const samples = [];
  for (const key of ['before', 'approach', 'overlap', 'cleared', 'overlap', 'approach', 'before'] as const) {
    const sample = await frame.evaluate(async y => {
      dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y);
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
      const prose = document.querySelector<HTMLElement>('.kp-rising-passage')!;
      const copy = prose.querySelector('.kp-caption-copy')!;
      const stageFrame = getComputedStyle(pin.querySelector('.kp-caption-frame')!);
      const proseFrame = getComputedStyle(copy, '::before');
      const s = pin.getBoundingClientRect(), p = copy.getBoundingClientRect();
      const hitY = (Math.max(s.top, p.top) + Math.min(s.bottom, p.bottom)) / 2;
      return { front: document.body.dataset['kpFrameFront'],
        focus: Number(document.body.style.getPropertyValue('--kp-frame-prose-focus')),
        stageLayer: Number(getComputedStyle(pin).zIndex), proseLayer: Number(getComputedStyle(prose).zIndex),
        stageTop: s.top, stageOpacity: getComputedStyle(pin).opacity, proseOpacity: getComputedStyle(prose).opacity,
        stagePaper: stageFrame.backgroundColor, prosePaper: proseFrame.backgroundColor,
        stageTransform: stageFrame.transform, proseTransform: proseFrame.transform,
        progress: Number(document.body.dataset['kpReaderProgress']),
        proseHit: prose.contains(document.elementFromPoint(p.left + p.width / 2, hitY)) };
    }, geometry[key]);
    samples.push(sample);
    expect(sample.progress).toBe(0); // isolate the handoff from algebraic motion
    expect(sample.stageTop).toBeCloseTo(geometry.top, 0);
    expect(sample.stageOpacity).toBe('1'); expect(sample.proseOpacity).toBe('1');
    if (key === 'overlap' || key === 'cleared') await page.screenshot({ path: info.outputPath(`${key}-${width}.png`) });
  }
  expect(samples[0]!.front).toBe('stage');
  expect(samples[2]!.front).toBe('prose'); expect(samples[2]!.proseHit).toBe(true);
  expect(samples[2]!.proseLayer).toBeGreaterThan(samples[2]!.stageLayer);
  expect(samples[3]!.front).toBe('stage');
  expect(samples[3]!.stageLayer).toBeGreaterThan(samples[3]!.proseLayer);
  expect(samples[2]!.stagePaper).toContain('0.9'); expect(samples[2]!.prosePaper).toContain('0.94');
  expect(samples[2]).toEqual(samples[4]); expect(samples[1]).toEqual(samples[5]); expect(samples[0]).toEqual(samples[6]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await frame.locator('.kp-caption-frame').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42)).toBe(0);
  expect(errors).toEqual([]);
});
