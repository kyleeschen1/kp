import { test, expect } from '@playwright/test';
import { basisComposition } from '../src/experiments/matrix-column-combinations/basis-composition.ts';

test('basis-aware composition reuses column motion and exposes the coordinate distinction', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const mode of ['adapted', 'standard'] as const) for (const column of [0, 1]) {
    const source = basisComposition(mode, column);
    await page.goto(`/experiments/matrix-column-combinations/?example=composition&basis=${mode}&column=${column}#placed`);
    await expect(page.locator('#comb-player')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('[data-basis-mode]')).toHaveAttribute('data-basis-mode', mode);
    for (const row of [0, 1]) {
      const entry = page.locator(`[data-kp-comb-key="c-${row}-${column}"]`);
      await expect(entry).toHaveText(String(source.representation.rows[row]![column]));
      await expect(entry).toHaveCSS('opacity', '1');
    }
    await page.getByText('Why matching dimensions are not enough', { exact: true }).click();
    await expect(page.locator('[data-basis-gap]')).toBeVisible();
    await expect(page.locator('[data-basis-gap]')).toContainText('intermediate bases must match');
    const slider = page.getByRole('slider', { name: 'Animation position' });
    const poses = () => page.locator('.comb-stage [style]').evaluateAll(nodes => nodes.map(node => node.getAttribute('style')));
    await slider.fill('0.4'); const held = await poses();
    await slider.fill('1'); await slider.fill('0'); await slider.fill('0.4');
    expect(await poses()).toEqual(held);
    await page.locator('.matrix-card').screenshot({ path: info.outputPath(`${mode}-${column}-transit.png`) });
    await slider.fill('1');
    await page.screenshot({ path: info.outputPath(`${mode}-${column}-context.png`), fullPage: true });
  }
  await page.goto('/experiments/matrix-examples/');
  await page.getByRole('combobox', { name: 'Example', exact: true }).selectOption('composition');
  const child = page.frameLocator('#example-frame');
  await expect(child.locator('[data-basis-mode]')).toHaveAttribute('data-basis-mode', 'adapted');
  await child.getByRole('link', { name: 'Use E between the maps' }).click();
  await expect(child.locator('[data-basis-mode]')).toHaveAttribute('data-basis-mode', 'standard');
  await expect(child.locator('#comb-player')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Side by side', exact: true }).click();
  await expect(child.locator('html')).toHaveAttribute('data-matrix-layout', 'side');
  await page.goto('/experiments/matrix-column-combinations/?example=composition&basis=unknown');
  await expect(page.locator('#comb-player')).toHaveAttribute('data-gap', 'true');
  await expect(page.locator('#comb-player')).toContainText('Choose the adapted or standard intermediate basis');
  expect(errors).toEqual([]);
});
