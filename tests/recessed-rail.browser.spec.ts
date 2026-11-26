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
  const surface = await frame.evaluate(() => {
    const sequence = document.querySelector<HTMLElement>('.kp-caption-sequence')!;
    const style = getComputedStyle(sequence), rail = getComputedStyle(sequence, '::after');
    const article = document.querySelector<HTMLElement>('.kp-lesson')!;
    const sheet = getComputedStyle(article, '::before');
    return { left: rail.left, right: rail.right, shadow: style.boxShadow, railLayer: Number(rail.zIndex),
      paperLayer: Number(getComputedStyle(document.querySelector('.kp-animation-beats')!).zIndex),
      sheetLayer: Number(sheet.zIndex), sheetBackground: sheet.backgroundColor,
      sheetHeight: parseFloat(sheet.height), articleHeight: article.getBoundingClientRect().height,
      sequenceIsolation: style.isolation,
      prose: [...article.querySelectorAll('.kp-rising-passage, .kp-caption-document-intro, .kp-caption-document-after')]
        .map(node => ({ background: getComputedStyle(node).backgroundColor, opacity: getComputedStyle(node).opacity })) };
  });
  expect(surface.left).toBe('0px'); expect(surface.shadow).toBe('none');
  expect(surface.railLayer).toBeLessThan(surface.sheetLayer);
  expect(surface.sheetLayer).toBeLessThan(surface.paperLayer);
  expect(surface.sequenceIsolation).toBe('auto');
  expect(surface.sheetHeight).toBeCloseTo(surface.articleHeight, 0);
  expect(surface.sheetBackground).toContain('0.18');
  expect(surface.prose.every(prose => prose.background === 'rgba(0, 0, 0, 0)' && prose.opacity === '1')).toBe(true);
  // Entry and reversal sample the same shallow depth without a timer. The
  // native paint owner remains mounted while the paper passes in front.
  const depths = [];
  // Sample the surface two pixels before the boundary so integer scroll
  // rounding cannot place the endpoint fractionally inside the descent.
  for (const offset of [-26, -12, 0, -12, -26]) {
    depths.push(await frame.evaluate(async offset => {
      const passage = document.querySelector<HTMLElement>('.kp-rising-passage')!;
      const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
      const center = parseFloat(getComputedStyle(pin).top) + pin.offsetHeight / 2;
      const halfEquation = parseFloat(getComputedStyle(document.body).getPropertyValue('--kp-document-equation-height')) / 2;
      dispatchEvent(new WheelEvent('wheel'));
      scrollTo(0, scrollY + passage.getBoundingClientRect().top - center - halfEquation + offset);
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      return { depth: Number(document.body.style.getPropertyValue('--kp-rail-depth')),
        z: new DOMMatrixReadOnly(getComputedStyle(pin).transform).m43,
        opacity: getComputedStyle(pin).opacity };
    }, offset));
    if (offset === -12) await page.screenshot({ path: info.outputPath(`dip-${width}.png`) });
  }
  expect(depths[0]!.depth).toBeCloseTo(0, 1);
  expect(depths[1]!.depth).toBeCloseTo(.5, 1);
  expect(depths[2]!.depth).toBeCloseTo(1, 1);
  expect(depths[0]!.z).toBeCloseTo(0, 1);
  expect(depths[2]!.z).toBeLessThan(depths[1]!.z);
  expect(depths[1]!.z).toBeLessThan(0);
  expect(Number(depths[0]!.opacity)).toBe(1);
  expect(Number(depths[2]!.opacity)).toBeGreaterThan(0);
  expect(Number(depths[2]!.opacity)).toBeLessThan(.3);
  expect(depths[1]).toEqual(depths[3]); expect(depths[0]).toEqual(depths[4]);
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
        paint: owners.map(owner => {
          const style = owner.getAttribute('style') ?? '';
          return { id: owner.dataset['kpEquationMaterialOwnerId'],
            structure: style.replace(/-?\d+(?:\.\d+)?px/g, '<px>'),
            pixels: [...style.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map(match => Number(match[1])) };
        }) };
    }, { operation, amount });
    expect(result.top).toBeCloseTo(operation.top, 0);
    expect(Math.abs(result.progress - (operation.start + (operation.end - operation.start) * amount))).toBeLessThanOrEqual(2);
    samples.push(result);
    if (amount === .5) await page.screenshot({ path: info.outputPath(`recess-${width}.png`) });
  }
  expect(samples[0]!.paint.length).toBeGreaterThan(0);
  for (const [from, to] of [[0, 4], [1, 3]] as const) {
    const a = samples[from]!.paint, b = samples[to]!.paint;
    expect(a.length).toBe(b.length);
    a.forEach((owner, index) => {
      expect(owner.id).toBe(b[index]!.id);
      expect(owner.structure).toBe(b[index]!.structure);
      expect(owner.pixels.length).toBe(b[index]!.pixels.length);
      // Firefox may remeasure by one 1/60 CSS-pixel layout unit after scroll.
      // Preserve every owner/style comparison with a subpixel geometry bound.
      owner.pixels.forEach((value, pixel) => expect(Math.abs(value - b[index]!.pixels[pixel]!)).toBeLessThan(.025));
    });
  }
  // Prose stays opaque above a transparent paragraph box; only the continuous
  // sheet veils the rail and the recessed equation.
  const covered = await frame.evaluate(async () => {
    const passage = document.querySelectorAll<HTMLElement>('.kp-rising-passage')[3]!;
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const top = parseFloat(getComputedStyle(pin).top);
    dispatchEvent(new WheelEvent('wheel')); scrollTo(0, scrollY + passage.getBoundingClientRect().top - top);
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    const p = passage.getBoundingClientRect(), s = pin.querySelector<HTMLElement>('.kp-animation-static')!.getBoundingClientRect();
    return { covered: p.top <= s.top + 1 && p.bottom >= s.bottom - 1,
      front: passage.contains(document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2)),
      railCovered: passage.contains(document.elementFromPoint(p.left + .5, p.top + p.height / 2)),
      background: getComputedStyle(passage).backgroundColor };
  });
  expect(covered.covered).toBe(true); expect(covered.front).toBe(true);
  expect(covered.background).toBe('rgba(0, 0, 0, 0)');
  expect(covered.railCovered).toBe(true);
  await page.screenshot({ path: info.outputPath(`covered-${width}.png`) });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await frame.locator('.kp-caption-pin').evaluate(pin => new DOMMatrixReadOnly(getComputedStyle(pin).transform).m43)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // A translucent sheet cannot hide release: the stage withdraws beforehand.
  const exit = await frame.evaluate(async () => {
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const after = document.querySelector<HTMLElement>('.kp-caption-document-after')!;
    dispatchEvent(new WheelEvent('wheel')); scrollTo(0, scrollY + after.getBoundingClientRect().top - 60);
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    const s = pin.getBoundingClientRect();
    return { stageBottom: s.bottom, paperTop: after.getBoundingClientRect().top,
      opacity: Number(getComputedStyle(pin).opacity),
      stageTop: s.top, pinnedTop: parseFloat(getComputedStyle(pin).top) };
  });
  expect(exit.stageTop).toBeLessThan(exit.pinnedTop);
  expect(exit.stageBottom).toBeLessThanOrEqual(exit.paperTop + 1);
  expect(exit.opacity).toBe(0);
  expect(errors).toEqual([]);
});
