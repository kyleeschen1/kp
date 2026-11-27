import { test, expect, type Page } from '@playwright/test';

const route = '/experiments/composition-area/';
const shape = (page: Page, side = 'left') => page.locator(`[data-graph=${side}] [data-role=image]`);
async function open(page: Page, suffix = '') {
  await page.goto(route + suffix); await expect(page.locator('#composition')).toHaveAttribute('data-ready', 'true');
}
test('paired endpoint maps, reverse seek, source edits and exact reload', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 1000 }); await open(page);
  await page.getByLabel('Explanation step', { exact: true }).selectOption('composed');
  await expect(shape(page)).toHaveAttribute('data-corners', '[[0,0],[2,0],[4,1],[2,1]]');
  await expect(shape(page, 'right')).toHaveAttribute('data-corners', '[[0,0],[2,0],[3,1],[1,1]]');
  await expect(page.locator('[data-conclusion]')).toContainText('do not commute');
  await page.screenshot({ path: info.outputPath('desktop-composed.png'), fullPage: true });
  await page.getByLabel('Explanation step', { exact: true }).selectOption('first');
  await expect(shape(page)).toHaveAttribute('data-corners', '[[0,0],[1,0],[2,1],[1,1]]');
  await page.getByLabel('Explanation progress').fill('0.75');
  const before = await shape(page).getAttribute('data-corners');
  await page.reload(); await expect(shape(page)).toHaveAttribute('data-corners', before!);
  await expect(page.getByLabel('Explanation progress')).toHaveValue('0.75');
  const field = page.getByLabel('A row 1 column 1');
  await field.fill('-'); await expect(page.locator('[data-diagnostic]')).toContainText('last valid pair');
  await expect(page.getByLabel('Explanation progress')).toBeDisabled();
  await expect(shape(page)).toHaveAttribute('data-corners', before!); await expect(field).toBeFocused();
  await field.fill('2'); await expect(page.getByLabel('Explanation progress')).toBeEnabled();
  await expect(field).toBeFocused(); expect(errors).toEqual([]);
});
test('reflection and collapse preserve orientation semantics in light and dark', async ({ page }, info) => {
  await open(page); await page.getByLabel('Example', { exact: true }).selectOption('reflection');
  await page.getByLabel('Explanation step', { exact: true }).selectOption('composed');
  await expect(page.locator('[data-area=left]')).toContainText('Signed area -1; area 1. Orientation reversed.');
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-kp-theme', 'dark');
  await expect(page.locator('[data-graph=left] .graph-svg__background')).toHaveCSS('fill', 'rgb(18, 24, 38)');
  await page.screenshot({ path: info.outputPath('dark-reflection.png'), fullPage: true });
  await page.getByLabel('Example', { exact: true }).selectOption('collapse');
  await expect(page.locator('[data-area=left]')).toContainText('Signed area 0; area 0. Collapsed.');
  await expect(shape(page)).toHaveAttribute('data-corners', '[[0,0],[1,1],[1,1],[0,0]]');
  await page.getByLabel('Explanation step', { exact: true }).selectOption('unit');
  await expect(page.locator('[data-area=left]')).toContainText('Signed area 1');
});
test('narrow reduced-motion reading keeps controls, notation and graphs accessible', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page);
  await page.locator('[data-play]').click();
  await expect(page.getByLabel('Explanation progress')).toHaveValue('0.5');
  await expect(page.locator('#composition')).toHaveAttribute('data-playing', 'false');
  await page.locator('[data-play]').click();
  await expect(page.getByLabel('Explanation progress')).toHaveValue('1');
  await expect(page.locator('[data-notation=left] math')).toHaveCount(1);
  const cue = await page.locator('[data-cue] .kp-focus-deck__annotation').boundingBox();
  const heading = await page.getByRole('heading', { name: 'A then B · BA' }).boundingBox();
  expect(cue!.y + cue!.height).toBeLessThanOrEqual(heading!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('phone-composed.png'), fullPage: true });
});
test('playback pauses on blur and invalid links report a repair', async ({ page }) => {
  await open(page, '?beat=unknown'); await expect(page.locator('[data-diagnostic]')).toContainText('Unknown checkpoint');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('#composition')).toHaveAttribute('data-playing', 'true');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#composition')).toHaveAttribute('data-playing', 'false');
  const p = await page.getByLabel('Explanation progress').inputValue();
  await page.waitForTimeout(150); await expect(page.getByLabel('Explanation progress')).toHaveValue(p);
  await page.locator('.comparison').evaluate(element => { (element as HTMLElement).hidden = true; });
  await expect(page.locator('[data-play]')).toHaveText('Next step');
  await page.locator('[data-play]').click();
  await expect(page.locator('#composition')).toHaveAttribute('data-playing', 'false');
  await page.locator('.comparison').evaluate(element => { (element as HTMLElement).hidden = false; });
});
