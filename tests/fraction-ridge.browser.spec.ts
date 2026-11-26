import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`original fraction presentation with left ridge at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  // Old review links must no longer select any retired presentation behavior.
  await page.goto('/experiments/fraction-notebook/?reading=1&rail=1&frames=1');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  await expect(frame.locator('body')).not.toHaveAttribute('data-kp-recessed-rail');
  await expect(frame.locator('body')).not.toHaveAttribute('data-kp-frame-exchange');
  await frame.evaluate(() => document.fonts.ready);
  const appearance = await frame.locator('.kp-caption-frame').evaluate(node => {
    const left = getComputedStyle(node, '::before'), right = getComputedStyle(node, '::after');
    return { width: left.width, left: left.left, border: left.borderWidth, ink: left.backgroundColor, right: right.display,
      height: parseFloat(left.height), stageHeight: node.getBoundingClientRect().height,
      pinTransform: getComputedStyle(node.parentElement!).transform,
      copyTransforms: [...document.querySelectorAll('.kp-caption-copy')].map(copy => getComputedStyle(copy).transform) };
  });
  expect(appearance).toMatchObject({ width: '1px', left: '0px', border: '0px', ink: 'rgb(0, 0, 0)', right: 'none', pinTransform: 'none' });
  expect(appearance.height).toBeCloseTo(appearance.stageHeight, 0);
  expect(appearance.copyTransforms.every(value => value === 'none')).toBe(true);
  const operation = await frame.evaluate(() => {
    const beat = document.querySelectorAll<HTMLElement>('[data-kp-operation-id]')[1]!;
    const line = parseFloat(getComputedStyle(document.body).getPropertyValue('--kp-flow-line'));
    return { from: scrollY + beat.getBoundingClientRect().top + beat.querySelector<HTMLElement>('.kp-rising-passage')!.offsetHeight - line + 100,
      start: Number(beat.dataset['kpOperationStart']), end: Number(beat.dataset['kpOperationEnd']) };
  });
  const samples = [];
  for (const amount of [.2, .5, .8, .5, .2]) {
    const state = await frame.evaluate(async y => {
      dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y);
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      return { progress: Number(document.body.dataset['kpReaderProgress']),
        owners: document.querySelectorAll('[data-kp-reader-transition-active=true] [data-kp-equation-material-owner-id]').length };
    }, operation.from + amount * 280);
    samples.push(state);
    expect(Math.abs(state.progress - (operation.start + (operation.end - operation.start) * amount))).toBeLessThanOrEqual(2);
    expect(state.owners).toBeGreaterThan(0);
    await expect(frame.locator('[data-anchored-error]:visible')).toHaveCount(0);
    if (amount === .5) await page.screenshot({ path: info.outputPath(`ridge-${width}.png`) });
  }
  expect(samples[0]).toEqual(samples[4]); expect(samples[1]).toEqual(samples[3]);
  expect(errors).toEqual([]);
});
