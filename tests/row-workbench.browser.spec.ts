import { test, expect } from '@playwright/test';

test('compact operations compose, retain unchanged DOM, scrub deterministically and undo exactly', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/experiments/rectangular-product/?view=row-operation');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  const stage = root.locator('.row-wb-stage');
  const equality = stage.locator('.row-wb-equal');
  const equalityBounds = await equality.boundingBox();
  const originals = await root.locator('[data-native] [data-source-id]').elementHandles();
  const ids = await root.locator('[data-native] [data-source-id]').evaluateAll(ns => ns.map(n => n.getAttribute('data-source-id')));
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('compact-initial.png') });
  for (let step = 1; step <= 4; step++) {
    await root.locator('[data-demo]').click(); await expect(root.locator('[data-pause]')).toBeEnabled();
    await root.locator('[data-pause]').click();
    const slider = root.getByRole('slider', { name: 'Operation preview' });
    const paint = () => stage.locator('[style]').evaluateAll(ns => ns.map(n => n.getAttribute('style')));
    for (const phase of [.1, .28, .47, .65, .83, .99]) {
      await slider.fill(String(phase)); const before = await paint();
      await slider.fill('0.02'); await slider.fill('0.99'); await slider.fill(String(phase)); expect(await paint()).toEqual(before);
      await expect(equality).toBeVisible();
      await expect(equality).toHaveCSS('opacity', '1');
      expect(await equality.boundingBox()).toEqual(equalityBounds);
      await root.locator('.matrix-card').screenshot({ path: info.outputPath(`compact-${step}-${phase}.png`) });
    }
    await root.locator('[data-finish]').click(); await expect(root).toHaveAttribute('data-cursor', String(step));
    await expect(root).toHaveAttribute('data-busy', 'false');
    if (step === 1) for (const element of originals) expect(await element.evaluate(n => n.isConnected)).toBe(true);
  }
  await expect(root.locator('[data-native] [data-row="0"][data-column="0"]')).toHaveAttribute('data-source-id', 'workbench.step-3.result.0');
  await expect(root.locator('[data-native] [data-row="0"][data-column="3"]')).toContainText('3');
  await expect(root.locator('[data-native] [data-row="0"][data-column="2"] .mfrac')).toHaveCount(1);
  await root.locator('[data-theme]').click();
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('compact-final-light.png') });
  for (let cursor = 3; cursor >= 0; cursor--) {
    await root.locator('[data-undo]').click(); await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
    await expect(root).toHaveAttribute('data-cursor', String(cursor));
  }
  expect(await root.locator('[data-native] [data-source-id]').evaluateAll(ns => ns.map(n => n.getAttribute('data-source-id')).sort())).toEqual(ids.sort());
  await root.locator('[data-redo]').click(); await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
  await expect(root).toHaveAttribute('data-cursor', '1');
  expect(errors).toEqual([]); await expect(root.locator('.katex-error')).toHaveCount(0);
});

test('invalid input, cancellation, reset and reduced motion preserve atomic history', async ({ page }) => {
  await page.goto('/experiments/rectangular-product/?view=row-operation');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await root.locator('[data-operation]').selectOption('scale'); await root.locator('[data-factor]').fill('0');
  await root.locator('[data-apply]').click(); await expect(root.locator('[data-status]')).toContainText('not invertible');
  await expect(root).toHaveAttribute('data-cursor', '0');
  await root.locator('[data-factor]').fill('1/2'); await root.locator('[data-apply]').click();
  await expect(root.locator('[data-apply]')).toBeDisabled(); await expect(root.locator('[data-pause]')).toBeEnabled();
  await root.locator('[data-pause]').click(); await root.getByRole('slider', { name: 'Operation preview' }).fill('0.65');
  await root.locator('[data-cancel]').click(); await expect(root).toHaveAttribute('data-cursor', '0');
  await expect(root.locator('[data-native] [data-row="0"][data-column="0"]')).toContainText('2');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await root.locator('[data-apply]').click(); await expect(root).toHaveAttribute('data-cursor', '1');
  await root.locator('[data-undo]').click(); await expect(root).toHaveAttribute('data-cursor', '0');
  await root.locator('[data-operation]').selectOption('swap'); await root.locator('[data-apply]').click();
  await expect(root.locator('[data-redo]')).toBeDisabled();
  await root.locator('[data-reset]').click(); await expect(root).toHaveAttribute('data-cursor', '0');
  await expect(root.locator('[data-history] li')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(root).not.toHaveAttribute('data-ready');
});

test('a negative fractional add evaluates multiplication before addition, with stable source paint', async ({ page }, info) => {
  await page.goto('/experiments/rectangular-product/?view=row-operation');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  const source = root.locator('[data-native] [data-row="1"]');
  const poses = await source.evaluateAll(ns => ns.map(n => n.getAttribute('style')));
  await root.locator('[data-factor]').fill('-1/2'); await root.locator('[data-apply]').click();
  await expect(root.locator('[data-pause]')).toBeEnabled(); await root.locator('[data-pause]').click();
  const slider = root.getByRole('slider', { name: 'Operation preview' });
  for (const p of [.28, .47, .65, .83]) {
    await slider.fill(String(p));
    expect(await source.evaluateAll(ns => ns.map(n => n.getAttribute('style')))).toEqual(poses);
    const paint = await root.locator('.row-wb-stage [style]').evaluateAll(ns => ns.map(n => n.getAttribute('style')));
    await slider.fill('0.99'); await slider.fill(String(p));
    expect(await root.locator('.row-wb-stage [style]').evaluateAll(ns => ns.map(n => n.getAttribute('style')))).toEqual(paint);
    expect(await root.locator('.row-wb-equal').evaluate(n => { const m = new DOMMatrix(getComputedStyle(n).transform); return [m.a, m.d]; })).toEqual([1, 1]);
    await root.locator('.matrix-card').screenshot({ path: info.outputPath(`negative-fraction-${p}.png`) });
  }
  await root.locator('[data-finish]').click(); await expect(root).toHaveAttribute('data-cursor', '1');
  await expect(root.locator('[data-native] [data-row="0"][data-column="2"]')).toContainText('4');
  await root.locator('summary').first().click();
  await expect(root.locator('[data-current]')).toContainText('15');
  await expect(root.locator('[data-current] .mfrac')).toHaveCount(2);
});
