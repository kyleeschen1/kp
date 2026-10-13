import { test, expect } from '@playwright/test';

test('matrix and equation selection share bindings through preview, cancellation, swap and history', async ({ page }, info) => {
  await page.goto('/experiments/rectangular-product/?view=row-operation');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  const row = root.locator('[data-matrix-row="0"]'), equation = root.locator('[data-equation-row="0"]');
  const other = root.locator('[data-equation-row="1"]');
  await expect(equation).toHaveAttribute('data-latex', '7=2x-y+3z');
  await expect(other).toHaveAttribute('data-latex', '-1=y-2z');
  const pose = () => root.locator('[data-native] [data-source-id]').evaluateAll(nodes => nodes.map(n => {
    const r = n.getBoundingClientRect(), s = n.closest('.row-wb-stage')!.getBoundingClientRect(); return [r.x - s.x, r.y - s.y, r.width, r.height];
  }));
  const initialPose = await pose();
  await row.click(); await expect(equation).toHaveAttribute('aria-pressed', 'true');
  expect(await equation.getAttribute('data-source-ids')).toEqual(await row.getAttribute('data-source-ids'));
  expect(await pose()).toEqual(initialPose);
  await other.focus(); await page.keyboard.press('Enter');
  await expect(root.locator('[data-matrix-row="1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(row).toHaveAttribute('aria-pressed', 'false');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('linked-initial.png') });
  await root.locator('[data-demo]').click(); await root.locator('[data-pause]').click();
  await expect(equation).toBeDisabled(); await expect(other).toHaveAttribute('aria-pressed', 'false');
  await expect(root.locator('[data-equation-status]')).toContainText('preview in progress');
  for (const progress of ['0.8', '0.2', '0.8']) {
    await root.locator('[data-scrub]').fill(progress);
    await expect(equation).toHaveAttribute('data-latex', '7=2x-y+3z');
  }
  await root.locator('[data-cancel]').click();
  await expect(other).toHaveAttribute('aria-pressed', 'true');
  await root.locator('[data-demo]').click(); await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
  await expect(equation).toHaveAttribute('data-latex', '-1=y-2z');
  await expect(other).toHaveAttribute('data-latex', '7=2x-y+3z');
  expect(await other.getAttribute('data-source-ids')).toEqual(await root.locator('[data-native] [data-row="1"]').evaluateAll(ns => ns.map(n => n.getAttribute('data-source-id')).join(' ')));
  await root.locator('[data-undo]').click(); await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
  await expect(equation).toHaveAttribute('data-latex', '7=2x-y+3z');
  await root.locator('[data-redo]').click(); await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
  await expect(equation).toHaveAttribute('data-latex', '-1=y-2z');
  await root.locator('[data-reset]').click();
  await expect(root.locator('[data-matrix-row][aria-pressed="true"]')).toHaveCount(0);
  await expect(equation).toHaveAttribute('data-latex', '7=2x-y+3z');
});

test('contradiction, fractions and light narrow reading retain exact accessible equations', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experiments/rectangular-product/?view=row-operation&example=inconsistent');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await root.locator('[data-demo]').click();
  const equation = root.locator('[data-equation-row="1"]');
  await expect(equation).toHaveAttribute('data-latex', '1=0');
  await expect(equation.locator('math')).toHaveCount(1);
  await equation.click();
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('linked-contradiction.png') });
  await root.locator('[data-operation]').selectOption('scale');
  await root.locator('[data-target]').selectOption('1'); await root.locator('[data-factor]').fill('-1/2');
  await root.locator('[data-apply]').click();
  await expect(equation).toHaveAttribute('data-latex', '-\\frac{1}{2}=0');
  await root.locator('[data-theme]').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await equation.click(); await equation.click();
  await expect(equation).toHaveAttribute('aria-pressed', 'true');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('linked-light-narrow.png') });
  expect(await equation.evaluate(n => n.scrollWidth <= n.clientWidth + 1)).toBe(true);
  await root.locator('[data-reset]').click();
  await expect(equation).toHaveAttribute('data-latex', '15=2x+4y+6z');
});
