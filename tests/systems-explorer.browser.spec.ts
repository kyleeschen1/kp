import { test, expect } from '@playwright/test';
import { createSystemsExplorer } from '../src/experiments/rectangular-product/systems-explorer-model.ts';
import { normalizedPngRasterDelta } from './helpers/png-raster-diff.ts';

for (const size of [2, 3] as const) for (const kind of ['unique', 'infinite', 'none'] as const)
test(`generated ${size} ${kind}: exact endpoints, continuous handoffs and structural questions`, async ({ page }, info) => {
  const candidate = createSystemsExplorer({ size, kind, seed: 1 });
  if (candidate.status !== 'ready') throw new Error(candidate.message);
  const model = candidate.model, errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`/experiments/rectangular-product/?view=row-composition&example=generated&size=${size}&kind=${kind}&seed=1`);
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  const stage = root.locator('.row-composition-stage'), slider = root.getByRole('slider', { name: 'Animation position' });
  await slider.evaluate(n => n.setAttribute('step', 'any'));
  const seek = (p: number) => slider.evaluate((n, value) => {
    if (!(n instanceof HTMLInputElement)) throw new Error('Expected slider');
    n.value = String(value); n.dispatchEvent(new Event('input', { bubbles: true }));
  }, p);
  for (const [i, seam] of model.stops.slice(1, -1).entries()) {
    await seek(seam - .000001); const left = await stage.screenshot({ scale: 'css' });
    await seek(seam + .000001); const right = await stage.screenshot({ scale: 'css' });
    expect(normalizedPngRasterDelta(left, right), `handoff ${i}`).toBeLessThan(.0002);
  }
  for (const [i, step] of model.steps.entries()) {
    const p = (model.stops[i + 1]! + model.stops[i + 2]!) / 2;
    await seek(p); await expect(root.locator('[data-cue]')).toHaveText(step.during);
    await seek(model.stops[i + 2]!); await expect(root.locator('[data-cue]')).toHaveText(step.after);
  }
  for (const p of [0, .3, .6, .9, 1]) {
    await seek(p); const first = await stage.screenshot({ scale: 'css' });
    await seek(1); await seek(0); await seek(p);
    expect(normalizedPngRasterDelta(first, await stage.screenshot({ scale: 'css' }))).toBeLessThan(.0002);
  }
  await seek(1); await root.locator('.matrix-card').screenshot({ path: info.outputPath('expanded.png') });
  if (kind !== 'unique') await expect(stage.locator('[data-composition-layer="after"] [data-natural-key^="zero-"]').first()).toHaveText('0');
  await root.getByText('Inspect solutions and structure', { exact: true }).click();
  await root.getByRole('combobox', { name: 'Question about this system' }).selectOption('echelon');
  await expect(root.locator('[data-answer]')).toContainText('pivots');
  await root.getByRole('combobox', { name: 'Question about this system' }).selectOption('independence');
  await expect(root.locator('[data-answer]')).toContainText(`rank ${candidate.generated.solution.rank}`);
  await expect(root).toHaveAttribute('data-milestone', 'expanded');
  if (kind === 'infinite') {
    const parameter = root.locator('[data-parameter]').first();
    const original = await root.locator('[data-parameter-result]').textContent();
    await parameter.fill('2'); await parameter.dispatchEvent('input');
    await expect(root.locator('[data-parameter-result]')).not.toHaveText(original!);
    await expect(root.locator('[data-parameter-result]')).toContainText('b');
  }
  await root.getByRole('button', { name: 'Light mode', exact: true }).click();
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('light.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(root).toHaveAttribute('data-ready', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  expect(errors).toEqual([]);
});

test('generator controls produce repeatable URLs and reduced-motion navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experiments/rectangular-product/?view=row-composition&example=generated&size=2&kind=unique&seed=2');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await root.getByRole('combobox', { name: 'Solution type' }).selectOption('none');
  await root.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page).toHaveURL(/kind=none/); await expect(root).toHaveAttribute('data-ready', 'true');
  await root.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(root).toHaveAttribute('data-milestone', 'matrix');
  await root.getByRole('button', { name: 'New problem', exact: true }).click();
  await expect(page).toHaveURL(/seed=3/); await expect(root).toHaveAttribute('data-ready', 'true');
  await root.getByRole('combobox', { name: 'System size' }).selectOption('3');
  await root.getByRole('combobox', { name: 'Solution type' }).selectOption('infinite');
  await root.getByRole('combobox', { name: 'Coefficient rank' }).selectOption('1');
  await root.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page).toHaveURL(/rank=1/); await expect(root).toHaveAttribute('data-ready', 'true');
  await root.getByText('Inspect solutions and structure', { exact: true }).click();
  await expect(root.locator('[data-parameter]')).toHaveCount(2);
  await root.getByRole('combobox', { name: 'Solution type' }).selectOption('unique');
  await expect(root.getByRole('combobox', { name: 'Coefficient rank' })).toBeDisabled();
  await root.getByRole('combobox', { name: 'System size' }).selectOption('2');
  await root.getByRole('combobox', { name: 'Solution type' }).selectOption('none');
  await expect(root.getByRole('combobox', { name: 'Coefficient rank' })).toHaveValue('1');
});
