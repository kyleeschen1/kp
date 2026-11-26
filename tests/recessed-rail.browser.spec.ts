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
      indents: [...article.querySelectorAll('p')].map(node => getComputedStyle(node).textIndent),
      textInset: document.querySelector('.kp-caption-copy')!.getBoundingClientRect().left - sequence.getBoundingClientRect().left,
      prose: [...article.querySelectorAll('.kp-rising-passage, .kp-caption-document-intro, .kp-caption-document-after')]
        .map(node => ({ background: getComputedStyle(node).backgroundColor, opacity: getComputedStyle(node).opacity })) };
  });
  expect(parseFloat(surface.left) - surface.textInset).toBe(4);
  expect(surface.indents.every(indent => indent === '0px')).toBe(true);
  expect(surface.shadow).toBe('none');
  expect(surface.railLayer).toBeLessThan(surface.sheetLayer);
  expect(surface.sheetLayer).toBeLessThan(surface.paperLayer);
  expect(surface.sequenceIsolation).toBe('auto');
  expect(surface.sheetHeight).toBeCloseTo(surface.articleHeight, 0);
  expect(surface.sheetBackground).toContain('0.18');
  expect(surface.prose.every(prose => prose.background === 'rgba(0, 0, 0, 0)' && prose.opacity === '1')).toBe(true);
  // Text may cross the stage, but neither stage placement nor opacity changes.
  const depths = [];
  for (const offset of [-2, 16, 34, 16, -2]) {
    depths.push(await frame.evaluate(async offset => {
      const passage = document.querySelector<HTMLElement>('.kp-caption-copy')!;
      const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
      const center = parseFloat(getComputedStyle(pin).top) + pin.offsetHeight / 2;
      const halfEquation = parseFloat(getComputedStyle(document.body).getPropertyValue('--kp-document-equation-height')) / 2;
      dispatchEvent(new WheelEvent('wheel'));
      scrollTo(0, scrollY + passage.getBoundingClientRect().top - center - halfEquation - 12 + offset);
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      const equation = pin.querySelector<HTMLElement>('.kp-animation-static')!.getBoundingClientRect();
      return { offset: new DOMMatrixReadOnly(getComputedStyle(pin).transform).m42,
        clearance: equation.top - passage.getBoundingClientRect().bottom,
        opacity: getComputedStyle(pin).opacity };
    }, offset));
    if (offset === 34) await page.screenshot({ path: info.outputPath(`crossing-${width}.png`) });
  }
  expect(depths.every(sample => sample.offset === 0)).toBe(true);
  expect(depths.every(sample => sample.opacity === '1')).toBe(true);
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
  // The local paper backing follows the real text and obscures the rail too.
  const covered = await frame.evaluate(async () => {
    const passage = document.querySelectorAll<HTMLElement>('.kp-rising-passage')[3]!;
    const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
    const top = parseFloat(getComputedStyle(pin).top);
    dispatchEvent(new WheelEvent('wheel')); scrollTo(0, scrollY + passage.getBoundingClientRect().top - top);
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    const p = passage.getBoundingClientRect(), s = pin.querySelector<HTMLElement>('.kp-animation-static')!.getBoundingClientRect();
    const copy = passage.querySelector('.kp-caption-copy')!;
    const text = copy.getBoundingClientRect(), backing = getComputedStyle(copy, '::before');
    return { overlap: s.top < text.bottom && s.bottom > text.top,
      backing: backing.backgroundColor, feather: backing.boxShadow,
      railX: p.left + 28.5, textTop: text.top,
      railCovered: passage.contains(document.elementFromPoint(p.left + 28.5, p.top + p.height / 2)),
      background: getComputedStyle(passage).backgroundColor };
  });
  expect(covered.overlap).toBe(true);
  expect(covered.backing).toContain('0.98');
  expect(covered.feather).not.toBe('none');
  expect(covered.background).toBe('rgba(0, 0, 0, 0)');
  expect(covered.railCovered).toBe(true);
  await page.screenshot({ path: info.outputPath(`covered-${width}.png`) });
  // Read realized pixels, not just z-index declarations: the same rail must
  // be nearly paper-colored beside the prose and dark in the clear interval.
  const host = await (await frame.frameElement()).boundingBox();
  const capture = await page.screenshot();
  const railPaint = await page.evaluate(async ({ png, x, y }) => {
    const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const context = canvas.getContext('2d')!; context.drawImage(img, 0, 0);
    const darkest = (sampleY: number) => {
      const pixels = context.getImageData(Math.floor(x) - 1, Math.floor(sampleY), 3, 1).data;
      return Math.min(...[0, 4, 8].map(i => (pixels[i]! + pixels[i + 1]! + pixels[i + 2]!) / 3));
    };
    return { backed: darkest(y - 1), open: darkest(y - 48) };
  }, { png: capture.toString('base64'), x: host!.x + covered.railX, y: host!.y + covered.textTop });
  expect(railPaint.backed - railPaint.open).toBeGreaterThan(70);
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
