import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`rail emergence and stage lift at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/fraction-notebook/?rail=1&frames=1&reading=1');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  await frame.evaluate(() => document.fonts.ready);
  const geometry = await frame.evaluate(() => {
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const top = parseFloat(getComputedStyle(pin).top), height = pin.offsetHeight;
    const paragraphs = [...document.querySelectorAll<HTMLElement>('.kp-rising-passage')].map(passage => {
      const copy = passage.querySelector<HTMLElement>('.kp-caption-copy')!;
      const bottom = scrollY + passage.getBoundingClientRect().bottom - parseFloat(getComputedStyle(passage).paddingBottom);
      return { start: bottom - copy.offsetHeight - top - height / 2, height: copy.offsetHeight };
    });
    return { top, height, paragraphs };
  });
  const sample = (index: number, travel: number) => frame.evaluate(async ({ index, y }) => {
    dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y);
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const copy = document.querySelectorAll<HTMLElement>('.kp-caption-copy')[index]!;
    const sequence = document.querySelector('.kp-caption-sequence')!;
    const rect = copy.getBoundingClientRect(), stage = pin.getBoundingClientRect();
    return { presence: Number(getComputedStyle(copy).opacity), copyScale: rect.width / copy.offsetWidth,
      stageScale: stage.width / pin.offsetWidth, stageFocus: Number(document.body.style.getPropertyValue('--kp-frame-stage-focus')),
      left: rect.left, rail: sequence.getBoundingClientRect().left + parseFloat(getComputedStyle(sequence, '::after').left),
      top: rect.top, center: parseFloat(getComputedStyle(pin).top) + pin.offsetHeight / 2,
      progress: Number(document.body.dataset['kpReaderProgress']), height: pin.offsetHeight,
      stageTransform: getComputedStyle(pin).transform, copyTransform: getComputedStyle(copy).transform };
  }, { index, y: geometry.paragraphs[index]!.start + travel });
  const samples = [];
  for (const travel of [-8, 12, 48, 110, 48, 12, -8]) {
    const state = await sample(0, travel); samples.push(state);
    expect(state.progress).toBe(0);
    expect(state.left).toBeCloseTo(state.rail, 0);
    expect(state.height).toBe(geometry.height);
    await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
    if (travel > 0) await expect(frame.locator('.anchored-labels')).toBeHidden();
    if (travel === 12 || travel === 110) await page.screenshot({ path: info.outputPath(`emerge-${travel}-${width}.png`) });
  }
  expect(samples[0]!.presence).toBe(0); expect(samples[0]!.stageScale).toBeGreaterThan(1.01);
  expect(samples[1]!.presence).toBeGreaterThan(.4); expect(samples[1]!.presence).toBeLessThan(.6);
  expect(samples[1]!.top).toBeCloseTo(samples[1]!.center - 12, 0);
  expect(samples[2]!.copyScale).toBeGreaterThan(1.01);
  expect(samples[3]!.copyScale).toBeCloseTo(1, 2); expect(samples[3]!.presence).toBe(1);
  expect(samples[3]!.stageFocus).toBe(0);
  expect(samples[0]).toEqual(samples[6]); expect(samples[1]).toEqual(samples[5]); expect(samples[2]).toEqual(samples[4]);
  const anchorGap = await frame.evaluate(() => {
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const label = pin.querySelector<HTMLElement>('.anchored-labels [data-anchor-selectors]')!;
    const owner = pin.querySelector<HTMLElement>('[data-kp-reader-native-endpoint]')!;
    const endpoint = owner.querySelector(`[data-kp-reader-transition-active=true] [data-kp-reader-native="${owner.dataset['kpReaderNativeEndpoint']}"]`)!;
    const selectors = label.dataset['anchorSelectors']!.split(' ');
    const top = Math.min(...selectors.map(id => endpoint.querySelector(`[data-kp-reader-selector-id="${CSS.escape(id)}"]`)!.getBoundingClientRect().top));
    return (top - label.getBoundingClientRect().bottom) / (pin.getBoundingClientRect().height / pin.offsetHeight);
  });
  expect(anchorGap).toBeCloseTo(32, 0);
  await sample(0, 110);
  await expect(frame.locator('.anchored-labels')).toBeHidden();
  // Later passages use the same projection; their preceding math is at rest.
  for (const index of [3, 5]) {
    const entering = await sample(index, 12), settled = await sample(index, 110);
    expect(entering.progress).toBe(settled.progress);
    expect(settled.presence).toBe(1); expect(settled.copyScale).toBeCloseTo(1, 2);
    await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
  }
  // Native material transit still runs for its full 280 CSS pixels while the
  // elevated stage has attention; a presentation scale cannot move its clock.
  const operation = await frame.evaluate(() => {
    const beat = document.querySelectorAll<HTMLElement>('[data-kp-operation-id]')[1]!;
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    return { from: scrollY + beat.querySelector('.kp-rising-passage')!.getBoundingClientRect().bottom - parseFloat(getComputedStyle(pin).top) + 100,
      start: Number(beat.dataset['kpOperationStart']), end: Number(beat.dataset['kpOperationEnd']) };
  });
  for (const amount of [.2, .5, .8, .5]) {
    const result = await frame.evaluate(async ({ y }) => {
      dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y);
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      return { progress: Number(document.body.dataset['kpReaderProgress']), focus: Number(document.body.style.getPropertyValue('--kp-frame-stage-focus')),
        owners: document.querySelectorAll('[data-kp-reader-transition-active=true] [data-kp-equation-material-owner-id]').length };
    }, { y: operation.from + 280 * amount });
    expect(Math.abs(result.progress - (operation.start + (operation.end - operation.start) * amount))).toBeLessThanOrEqual(2);
    expect(result.focus).toBe(1); expect(result.owners).toBeGreaterThan(0);
    if (amount === .5) await page.screenshot({ path: info.outputPath(`stage-${width}.png`) });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await sample(0, 12);
  expect(reduced.copyScale).toBeCloseTo(1, 2); expect(reduced.stageScale).toBeCloseTo(1, 2);
  await page.setViewportSize({ width, height: 900 });
  await expect.poll(() => frame.locator('.kp-caption-pin').evaluate(pin => (pin as HTMLElement).offsetHeight)).toBe(geometry.height);
  await expect(frame.locator('.kp-caption-pin')).toHaveCount(1);
  await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
  expect(errors).toEqual([]);
});
