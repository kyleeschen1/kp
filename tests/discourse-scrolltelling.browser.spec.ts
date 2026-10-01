import { test, expect } from '@playwright/test';
import { explanation } from '../src/experiments/discourse-scrolltelling/source.ts';

const path = '/experiments/discourse-scrolltelling/';
test('scroll selects existing milestones, reverses and skips without a queue', async ({ page }, info) => {
  await page.goto(path);
  const player = page.locator('#discourse-player');
  await expect(player).toHaveAttribute('data-scroll-ready', 'true');
  const timeline = page.getByRole('slider', { name: 'Animation position' });
  for (const index of [1, 2, 4, 1, 0]) {
    const step = explanation.children[index]!;
    await page.locator(`#${step.id}`).evaluate(node => window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top - innerHeight * .25, behavior: 'instant' }));
    await expect(player).toHaveAttribute('data-reading-step', step.id);
    await expect(timeline).toHaveValue(String(step.milestone / 4), { timeout: 4000 });
    await expect(page.locator(`#${step.id}`)).toHaveAttribute('aria-current', 'step');
    await expect(page.locator(`#${step.id}`)).toHaveAttribute('data-source-ids', step.refs.map(ref => ref.id).join(' '));
  }
  await page.locator('#pair').evaluate(node => node.scrollIntoView());
  await expect(timeline).toHaveValue('0.25');
  await page.screenshot({ path: info.outputPath('desktop-pairs.png') });
});

test('detour restores exact interrupted progress and reading position', async ({ page }) => {
  await page.goto(`${path}#pair`);
  const player = page.locator('#discourse-player');
  await expect(player).toHaveAttribute('data-scroll-ready', 'true');
  const timeline = page.getByRole('slider', { name: 'Animation position' });
  await expect(timeline).toHaveValue('0.25');
  await timeline.fill('0.1734');
  const summary = page.locator('#why-pair summary');
  await summary.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await summary.click();
  await expect(player).toHaveJSProperty('inert', true);
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect(timeline).toHaveValue('0.1734');
  await page.getByRole('button', { name: 'Return to the calculation' }).click();
  await expect(player).toHaveJSProperty('inert', false);
  await expect(timeline).toHaveValue('0.1734');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
  await expect(summary).toBeFocused();
  await page.evaluate(() => { location.hash = 'result'; });
  await expect(timeline).toHaveValue('1');
  await page.reload();
  await expect(page.locator('#discourse-player')).toHaveAttribute('data-scroll-ready', 'true');
  await expect(timeline).toHaveValue('1');
  await timeline.fill('0.6');
  await page.evaluate(() => { location.hash = 'multiply'; });
  await expect(timeline).toHaveValue('0.5');
  await timeline.fill('0.4');
  await page.getByRole('link', { name: 'Inspect the products', exact: true }).click();
  await expect(timeline).toHaveValue('0.5');
});

test('narrow reduced-motion view leaves prose visible and direct links settled', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${path}#multiply`);
  await expect(page.locator('#discourse-player')).toHaveAttribute('data-scroll-ready', 'true');
  await expect(page.getByRole('slider', { name: 'Animation position' })).toHaveValue('0.5');
  const geometry = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth, viewport: innerWidth,
    stage: document.querySelector('.discourse-stage')!.getBoundingClientRect().bottom,
    heading: document.querySelector('#multiply h2')!.getBoundingClientRect().top,
  }));
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.stage).toBeLessThan(844 / 2);
  expect(geometry.heading).toBeGreaterThan(geometry.stage);
  await page.screenshot({ path: info.outputPath('mobile-products.png') });
});

test('static document contains the complete argument without scripting', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:8000${path}`);
  await expect(page.locator('[data-reading-step]')).toHaveCount(5);
  await expect(page.locator('#result')).toContainText('8 − 5 − 6 = −3');
  await page.locator('#why-pair summary').click();
  await expect(page.locator('#why-pair')).toContainText('matching basis');
  await context.close();
});
