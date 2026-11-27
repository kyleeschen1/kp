import { test, expect, type Page } from '@playwright/test';
const route = '/experiments/polynomial-accumulation/';
async function open(page: Page, query = '') { await page.goto(route + query); await expect(page.locator('#polynomial-accumulation')).toHaveAttribute('data-ready', 'true'); }
async function seek(page: Page, value: number) { await page.getByRole('slider', { name: 'Accumulation progress' }).evaluate((node, p) => { const input = node as HTMLInputElement; input.value = String(p); input.dispatchEvent(new Event('input', { bubbles: true })); }, value); }
test('signed and geometric totals, reversed bounds, drafts and precise URL return share one source', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 1000 }); await open(page);
  await expect(page.locator('[data-exact=signed]')).toHaveText('4/3'); await expect(page.locator('[data-exact=geometric]')).toHaveText('4');
  const node = await page.locator('[data-part=A-point]').elementHandle();
  await seek(page, .5); await expect(page.locator('[data-number=x]')).toHaveText('0.00');
  expect(await node!.evaluate(n => n.isConnected)).toBe(true);
  await page.locator('[data-end]').click(); await page.locator('[data-swap]').click();
  await expect(page.locator('[data-exact=signed]')).toHaveText('-4/3'); await expect(page.locator('[data-exact=geometric]')).toHaveText('4');
  await expect(page.locator('[data-direction]')).toContainText('Moving left');
  await page.screenshot({ path: info.outputPath('desktop-reversed.png'), fullPage: true });
  await page.locator('[data-case]').selectOption('linear'); await expect(page.locator('[data-exact=signed]')).toHaveText('0');
  await page.locator('[data-a]').fill('1.23'); await expect(page.locator('[data-a]')).toBeFocused();
  await seek(page, .37); const total = await page.locator('[data-exact=signed]').textContent();
  await page.reload(); await expect(page.locator('[data-a]')).toHaveValue('1.23'); await expect(page.locator('[data-exact=signed]')).toHaveText(total!);
  const path = await page.locator('[data-part=below]').getAttribute('d');
  await page.locator('[data-a]').fill('-'); await expect(page.locator('[data-play]')).toBeDisabled();
  await expect(page.locator('[data-part=below]')).toHaveAttribute('d', path!);
  await page.locator('[data-a]').fill('0'); await page.locator('[data-b]').fill('0');
  await expect(page.locator('[data-play]')).toBeDisabled(); await expect(page.locator('[data-exact=geometric]')).toHaveText('0');
  expect(errors).toEqual([]);
});
test('playback pauses on interruption and reduced motion offers direct steps', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 }); await open(page);
  await page.locator('[data-play]').click(); await expect(page.locator('#polynomial-accumulation')).toHaveAttribute('data-playing', 'true');
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect(page.locator('#polynomial-accumulation')).toHaveAttribute('data-playing', 'false');
  const point = await page.locator('[data-part=A-point]').getAttribute('cy'); await page.waitForTimeout(120); await expect(page.locator('[data-part=A-point]')).toHaveAttribute('cy', point!);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.locator('[data-start]').click(); await page.locator('[data-play]').click();
  await expect(page.locator('[data-number=x]')).toHaveText('-1.00');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await page.locator('[data-end]').click(); await expect(page.locator('[data-exact=signed]')).toHaveText('4/3');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(page.locator('#polynomial-accumulation')).toHaveAttribute('data-playing', 'false');
});
test('phone and enlarged text fit, numeric slots and following prose remain stable through seeks', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page);
  const slot = page.locator('[data-number=total]'), note = page.locator('.axis-note'), base = await slot.boundingBox(), prose = await note.boundingBox();
  const graph = await page.locator('[data-function] svg').boundingBox(), zero = await page.locator('[data-tick="0"]').first().boundingBox();
  expect(Math.abs(zero!.x + zero!.width / 2 - (graph!.x + graph!.width / 2))).toBeLessThan(.5);
  for (const p of [0, .1, .25, .5, .75, 1, .333]) {
    await seek(page, p); const now = await slot.boundingBox(), after = await note.boundingBox();
    expect(Math.abs(now!.width - base!.width)).toBeLessThan(.1); expect(Math.abs(after!.y - prose!.y)).toBeLessThan(.5);
  }
  await page.locator('[data-theme]').click(); await expect(page.locator('.graph-svg__background').first()).toHaveCSS('fill', 'rgb(18, 24, 38)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('phone-dark.png'), fullPage: true });
  await page.evaluate(() => { document.body.style.fontSize = '28px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const enlargedGraph = await page.locator('[data-function] svg').boundingBox(), enlargedZero = await page.locator('[data-tick="0"]').first().boundingBox();
  expect(Math.abs(enlargedZero!.x + enlargedZero!.width / 2 - (enlargedGraph!.x + enlargedGraph!.width / 2))).toBeLessThan(.5);
  await page.screenshot({ path: info.outputPath('phone-enlarged.png'), fullPage: true });
  await page.emulateMedia({ forcedColors: 'active' }); await expect(page.locator('[data-part=below]')).toHaveAttribute('d', /M/);
});
test('static reading and malformed links preserve explicit truth and repair', async ({ page, browser }) => {
  await open(page, '?case=cubic'); await expect(page.locator('[data-diagnostic]')).toContainText('default interval');
  const context = await browser.newContext({ javaScriptEnabled: false });
  try { const staticPage = await context.newPage(); await staticPage.goto('http://127.0.0.1:8000' + route);
    await expect(staticPage.locator('svg')).toHaveCount(2); await expect(staticPage.locator('[data-exact=signed]')).toHaveText('4/3');
    await expect(staticPage.locator('[data-a]')).toBeDisabled(); await expect(staticPage.locator('noscript')).toBeVisible();
  } finally { await context.close(); }
});
