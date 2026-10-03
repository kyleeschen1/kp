import { test, expect } from '@playwright/test';

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
