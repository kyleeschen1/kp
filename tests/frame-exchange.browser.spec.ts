import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`continuous frames exchange prominence at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/fraction-notebook/?rail=1&frames=1&reading=1');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  await expect(frame.locator('body')).toHaveAttribute('data-kp-frame-exchange', 'true');
  await frame.evaluate(() => document.fonts.ready);
  await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
  const structure = await frame.evaluate(() => {
    const sequence = document.querySelector('.kp-caption-sequence')!;
    const stage = document.querySelector('.kp-caption-stage-layer')!;
    const prose = document.querySelector('.kp-animation-beats')!;
    return { sequence: sequence.getBoundingClientRect().height, stage: stage.getBoundingClientRect().height,
      prose: prose.getBoundingClientRect().height, pin: document.querySelector('.kp-caption-pin')!.getBoundingClientRect().height,
      stageBackground: parseFloat(getComputedStyle(stage, '::before').height),
      proseBackground: parseFloat(getComputedStyle(prose, '::before').height),
      cards: [...document.querySelectorAll('.kp-caption-copy')].some(node => getComputedStyle(node, '::before').display !== 'none') };
  });
  expect(structure.stage).toBeCloseTo(structure.sequence, 0);
  expect(structure.prose).toBeCloseTo(structure.sequence, 0);
  expect(structure.stageBackground).toBeCloseTo(structure.sequence - 2, 0);
  expect(structure.proseBackground).toBeCloseTo(structure.sequence - 2, 0);
  expect(structure.stage).toBeGreaterThan(structure.pin * 5);
  expect(structure.cards).toBe(false);
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
      const stageLayer = document.querySelector('.kp-caption-stage-layer')!;
      const proseLayer = document.querySelector('.kp-animation-beats')!;
      const stageFrame = getComputedStyle(stageLayer, '::before');
      const proseFrame = getComputedStyle(proseLayer, '::before');
      const s = pin.getBoundingClientRect(), p = copy.getBoundingClientRect();
      const hitY = (Math.max(s.top, p.top) + Math.min(s.bottom, p.bottom)) / 2;
      return { front: document.body.dataset['kpFrameFront'],
        focus: Number(document.body.style.getPropertyValue('--kp-frame-prose-focus')),
        stageLayer: Number(getComputedStyle(stageLayer).zIndex), proseLayer: Number(getComputedStyle(proseLayer).zIndex),
        stageTop: s.top, stageOpacity: getComputedStyle(pin).opacity, proseOpacity: getComputedStyle(prose).opacity,
        stagePaper: stageFrame.backgroundColor, prosePaper: proseFrame.backgroundColor,
        stageTransform: stageFrame.transform, proseTransform: proseFrame.transform,
        progress: Number(document.body.dataset['kpReaderProgress']),
        proseHit: prose.contains(document.elementFromPoint(p.left + p.width / 2, hitY)) };
    }, geometry[key]);
    samples.push(sample);
    await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
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
  expect(samples[2]!.stagePaper).toContain('0.3'); expect(samples[2]!.prosePaper).toContain('0.72');
  expect(samples[2]).toEqual(samples[4]); expect(samples[1]).toEqual(samples[5]); expect(samples[0]).toEqual(samples[6]);
  // Later passages exchange the same two frames rather than creating new cards.
  for (const index of [3, 5, 3]) {
    const later = await frame.evaluate(async index => {
      const copy = document.querySelectorAll('.kp-caption-copy')[index]!;
      const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
      const top = parseFloat(getComputedStyle(pin).top);
      dispatchEvent(new WheelEvent('wheel'));
      scrollTo(0, scrollY + copy.getBoundingClientRect().top + copy.getBoundingClientRect().height / 2 - top - pin.offsetHeight / 2);
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      return { front: document.body.dataset['kpFrameFront'], top: pin.getBoundingClientRect().top, expected: top };
    }, index);
    expect(later.front).toBe('prose'); expect(later.top).toBeCloseTo(later.expected, 0);
    await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
    if (index === 5) await page.screenshot({ path: info.outputPath(`later-${width}.png`) });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await frame.locator('.kp-animation-beats').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node, '::before').transform).m42)).toBe(0);
  await page.setViewportSize({ width, height: 900 });
  await expect(frame.locator('.kp-caption-stage-layer')).toHaveCount(1);
  await expect(frame.locator('.kp-caption-pin')).toHaveCount(1);
  // Repeated measurements must not feed reserved stage height back into its
  // intrinsic commentary requirement and grow the stage on every resize.
  await expect.poll(() => frame.locator('.kp-caption-pin').evaluate(pin => pin.getBoundingClientRect().height)).toBe(structure.pin);
  await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
  expect(errors).toEqual([]);
});
