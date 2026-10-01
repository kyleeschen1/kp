import { expect, test } from '@playwright/test';

test('rectangular cell reuses the passage and hands off one result through seek and resize', async ({ page }, info) => {
  await page.goto('/experiments/rectangular-product/');
  const root = page.locator('#rectangular-player');
  await expect(root).toHaveAttribute('data-ready', 'true');
  const timeline = root.getByRole('slider', { name: 'Animation position' });
  await expect(root.getByRole('slider', { name: 'Math size' })).toHaveValue('20');
  await expect(root.locator('details .dot-static')).toHaveCount(2);
  await expect(root.locator('[data-context-selected]')).toHaveCount(6);
  const target = root.locator('[data-context-destination]');
  const sum = root.locator('[data-kp-dot-key="sum"]');
  expect(await target.getAttribute('data-source-id')).toBe(await sum.getAttribute('data-source-id'));
  for (const side of ['left', 'right']) for (let i = 0; i < 3; i++) {
    const id = await root.locator(`[data-kp-dot-key="${side}-${i}"]`).getAttribute('data-source-id');
    const key = side === 'left' ? `A-0-${i}` : `B-${i}-0`;
    await expect(root.locator(`[data-context-key="${key}"]`)).toHaveAttribute('data-source-id', id!);
  }
  const pose = () => root.locator('.dot-stage [style]').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')));
  for (const p of [0, .1, .2, .4, .6, .8, .9, 1]) {
    await timeline.fill(String(p));
    const held = await pose();
    await timeline.fill('1'); await timeline.fill('0'); await timeline.fill(String(p));
    expect(await pose()).toEqual(held);
    await root.locator('.matrix-card').screenshot({ path: info.outputPath(`cell-${p}.png`) });
  }
  await expect(target).toHaveAttribute('data-context-arrived', '');
  await expect(target.locator('.rect-result-ink')).toHaveCSS('visibility', 'visible');
  await expect(target).toHaveText('−3');
  await expect(sum).toHaveCSS('opacity', '0');
  await expect(root.locator('[data-context-arrived]')).toHaveCount(1);
  await root.getByRole('button', { name: 'Light mode', exact: true }).click();
  await expect(target).toHaveCSS('color', 'rgb(17, 17, 15)');
  await expect(root.locator('.matrix-card')).toHaveCSS('background-color', 'color(srgb 0.970118 0.956392 0.931137)');
  await expect(target).toHaveCSS('-webkit-font-smoothing', 'auto');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('rectangular-light-mode.png') });
  await timeline.fill('0.9999');
  const center = async (selector: string) => root.locator(selector).evaluate(node => {
    const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  for (const size of ['20', '32']) {
    await root.getByRole('slider', { name: 'Math size' }).fill(size);
    const a = await center('[data-kp-dot-key="sum"]'), b = await center('[data-context-destination] .rect-result-ink');
    expect(Math.abs(a.x - b.x)).toBeLessThan(.1); expect(Math.abs(a.y - b.y)).toBeLessThan(.1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await timeline.fill('1');
  await expect(target.locator('.rect-result-ink')).toHaveCSS('visibility', 'visible');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await timeline.fill('0');
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('5');
  await expect(root).toHaveAttribute('data-milestone', 'placed');
  await page.reload();
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-milestone', 'placed');
});

test('shared menu loads the rectangular review and shared configuration', async ({ page }) => {
  await page.goto('/experiments/matrix-examples/');
  await page.getByRole('combobox', { name: 'Example', exact: true }).selectOption('rectangular');
  const child = page.frameLocator('#example-frame');
  await expect(child.locator('#rectangular-player')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('combobox', { name: 'Result column' })).toBeHidden();
  await page.getByRole('button', { name: 'Step instantly', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Light mode', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(child.locator('html')).toHaveCSS('color-scheme', 'light');
  await child.getByRole('combobox', { name: 'Milestone' }).selectOption('5');
  await expect(child.locator('[data-context-arrived]')).toHaveCount(1);
});
