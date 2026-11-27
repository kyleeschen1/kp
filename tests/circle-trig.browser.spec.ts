import { test, expect, type Page } from '@playwright/test';
const route = '/experiments/circle-trig/';
async function open(page: Page, query = '') { await page.goto(route + query); await expect(page.locator('#circle-trig')).toHaveAttribute('data-ready', 'true'); }
const point = (page: Page) => page.locator('[data-part=point]');
test('one point links quadrant signs, periodic values and precise URL return without replacing graph nodes', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 1000 }); await open(page);
  const field = page.getByRole('textbox', { name: 'Angle in degrees' }), node = await point(page).elementHandle();
  await field.fill('210'); await expect(page.locator('[data-region]')).toContainText('III');
  await expect(page.locator('[data-number=x]')).toHaveText('-0.866'); await expect(page.locator('[data-number=y]')).toHaveText('-0.500');
  const before = await point(page).getAttribute('cx');
  await field.fill('570'); await expect(point(page)).toHaveAttribute('cx', before!);
  await expect(field).toBeFocused(); expect(await node!.evaluate(n => n.isConnected)).toBe(true);
  await page.reload(); await expect(field).toHaveValue('570'); await expect(page.locator('[data-number=wrapped]')).toHaveText('210.0');
  await field.fill('-'); await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-play]')).toBeDisabled(); await expect(point(page)).toHaveAttribute('cx', before!);
  await field.fill('-90'); await expect(page.locator('[data-number=x]')).toHaveText('0.000'); await expect(page.locator('[data-number=y]')).toHaveText('-1.000');
  await page.screenshot({ path: info.outputPath('desktop-negative-angle.png'), fullPage: true });
  await field.fill('0.00000000000001');
  expect(Number(await page.locator('#circle-trig').getAttribute('data-y'))).toBeGreaterThan(0);
  await page.reload();
  await expect(field).toHaveValue('1e-14');
  expect(Number(await page.locator('#circle-trig').getAttribute('data-y'))).toBeGreaterThan(0);
  await expect(page.locator('[data-region]')).toContainText('Quadrant I');
  expect(errors).toEqual([]);
});
test('playback, interruption, exact quarter turns and reduced motion retain one source', async ({ page }) => {
  await open(page, '?angle=0');
  await page.getByRole('button', { name: 'Play', exact: true }).click(); await expect(page.locator('#circle-trig')).toHaveAttribute('data-playing', 'true');
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect(page.locator('#circle-trig')).toHaveAttribute('data-playing', 'false');
  const before = await point(page).getAttribute('cy'); await page.waitForTimeout(120); await expect(point(page)).toHaveAttribute('cy', before!);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.getByRole('textbox').fill('0');
  await page.locator('[data-play]').click(); await expect(page.locator('[data-number=angle]')).toHaveText('90.0');
  await page.getByRole('button', { name: 'Previous quarter turn' }).click(); await expect(page.locator('[data-number=angle]')).toHaveText('0.0');
  await page.getByRole('textbox').fill('359.9'); await page.getByRole('button', { name: 'Next quarter turn' }).click();
  await expect(page.locator('[data-number=wrapped]')).toHaveText('0.0'); await expect(page.locator('[data-number=x]')).toHaveText('1.000');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('svg')).toHaveCount(2);
});
test('numeric slots and following text stay stable; phone, enlarged text and dark theme remain readable', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page);
  const slot = page.locator('[data-number=x]'), note = page.locator('.wrap-note'), base = await slot.boundingBox(), next = await note.boundingBox();
  for (const angle of ['-360', '-0.1', '0', '89.99', '180', '359.99', '360', '570', '720']) {
    await page.getByRole('textbox').fill(angle);
    const box = await slot.boundingBox(), after = await note.boundingBox();
    expect(Math.abs(box!.width - base!.width)).toBeLessThan(.1); expect(Math.abs(after!.y - next!.y)).toBeLessThan(.5);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('.graph-svg__background').first()).toHaveCSS('fill', 'rgb(18, 24, 38)');
  await page.screenshot({ path: info.outputPath('phone-dark.png'), fullPage: true });
  await page.evaluate(() => { document.body.style.fontSize = '28px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('phone-enlarged.png'), fullPage: true });
});
test('static reading works without JavaScript and malformed URLs retain an explicit repair', async ({ page, browser }) => {
  await open(page, '?angle=bogus'); await expect(page.locator('[data-diagnostic]')).toContainText('Showing 45');
  const context = await browser.newContext({ javaScriptEnabled: false });
  try { const staticPage = await context.newPage(); await staticPage.goto('http://127.0.0.1:8000' + route);
    await expect(staticPage.locator('svg')).toHaveCount(2); await expect(staticPage.locator('math')).toHaveCount(3);
    await expect(staticPage.getByRole('textbox')).toBeDisabled(); await expect(staticPage.locator('noscript')).toBeVisible();
  } finally { await context.close(); }
});
