import { test, expect } from '@playwright/test';
import { rowOperation } from '../src/experiments/rectangular-product/row-operation-model.ts';

test('whole-row replacement preserves source and RHS lineage through reversible fusion and docking', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/rectangular-product/?view=row-operation&guided=1');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root.locator('.katex-error')).toHaveCount(0);
  const slider = root.getByRole('slider', { name: 'Animation position' });
  const seek = (phase: number) => slider.fill(String(Number((phase / 6).toFixed(4))));
  const originals = rowOperation.contributions.map(p => root.locator(`[data-poly][data-source-id="${p.target.id}"]`).first());
  const destinations = await Promise.all(originals.map(n => n.boundingBox()));
  const retained = () => root.locator('[data-poly="name-1"], [data-poly^="coefficient-1-"]').evaluateAll(ns => ns.map(n => ({ id: n.getAttribute('data-source-id'), x: n.getBoundingClientRect().x, y: n.getBoundingClientRect().y })));
  const source = await retained();
  const paint = () => root.locator('.row-operation-stage [style]').evaluateAll(ns => ns.map(n => n.getAttribute('style')));
  for (const phase of [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6]) {
    await seek(phase); const before = await paint(); await seek(6); await seek(0); await seek(phase);
    expect(await paint()).toEqual(before); expect(await retained()).toEqual(source);
    if (phase >= 2 && phase <= 4.5) await expect(root.locator('[data-poly="equals-0"]')).toHaveCSS('opacity', '0');
    await root.locator('.matrix-card').screenshot({ path: info.outputPath(`row-phase-${phase}.png`), scale: 'css' });
  }
  for (const [c, p] of rowOperation.contributions.entries()) {
    const result = root.locator(`[data-row-operation="result-${c}"]`), copy = root.locator(`[data-row-operation="copy-${c}"]`);
    await expect(result).toHaveAttribute('data-source-id', p.result.id);
    await expect(copy).toHaveAttribute('data-source-id', p.source.id);
    const b = (await result.boundingBox())!, destination = destinations[c]!;
    expect(b.x + b.width / 2).toBeCloseTo(destination.x + destination.width / 2, 1);
    expect(b.y + b.height / 2).toBeCloseTo(destination.y + destination.height / 2, 1);
    await expect(result.locator('.katex')).toHaveCSS('opacity', '1');
    await expect(originals[c]!.locator('.row-operation-ink')).toHaveCSS('opacity', '0');
    await expect(copy).toHaveCSS('opacity', '0');
  }
  await expect(root.locator('[data-row-operation="result-1"]')).toContainText('0');
  await expect(root.locator('[data-row-operation="result-3"]')).toContainText('6');
  await root.getByText('Read the calculation', { exact: true }).click();
  await expect(root.locator('details')).toContainText('Conversely, subtracting');
  expect(errors).toEqual([]);
});

test('row operation shares reduced-motion navigation, restoration, theme and disposal', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experiments/rectangular-product/?view=row-operation&guided=1#replace');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-milestone', 'replace');
  await root.getByRole('button', { name: 'Next', exact: true }).click(); await expect(root).toHaveAttribute('data-milestone', 'why');
  await page.reload(); await expect(root).toHaveAttribute('data-milestone', 'why');
  await root.getByRole('button', { name: 'Light mode', exact: true }).click();
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('3');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('row-add-light.png'), scale: 'css' });
  await root.getByRole('slider', { name: 'Animation position' }).focus(); await page.keyboard.press('Home');
  await expect(root).toHaveAttribute('data-milestone', 'system');
  await page.keyboard.press('End'); await expect(root).toHaveAttribute('data-milestone', 'why');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(root).not.toHaveAttribute('data-ready');
});
