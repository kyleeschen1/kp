import { expect, test, type Page } from '@playwright/test';
const url = '/experiments/inner-product-projection/';
async function ready(page: Page, suffix = '') {
  await page.goto(url + suffix); await expect(page.locator('#projection')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => document.fonts.ready);
}
const vector = (page: Page, role: string) => page.locator(`[data-graph] g[data-role=${role}]`);
async function seek(page: Page, progress: number) {
  await page.getByRole('slider').fill(String(progress));
}
test('editable projection retains semantic truth, discoverability and native return', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1120, height: 900 }); await ready(page);
  await seek(page, 1);
  await expect(vector(page, 'parallel')).toHaveAttribute('data-end', '3,3');
  await expect(vector(page, 'residual')).toHaveAttribute('data-end', '4,2');
  await expect(page.locator('[data-role=right-angle]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('positive.png'), fullPage: true });
  await seek(page, .6875); await expect(page.locator('[data-role=drop]')).toHaveAttribute('data-point', '3.5,2.5');
  await seek(page, 0); await expect(vector(page, 'parallel')).toBeHidden();
  await page.getByRole('combobox', { name: 'Example', exact: true }).selectOption('negative');
  await page.getByRole('button', { name: 'Explore relationships' }).click();
  const picker = page.getByRole('dialog', { name: 'Vector relationships' });
  await picker.getByRole('combobox').fill('remainder'); await page.keyboard.press('Enter');
  await expect(vector(page, 'parallel')).toHaveAttribute('data-end', '-1,-1');
  await expect(page.locator('[data-interpretation]')).toContainText('opposite');
  await expect(page).toHaveURL(/beat=native-settlement/);
  await page.reload(); await expect(vector(page, 'parallel')).toHaveAttribute('data-end', '-1,-1');
  const before = await page.locator('[data-graph]').innerHTML();
  await page.getByRole('textbox', { name: 'a x', exact: true }).fill('-');
  await expect(page.locator('[data-diagnostic]')).toContainText('last valid');
  await expect(page.getByRole('slider')).toBeDisabled();
  expect(await page.locator('[data-graph]').innerHTML()).toBe(before);
  await page.getByRole('textbox', { name: 'a x', exact: true }).fill('-4');
  await expect(page.getByRole('slider')).toBeEnabled();
  for (const id of ['orthogonal', 'zero-source']) {
    await page.getByRole('combobox', { name: 'Example', exact: true }).selectOption(id);
    await seek(page, 1); await expect(vector(page, 'parallel')).toHaveAttribute('data-end', '0,0');
  }
  await expect(page.locator('[data-interpretation]')).toContainText('angle are undefined');
  await page.getByRole('combobox', { name: 'Example', exact: true }).selectOption('zero-target');
  await expect(page.locator('[data-view]')).toBeHidden(); await expect(page.locator('[data-undefined]')).toBeVisible();
  await page.reload(); await expect(page.locator('[data-undefined]')).toBeVisible();
  await page.getByRole('combobox', { name: 'Example', exact: true }).selectOption('positive');
  await expect(vector(page, 'parallel')).toHaveAttribute('data-end', '3,3');
  expect(errors).toEqual([]);
});
test('phone, shared themes, reduced motion and captured commands stay usable', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page, '?a=4,2&b=1,1&beat=projection-drop');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('[data-play]').click();
  await expect(page.locator('#projection')).toHaveAttribute('data-beat', 'orthogonal-decomposition');
  await expect(page.locator('[data-role=drop-guide]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('phone-light.png'), fullPage: true });
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-kp-theme', 'dark');
  await page.screenshot({ path: info.outputPath('phone-dark.png'), fullPage: true });
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Vector relationships' }); await expect(picker).toBeVisible();
  await page.getByRole('textbox', { name: 'a x', exact: true }).evaluate((input: HTMLInputElement) => {
    input.value = '5'; input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(picker.getByRole('option').first()).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape'); await expect(picker).toBeHidden();
  await page.getByRole('button', { name: 'Explore relationships' }).click();
  await expect(picker.getByRole('option').first()).toHaveAttribute('aria-disabled', 'false');
});
test('playback interruptions and persisted page return retain a single live source', async ({ page }) => {
  await ready(page); await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  const progress = await page.getByRole('slider').inputValue();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  expect(await page.getByRole('slider').inputValue()).toBe(progress);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('textbox', { name: 'a x', exact: true }).fill('6');
  await expect(vector(page, 'source')).toHaveAttribute('data-end', '6,2');
  await seek(page, 1); await expect(vector(page, 'parallel')).toHaveAttribute('data-end', '4,4');
  await seek(page, 0); await expect(vector(page, 'residual')).toBeHidden();
});
