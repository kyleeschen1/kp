import { test, expect } from '@playwright/test';
import { renderCollectionReading } from '../src/experiments/rectangular-product/collection-reading.ts';
import { linearSystemModel } from '../src/experiments/rectangular-product/linear-system-source.ts';
import { polynomialModel } from '../src/experiments/rectangular-product/polynomial-model.ts';

test('settling and all enclosures form one reversible event before the completed equation holds', async ({ page }, info) => {
  for (const [view, model] of [['polynomials', polynomialModel], ['system', linearSystemModel]] as const) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/experiments/rectangular-product/?view=${view}`);
    const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
    const slider = root.getByRole('slider', { name: 'Animation position' });
    const seek = async (phase: number) => {
      const i = Math.floor(phase), next = model.stops[i + 1] ?? model.stops[i]!;
      await slider.fill(String(Number((model.stops[i]! + (phase - i) * (next - model.stops[i]!)).toFixed(4))));
    };
    const paint = () => root.locator('.polynomial-stage [style]').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')));
    const enclosures = root.locator('.poly-enclosure');
    await seek(3.6);
    for (const node of await enclosures.all()) await expect(node).toHaveCSS('opacity', '0');
    await seek(3.8);
    const mid = await paint();
    const opacities = await enclosures.evaluateAll(nodes => nodes.map(n => Number(getComputedStyle(n).opacity)));
    expect(opacities).toHaveLength(3);
    expect(new Set(opacities).size).toBe(1);
    expect(opacities[0]).toBeGreaterThan(0); expect(opacities[0]).toBeLessThan(1);
    await expect(root.locator('[data-poly="equals-0"]')).toHaveCSS('opacity', '0');
    const moving = await root.locator('[data-poly="basis-0-0"]').getAttribute('style');
    await root.locator('.matrix-card').screenshot({ path: info.outputPath(`${view}-settling-enclosures.png`) });
    await seek(4);
    expect(await root.locator('[data-poly="basis-0-0"]').getAttribute('style')).not.toEqual(moving);
    await expect(root.locator('[data-poly="equals-0"]')).toHaveCSS('opacity', '0');
    await seek(4.3);
    for (const node of await enclosures.all()) await expect(node).toHaveCSS('opacity', '1');
    await expect(root.locator('[data-poly="equals-0"]')).toHaveCSS('opacity', '1');
    const complete = await paint(); await seek(5); expect(await paint()).toEqual(complete);
    await seek(3.8); expect(await paint()).toEqual(mid);
    const chooser = root.getByRole('combobox', { name: 'Milestone' });
    await expect(chooser.locator('option[value="4"]')).toHaveCount(0);
    await chooser.selectOption('3');
    await root.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(root).toHaveAttribute('data-milestone', 'matrix');
    await root.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(root).toHaveAttribute('data-milestone', 'collect');
    await slider.focus(); await page.keyboard.press('ArrowRight');
    await expect(root).toHaveAttribute('data-milestone', 'matrix');
  }
});

test('factor gaps follow content and negative coefficients explicitly become signed addends', async ({ page }, info) => {
  for (const query of ['view=polynomials', 'view=system', 'view=polynomials&example=reordered']) {
    await page.goto(`/experiments/rectangular-product/?${query}`);
    const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
    const chooser = root.getByRole('combobox', { name: 'Milestone' });
    await chooser.selectOption('1');
    const coefficient = root.locator('[data-poly="coefficient-0-1"]');
    // Both three-input fixtures have -1 in column 1; the original has -1 in column 2.
    const c = query === 'view=polynomials' ? 2 : 1;
    const part = (name: string) => root.locator(`[data-poly="${name}-0-${c}"]`);
    await expect(part('plus')).toHaveCSS('opacity', '1');
    await expect(part('open')).toHaveCSS('opacity', '1');
    await expect(part('close')).toHaveCSS('opacity', '1');
    expect(await part('open').getAttribute('data-source-id')).toEqual(await part('coefficient').getAttribute('data-source-id'));
    const negativeBox = (await part('coefficient').boundingBox())!;
    const plusBox = (await part('plus').boundingBox())!, openBox = (await part('open').boundingBox())!;
    const closeBox = (await part('close').boundingBox())!, inputBox = (await part('basis').boundingBox())!;
    expect(plusBox.x + plusBox.width).toBeLessThan(openBox.x);
    expect(openBox.x + openBox.width).toBeLessThan(negativeBox.x);
    expect(closeBox.x).toBeGreaterThan(negativeBox.x + negativeBox.width);
    expect(closeBox.x + closeBox.width).toBeLessThan(inputBox.x);
    if (query.includes('reordered')) {
      await expect(root.locator('[data-poly="plus-1-0"]')).toHaveCSS('opacity', '0');
      const dot = (await root.locator('[data-poly="dot-1-0"]').boundingBox())!;
      const constant = (await root.locator('[data-poly="basis-1-0"]').boundingBox())!;
      const nextPlus = (await root.locator('[data-poly="plus-1-1"]').boundingBox())!;
      expect(dot.x + dot.width).toBeLessThan(constant.x);
      expect(constant.x + constant.width).toBeLessThan(nextPlus.x);
    }
    await root.locator('.matrix-card').screenshot({ path: info.outputPath(`${query.replaceAll('&', '-')}-signed.png`) });
    const fixed = await coefficient.boundingBox();
    await chooser.selectOption('3');
    await expect(part('plus')).toHaveCSS('opacity', '0');
    await expect(part('open')).toHaveCSS('opacity', '0');
    await expect(part('close')).toHaveCSS('opacity', '0');
    await expect(part('coefficient')).toContainText('−');
    await chooser.selectOption('8');
    const matrix = (await root.locator('[data-poly="coefficient-brackets"]').boundingBox())!;
    const vector = (await root.locator('[data-poly="basis-brackets"]').boundingBox())!;
    expect(vector.x - matrix.x - matrix.width).toBeCloseTo(53, 1);
    expect(vector.y + vector.height / 2).toBeCloseTo(matrix.y + matrix.height / 2, 1);
    expect(await coefficient.boundingBox()).toEqual(fixed);
    await chooser.selectOption('1'); await expect(part('open')).toHaveCSS('opacity', '1');
    await chooser.selectOption('0'); await expect(part('open')).toHaveCSS('opacity', '0');
    await expect(part('plus')).toHaveCSS('opacity', '0');
  }
});

test('static system explanation remains readable with JavaScript disabled', async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.setContent(renderCollectionReading(linearSystemModel));
    await expect(page.locator('math')).toHaveCount(2);
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('h1')).toHaveText('A linear system as a matrix equation');
    await expect(page.locator('li')).toHaveCount(9);
    await page.screenshot({ path: info.outputPath('linear-system-static.png'), fullPage: true });
  } finally { await context.close(); }
});

test('collection remains reachable at narrow widths, in both themes and forced colors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const view of ['polynomials', 'system']) {
    await page.goto(`/experiments/rectangular-product/?view=${view}`);
    const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
    for (const width of [390, 1200]) {
      await page.setViewportSize({ width, height: 900 });
      for (const light of [false, true]) {
        const toggle = root.getByRole('button', { name: 'Light mode', exact: true });
        if (await toggle.getAttribute('aria-pressed') !== String(light)) await toggle.click();
        await root.getByRole('combobox', { name: 'Milestone' }).selectOption('8');
        await expect(root.locator('[data-poly="equals-0"]')).toHaveCSS('opacity', '1');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        expect(overflow).toBeLessThanOrEqual(1);
        const scroll = root.getByRole('region', { name: 'Animation; scroll horizontally on narrow screens' });
        await expect(scroll).toHaveAttribute('tabindex', '0');
        const reachable = await scroll.evaluate(el => {
          el.scrollLeft = el.scrollWidth;
          const edge = el.getBoundingClientRect().right;
          return el.querySelector('[data-poly="basis-brackets"]')!.getBoundingClientRect().right <= edge;
        });
        expect(reachable).toBe(true);
      }
    }
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await root.getByRole('slider', { name: 'Animation position' }).focus();
    await page.keyboard.press('Home');
    await expect(root).toHaveAttribute('data-milestone', 'polynomials');
    await page.keyboard.press('End');
    await expect(root).toHaveAttribute('data-milestone', 'hold');
    await expect(root.locator('.katex-error')).toHaveCount(0);
    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
  }
});

test('linear system reuses collection while retaining unknowns, independent RHS and weighted navigation', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experiments/rectangular-product/?view=system');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root.locator('[data-poly="name-0"]')).toHaveAttribute('data-source-id', 'system.rhs.0');
  await expect(root.locator('[data-poly="name-0"]')).toContainText('7');
  await expect(root.locator('[data-poly="basis-0-2"]')).toHaveCSS('opacity', '1');
  await expect(root.locator('[data-poly="plus-1-1"]')).toHaveCSS('opacity', '0');
  await expect(root.locator('[data-poly^="coefficient-"]:not(svg)')).toHaveCount(6);
  const chooser = root.getByRole('combobox', { name: 'Milestone' });
  await chooser.selectOption('1');
  const grid = await root.locator('[data-poly^="coefficient-"]:not(svg)').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')?.split(';')[0]));
  for (const [index, phase] of [['3', '3'], ['5', '5'], ['8', '8']]) {
    await chooser.selectOption(index!);
    await expect(root.locator('.polynomial-stage')).toHaveAttribute('data-phase', phase!);
    expect(await root.locator('[data-poly^="coefficient-"]:not(svg)').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')?.split(';')[0]))).toEqual(grid);
    if (index === '3') await expect(root.locator('[data-poly="equals-0"]')).toHaveCSS('opacity', '0');
  }
  await chooser.selectOption('6');
  await expect(root.locator('[data-poly="coefficient-1-1"]')).toHaveCSS('opacity', '1');
  await expect(root.locator('[data-poly="coefficient-0-1"]')).toHaveCSS('opacity', '0.45');
  await chooser.selectOption('7');
  await expect(root.locator('[data-poly="basis-0-2"]')).toHaveCSS('opacity', '1');
  const poses = await root.locator('.polynomial-stage [style]').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')));
  await chooser.selectOption('0'); await chooser.selectOption('7');
  expect(await root.locator('.polynomial-stage [style]').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')))).toEqual(poses);
  await root.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(root).toHaveAttribute('data-milestone', 'hold');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('linear-system-endpoint.png') });
  await page.reload(); await expect(root).toHaveAttribute('data-milestone', 'hold');
  await expect(root.locator('.katex-error')).toHaveCount(0);
  await root.getByText('Read the calculation', { exact: true }).click();
  await expect(root.locator('math')).toHaveCount(1);
  await expect(root.locator('details')).toContainText('neither solves');
  expect(errors).toEqual([]);
});

test('reordered polynomial source keeps constant units visible and arbitrary last input present', async ({ page }, info) => {
  await page.goto('/experiments/rectangular-product/?view=polynomials&example=reordered');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root.locator('[data-poly="coefficient-0-0"]')).toHaveCSS('opacity', '1');
  await expect(root.locator('[data-poly="coefficient-1-0"] [data-unit]')).toHaveCSS('opacity', '1');
  await expect(root.locator('[data-poly="basis-1-2"]')).toHaveCSS('opacity', '1');
  await expect(root.locator('[data-poly="basis-1-0"]')).toHaveCSS('opacity', '0');
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('5');
  await expect(root.locator('[data-poly="basis-0-0"]')).toHaveCSS('opacity', '1');
  await expect(root.locator('[data-poly="coefficient-brackets"]')).toHaveAttribute('width', '230');
  await expect(root.locator('.katex-error')).toHaveCount(0);
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('reordered-polynomial-endpoint.png') });
});

test('polynomial extraction retains coefficient grid and shared basis through reversible collection', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/experiments/rectangular-product/?view=polynomials#polynomials');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root.locator('.katex-error')).toHaveCount(0);
  await expect(root.locator('math')).toHaveCount(1);
  const slider = root.getByRole('slider', { name: 'Animation position' });
  const coefficients = root.locator('[data-poly^="coefficient-"]:not(svg)');
  const positions = () => coefficients.evaluateAll(nodes => nodes.map(n => { const b = n.getBoundingClientRect(); return [b.x, b.y]; }));
  await expect(root.locator('[data-poly="coefficient-1-0"]')).toHaveCSS('opacity', '0');
  await expect(root.locator('[data-unit]')).toHaveCSS('opacity', '0');
  await slider.fill('0.125'); const grid = await positions();
  await expect(root.locator('[data-unit]')).toHaveCSS('opacity', '1');
  const persistentName = root.locator('[data-poly="name-0"]');
  const namePaint = await persistentName.screenshot();
  const poses = () => root.locator('.polynomial-stage [style]').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')));
  for (const phase of [0, .5, 1, 2, 2.2, 2.5, 3, 3.5, 4, 4.75, 5, 6, 7, 8]) {
    const position = String(Number((phase / 8).toFixed(4)));
    await slider.fill(position);
    if (phase >= 1) expect(await positions()).toEqual(grid);
    const before = await poses(); await slider.fill('1'); await slider.fill('0'); await slider.fill(position);
    expect(await poses()).toEqual(before);
    for (const ink of await root.locator('[data-poly="name-0"] .katex *').all()) await expect(ink).toHaveCSS('visibility', 'visible');
    if ([1, 3, 4, 5, 8].includes(phase)) expect(await persistentName.screenshot()).toEqual(namePaint);
    if (phase >= 2.2 && phase <= 4.1) await expect(root.locator('[data-poly="equals-0"]')).toHaveCSS('opacity', '0');
    if (phase === 6) {
      await expect(root.locator('[data-poly="coefficient-0-1"]')).toHaveCSS('opacity', '1');
      await expect(root.locator('[data-poly="coefficient-1-1"]')).toHaveCSS('opacity', '0.45');
    }
    if (phase === 7) {
      await expect(root.locator('[data-poly="coefficient-1-0"]')).toHaveCSS('opacity', '1');
      await expect(root.locator('[data-poly="basis-0-0"]')).toHaveCSS('opacity', '1');
      await expect(root.locator('[data-poly="coefficient-0-1"]')).toHaveCSS('opacity', '0.45');
    }
    if (phase === 8) await expect(root.locator('[data-poly="coefficient-1-1"]')).toHaveCSS('opacity', '1');
    if (phase >= 3 && phase <= 4) {
      const centers = await root.locator('[data-poly^="basis-0-"]').evaluateAll(nodes => nodes.map(n => { const b = n.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }));
      // WebKit rounds percentage-centering translations at subpixel boundaries.
      // Keep the rigid-spacing guard within a quarter CSS pixel on every engine.
      for (let i = 1; i < centers.length; i++) expect(Math.abs(Math.hypot(centers[i]!.x - centers[i - 1]!.x, centers[i]!.y - centers[i - 1]!.y) - 72)).toBeLessThan(.25);
    }
    const card = root.locator('.matrix-card');
    const cardBox = (await card.boundingBox())!, nameBox = (await persistentName.boundingBox())!;
    const capture = await card.screenshot({ path: info.outputPath(`polynomial-phase-${phase}.png`), scale: 'css' });
    const inkPixels = await page.evaluate(async ({ png, box }) => {
      const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(box.x, box.y, box.width, box.height).data;
      const bg = [...pixels.slice(0, 3)]; let ink = 0;
      for (let i = 0; i < pixels.length; i += 4) if (Math.abs(pixels[i]! - bg[0]!) + Math.abs(pixels[i + 1]! - bg[1]!) + Math.abs(pixels[i + 2]! - bg[2]!) > 90) ink++;
      return ink;
    }, { png: capture.toString('base64'), box: { x: Math.floor(nameBox.x - cardBox.x), y: Math.floor(nameBox.y - cardBox.y), width: Math.ceil(nameBox.width), height: Math.ceil(nameBox.height) } });
    expect(inkPixels).toBeGreaterThan(20);
  }
  for (let c = 0; c < 4; c++) {
    const first = root.locator(`[data-poly="basis-0-${c}"]`), second = root.locator(`[data-poly="basis-1-${c}"]`);
    expect(await first.getAttribute('data-source-id')).toEqual(await second.getAttribute('data-source-id'));
    await expect(second).toHaveCSS('opacity', '0');
  }
  await root.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect.poll(async () => Number(await root.locator('.polynomial-stage').getAttribute('data-phase'))).toBeLessThan(7.5);
  await slider.fill('0');
  await root.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(async () => Number(await root.locator('.polynomial-stage').getAttribute('data-phase'))).toBeGreaterThan(.1);
  await root.getByRole('button', { name: 'Pause', exact: true }).click();
  await root.getByRole('button', { name: 'Light mode', exact: true }).click();
  await slider.fill('1'); await root.locator('.matrix-card').screenshot({ path: info.outputPath('polynomial-light.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('5');
  await page.reload(); await expect(root).toHaveAttribute('data-milestone', 'matrix');
  expect(errors).toEqual([]);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(root).not.toHaveAttribute('data-ready');
});

test('structural view shows whole inputs, matched ports and composed output without numerals in bands', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/experiments/rectangular-product/?view=structure#initial');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root.locator('.katex-error')).toHaveCount(0);
  expect((await root.locator('[data-band]').allTextContents()).every(text => text === '')).toBe(true);
  await expect(root.locator('[data-band="source-0"] > span')).toHaveCount(3);
  await expect(root.locator('[data-band="row-0"] > span')).toHaveCount(3);
  await expect(root.locator('[data-band^="next-row-"]')).toHaveCount(3);
  await expect(root.locator('[data-band="next-row-0"] > span')).toHaveCount(2);
  const sourceIds = await root.locator('[data-band="source-0"]').getAttribute('data-source-ids');
  for (let r = 0; r < 2; r++) await expect(root.locator(`[data-band="copy-0-${r}"]`)).toHaveAttribute('data-source-ids', sourceIds!);
  await root.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(async () => Number(await root.locator('.structure-stage').getAttribute('data-phase'))).toBeGreaterThan(.1);
  await root.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(root.locator('[data-band="copy-0-0"]')).toHaveCSS('visibility', 'visible');
  const slider = root.getByRole('slider', { name: 'Animation position' });
  // Verify the physical endpoint, not only the declared rotation: the lower
  // hinge must stay put and source order must survive the quarter-turn.
  const hinges = [];
  for (const phase of [.15, .35, .55]) {
    await slider.fill(String(Number((phase / 12).toFixed(4))));
    hinges.push(await root.locator('[data-band="copy-0-0"]').evaluate(node => {
      const el = node as HTMLElement, matrix = new DOMMatrix(getComputedStyle(el).transform);
      const width = parseFloat(getComputedStyle(el).width), height = parseFloat(getComputedStyle(el).height);
      const point = matrix.transformPoint(new DOMPoint(width / 2, 0));
      return { x: point.x + width / 2, y: point.y + height / 2 };
    }));
  }
  for (const hinge of hinges) {
    expect(hinge.x).toBeCloseTo(480, 0); expect(hinge.y).toBeCloseTo(210, 0);
  }
  for (const phase of [.3, .8, 1.4, 2.2, 2.6, 3.5]) {
    await slider.fill(String(Number((phase / 12).toFixed(4))));
    const cells = await root.locator('[data-band="copy-0-0"] > span, [data-band="source-0"] > span, [data-band="row-0"] > span').evaluateAll(nodes => nodes.map(n => {
      const b = n.getBoundingClientRect(); return { width: b.width, height: b.height };
    }));
    for (const cell of cells) expect(cell.width).toBeCloseTo(cell.height, 2);
  }
  await slider.fill(String(Number((.7008 / 12).toFixed(4))));
  const parent = await root.locator('[data-band="copy-0-0"]').boundingBox();
  const child = await root.locator('[data-band="copy-0-1"]').boundingBox();
  expect(child!.x).toBeCloseTo(parent!.x, 2); expect(child!.y).toBeCloseTo(parent!.y, 2);
  await expect(root.locator('[data-band="copy-0-1"]')).toHaveCSS('visibility', 'visible');
  await slider.fill(String(Number((1 / 12).toFixed(4))));
  const parts = await root.locator('[data-band="copy-0-0"] > span').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().x));
  expect(parts[0]).toBeLessThan(parts[1]!); expect(parts[1]).toBeLessThan(parts[2]!);
  const input = await root.locator('[data-band="copy-0-0"]').boundingBox();
  const receiver = await root.locator('[data-band="row-0"]').boundingBox();
  expect(input!.y + input!.height).toBeLessThan(receiver!.y);
  const source = await root.locator('[data-band="source-0"]').boundingBox();
  expect(receiver!.x).toBeLessThan(source!.x);
  await slider.fill(String(Number((4 / 12).toFixed(4))));
  const result = await root.locator('[data-band="result-0-0"]').boundingBox();
  expect(result!.x + result!.width).toBeLessThan(receiver!.x);
  const pose = () => root.locator('.structure-stage [style]').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')));
  for (const phase of [0, .5, 1, 1.5, 2, 2.6, 3, 4, 6, 8, 8.6, 9, 9.5, 10, 11, 12]) {
    const p = String(Number((phase / 12).toFixed(4)));
    await slider.fill(p); const before = await pose();
    await slider.fill('1'); await slider.fill('0'); await slider.fill(p); expect(await pose()).toEqual(before);
    await root.locator('.matrix-card').screenshot({ path: info.outputPath(`structure-${phase}.png`) });
  }
  const resultIds = await root.locator('[data-band="result-0-0"], [data-band="result-0-1"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-source-ids')).join(' '));
  await expect(root.locator('[data-band="next-copy-0"]')).toHaveAttribute('data-source-ids', resultIds);
  await expect(root.locator('[data-band^="next-result-"]')).toHaveCount(3);
  await root.getByRole('button', { name: 'Light mode', exact: true }).click();
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('structure-light.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('8');
  await page.reload(); await expect(root).toHaveAttribute('data-milestone', 'C');
  expect(errors).toEqual([]);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(root).not.toHaveAttribute('data-ready');
});

test('autoplay paints moving copies between native endpoints after preparation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/experiments/rectangular-product/?view=pouring#initial');
  const root = page.locator('#rectangular-player');
  await expect(root).toHaveAttribute('data-ready', 'true');
  await root.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(async () => Number(await root.locator('.pour-stage').getAttribute('data-phase'))).toBeGreaterThan(.15);
  await root.getByRole('button', { name: 'Pause', exact: true }).click();
  const copy = root.locator('[data-occurrence="0-0-left-0"]');
  await expect(copy).toHaveCSS('opacity', '1');
  // Wrapper opacity alone misses inherited visibility frozen into cloned ink.
  for (const ink of await copy.locator('*').all()) await expect(ink).toHaveCSS('visibility', 'visible');
  const before = await copy.getAttribute('style');
  await root.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => copy.getAttribute('style')).not.toBe(before);
  await root.getByRole('button', { name: 'Pause', exact: true }).click();
});

test('pouring retains lineage, native destinations, reversible holds and readable captures', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/rectangular-product/?view=pouring');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  const slider = root.getByRole('slider', { name: 'Animation position' });
  const pose = () => root.locator('.pour-stage [style]').evaluateAll(nodes => nodes.map(node => node.getAttribute('style')));
  for (const phase of [0, .5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.6, 5, 6, 7, 7.5, 8, 8.5, 12, 15, 16, 16.5, 17]) {
    const p = String(Number((phase / 17).toFixed(4)));
    await slider.fill(p); const before = await pose();
    await slider.fill('1'); await slider.fill('0'); await slider.fill(p); expect(await pose()).toEqual(before);
    await root.locator('.matrix-card').screenshot({ path: info.outputPath(`phase-${phase}.png`) });
  }
  for (let c = 0; c < 2; c++) for (let k = 0; k < 3; k++) {
    const original = await root.locator(`[data-pour-entry="A-${k}-${c}"]`).getAttribute('data-source-id');
    for (let r = 0; r < 2; r++) await expect(root.locator(`[data-occurrence="${c}-${r}-right-${k}"]`)).toHaveAttribute('data-source-id', original!);
  }
  const center = async (selector: string) => root.locator(selector).evaluate(node => {
    const b = node.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  const sourceTop = await center('[data-pour-entry="B-0-0"]');
  const sourceBottom = await center('[data-pour-entry="B-1-0"]');
  const sourceSpacing = sourceBottom.y - sourceTop.y;
  for (const phase of [.5, 1, 3, 4, 6, 7, 8, 12, 15, 16, 17]) {
    await slider.fill(String(Number((phase / 17).toFixed(4))));
    for (const c of [0, 1]) {
      const top = await center(`.pour-row[data-column="${c}"][data-row="0"] [data-kp-dot-key="sum"]`);
      const bottom = await center(`.pour-row[data-column="${c}"][data-row="1"] [data-kp-dot-key="sum"]`);
      expect(bottom.y - top.y).toBeCloseTo(sourceSpacing, 1);
    }
    for (const label of ['collected', 'C']) {
      const top = await center(`[data-pour-entry="${label}-0-0"]`), bottom = await center(`[data-pour-entry="${label}-1-0"]`);
      expect(bottom.y - top.y).toBeCloseTo(sourceSpacing, 1);
    }
  }
  for (const phase of [.3, .6]) {
    await slider.fill(String(Number((phase / 17).toFixed(4))));
    const top = await center('[data-occurrence="0-0-left-0"]'), bottom = await center('[data-occurrence="0-1-left-0"]');
    expect(bottom.y - top.y).toBeCloseTo(sourceSpacing, 1);
    await expect(root.locator('.pour-working-bracket').first()).toHaveCSS('opacity', '1');
  }
  await slider.fill(String(Number((1.7 / 17).toFixed(4))));
  const originalInput = await center('[data-pour-entry="A-1-0"]'), movingInput = await center('[data-occurrence="0-0-right-1"]');
  expect(movingInput.y).toBeGreaterThan(originalInput.y);
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('4');
  for (let k = 0; k < 3; k++) {
    const first = await center(`.pour-row[data-column="0"][data-row="0"] [data-kp-dot-key="pair-right-${k}"]`);
    const second = await center(`.pour-row[data-column="0"][data-row="1"] [data-kp-dot-key="pair-right-${k}"]`);
    expect(Math.abs(first.x - second.x)).toBeLessThan(.1);
    await expect(root.locator(`[data-occurrence="0-1-right-${k}"]`)).toHaveCSS('opacity', '0');
  }
  await slider.fill(String(Number((7.95 / 17).toFixed(4))));
  for (let r = 0; r < 2; r++) {
    const from = await center(`.pour-row[data-column="0"][data-row="${r}"] [data-kp-dot-key="sum"]`);
    const to = await center(`[data-pour-entry="collected-${r}-0"]`);
    expect(Math.abs(from.x - to.x)).toBeLessThan(.1); expect(Math.abs(from.y - to.y)).toBeLessThan(.1);
    await expect(root.locator(`[data-pour-entry="collected-${r}-0"]`)).toHaveCSS('opacity', '0');
  }
  await slider.fill(String(Number((16.95 / 17).toFixed(4))));
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const from = await center(`[data-pour-entry="collected-${r}-${c}"]`), to = await center(`[data-pour-entry="C-${r}-${c}"]`);
    expect(Math.abs(from.x - to.x)).toBeLessThan(.1); expect(Math.abs(from.y - to.y)).toBeLessThan(.1);
  }
  await slider.fill('1');
  for (const [r, values] of [[0, ['−3', '13']], [1, ['18', '−5']]] as const)
    for (const [c, value] of values.entries()) {
      const target = root.locator(`[data-pour-entry="C-${r}-${c}"]`);
      await expect(target).toHaveCSS('opacity', '1'); await expect(target).toHaveText(value);
    }
  await root.getByRole('button', { name: 'Light mode', exact: true }).click();
  await slider.fill((3.5 / 17).toFixed(4));
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('light-pour.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await slider.fill('1'); await expect(root.locator('.pour-collection')).toHaveCSS('opacity', '0');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('4');
  await page.reload(); await expect(root).toHaveAttribute('data-ready', 'true'); await expect(root).toHaveAttribute('data-milestone', 'pour-1');
  await expect(root.locator('details .katex-mathml annotation')).toHaveCount(1);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(root).not.toHaveAttribute('data-ready');
  await expect(root.locator('.pour-ink')).toHaveCount(0);
  expect(errors).toEqual([]);
});
