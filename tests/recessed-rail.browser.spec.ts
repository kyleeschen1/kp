import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) test(`recessed rail keeps clearance and reversible native motion at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/fraction-notebook/?rail=1&reading=1');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  const frame = page.frames().find(frame => frame.url().includes('/reader/fraction-notebook-preview/'))!;
  await expect(frame.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  await expect(frame.locator('body')).toHaveAttribute('data-kp-recessed-rail', 'true');
  await frame.evaluate(() => document.fonts.ready);
  const geometry = await frame.evaluate(() => {
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const top = parseFloat(getComputedStyle(pin).top), height = pin.getBoundingClientRect().height;
    return [...document.querySelectorAll<HTMLElement>('[data-kp-operation-id]')].map(beat => {
      const passage = beat.querySelector<HTMLElement>('.kp-rising-passage')!;
      const next = beat.nextElementSibling?.querySelector<HTMLElement>('.kp-rising-passage');
      const bottom = scrollY + passage.getBoundingClientRect().bottom;
      return { top, height, from: bottom - top + 100, to: bottom - top + 380,
        start: Number(beat.dataset['kpOperationStart']), end: Number(beat.dataset['kpOperationEnd']),
        nextTop: next ? scrollY + next.getBoundingClientRect().top : null };
    });
  });
  expect(geometry.length).toBeGreaterThan(1);
  for (const operation of geometry) {
    expect(operation.to - operation.from).toBe(280);
    if (operation.nextTop !== null) expect(operation.nextTop - operation.to).toBeGreaterThanOrEqual(operation.top + operation.height - 1);
  }
  const operation = geometry[1]!;
  const samples = [];
  for (const amount of [.2, .5, .8, .5, .2]) {
    const result = await frame.evaluate(async ({ operation, amount }) => {
      dispatchEvent(new WheelEvent('wheel')); scrollTo(0, operation.from + 280 * amount);
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
      const owners = [...document.querySelectorAll<HTMLElement>('[data-kp-reader-transition-active=true] [data-kp-equation-material-owner-id]')];
      return { top: pin.getBoundingClientRect().top, progress: Number(document.body.dataset['kpReaderProgress']),
        paint: owners.map(owner => owner.getAttribute('style')).join('|') };
    }, { operation, amount });
    expect(result.top).toBeCloseTo(operation.top, 0);
    expect(Math.abs(result.progress - (operation.start + (operation.end - operation.start) * amount))).toBeLessThanOrEqual(2);
    samples.push(result);
    if (amount === .5) await page.screenshot({ path: info.outputPath(`recess-${width}.png`) });
  }
  expect(samples[0]!.paint).not.toBe('');
  expect(samples[0]!.paint).toBe(samples[4]!.paint);
  expect(samples[1]!.paint).toBe(samples[3]!.paint);
  // A real opaque paragraph covers the entire stage before the next opening.
  const covered = await frame.evaluate(async () => {
    const passage = document.querySelectorAll<HTMLElement>('.kp-rising-passage')[3]!;
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const top = parseFloat(getComputedStyle(pin).top);
    dispatchEvent(new WheelEvent('wheel')); scrollTo(0, scrollY + passage.getBoundingClientRect().top - top);
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    const p = passage.getBoundingClientRect(), s = pin.getBoundingClientRect();
    return { covered: p.top <= s.top + 1 && p.bottom >= s.bottom - 1,
      front: passage.contains(document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2)),
      background: getComputedStyle(passage).backgroundColor };
  });
  expect(covered.covered).toBe(true); expect(covered.front).toBe(true);
  expect(covered.background).not.toBe('rgba(0, 0, 0, 0)');
  await page.screenshot({ path: info.outputPath(`covered-${width}.png`) });
  // The bounded sticky owner may move at the end only behind the last sheet.
  const exit = await frame.evaluate(async () => {
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const after = document.querySelector<HTMLElement>('.kp-caption-document-after')!;
    dispatchEvent(new WheelEvent('wheel')); scrollTo(0, scrollY + after.getBoundingClientRect().top - 60);
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    const s = pin.getBoundingClientRect();
    return { stageBottom: s.bottom, paperTop: after.getBoundingClientRect().top,
      covered: Boolean(document.elementFromPoint(s.left + s.width / 2, Math.max(1, s.top + s.height / 2))?.closest('.kp-animation-beats')),
      stageTop: s.top, pinnedTop: parseFloat(getComputedStyle(pin).top) };
  });
  expect(exit.stageTop).toBeLessThan(exit.pinnedTop);
  expect(exit.stageBottom).toBeLessThanOrEqual(exit.paperTop + 1);
  expect(exit.covered).toBe(true);
  expect(errors).toEqual([]);
});
