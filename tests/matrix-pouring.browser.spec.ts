import { test, expect } from '@playwright/test';

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
