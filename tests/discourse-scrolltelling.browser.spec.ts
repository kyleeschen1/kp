import { test, expect } from '@playwright/test';
import { explanation } from '../src/experiments/discourse-scrolltelling/source.ts';

const path = '/experiments/discourse-scrolltelling/';
test('one full-screen card hands an instruction to a synchronized pairing scrubber', async ({ page }, info) => {
  await page.goto(`${path}?view=attention-card`);
  const player = page.locator('#discourse-player');
  await expect(player).toHaveAttribute('data-attention-ready', 'true');
  const travel = async (value: number) => page.locator('.discourse-layout').evaluate((node, value) => {
    scrollTo(0, node.getBoundingClientRect().top + scrollY + value * innerHeight * 3);
  }, value);
  const paint = () => page.locator('[data-kp-dot-key="left-0"]').evaluate(node => {
    const r = node.getBoundingClientRect(); return { x: r.x, y: r.y };
  });
  await expect(player).toHaveAttribute('data-attention-phase', 'read');
  const before = await paint();
  const frame = await page.locator('.matrix-card').boundingBox();
  expect(frame!.width).toBe(page.viewportSize()!.width);
  expect(frame!.height).toBe(page.viewportSize()!.height);
  expect(before.x).toBeGreaterThan(0); expect(before.x).toBeLessThan(page.viewportSize()!.width * .15);
  await page.screenshot({ path: info.outputPath('attention-read.png') });
  await travel(.25);
  await expect(player).toHaveAttribute('data-attention-phase', 'watch');
  await expect(page.getByText('Watch the column turn.', { exact: true })).toBeVisible();
  expect(await paint()).toEqual(before);
  await page.screenshot({ path: info.outputPath('attention-watch.png') });
  await travel(.55);
  const scrubber = page.getByRole('slider', { name: 'Pairing progress', exact: true });
  await expect(scrubber).toBeVisible();
  await expect(page.getByText('Watch the column turn.', { exact: true })).toBeHidden();
  await expect.poll(async () => Number(await scrubber.inputValue())).toBeCloseTo(.5, 2);
  await expect.poll(() => page.locator('.dot-stage').getAttribute('data-progress').then(Number)).toBeCloseTo(.125, 3);
  await page.screenshot({ path: info.outputPath('attention-scrub.png') });
  await scrubber.fill('0.7');
  await expect.poll(() => page.evaluate(() => scrollY / (innerHeight * 3))).toBeCloseTo(.65, 2);
  await travel(.55); await expect.poll(async () => Number(await scrubber.inputValue())).toBeCloseTo(.5, 2);
  await travel(.9); await expect(player).toHaveAttribute('data-attention-phase', 'inspect');
  await expect(page.getByText('Same entries. Three pairs.', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('attention-inspect.png') });
  await travel(.25); expect(await paint()).toEqual(before);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await travel(.55); await expect(page.locator('.dot-stage')).toHaveAttribute('data-progress', '0');
  await travel(.9); await expect(page.locator('.dot-stage')).toHaveAttribute('data-progress', '0.25');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: info.outputPath('attention-phone.png') });
});

test('split scroll owns intermediate frames and rebases manual inspection without a jump', async ({ page }, info) => {
  await page.goto(path);
  const player = page.locator('#discourse-player');
  await expect(player).toHaveAttribute('data-scroll-ready', 'true');
  const timeline = page.getByRole('slider', { name: 'Animation position' });
  const middle = await page.evaluate(() => {
    const y = (id: string) => document.querySelector(`#${id} h2`)!.getBoundingClientRect().top + scrollY;
    return (y('select') + y('pair')) / 2 - innerHeight * .36;
  });
  await page.evaluate(y => scrollTo(0, y), middle);
  await expect.poll(async () => Number(await timeline.inputValue())).toBeCloseTo(.125, 2);
  await expect(player).toHaveAttribute('data-scroll-phase', 'transition');
  const held = await timeline.inputValue();
  await page.waitForTimeout(250);
  await expect(timeline).toHaveValue(held);
  await page.evaluate(y => scrollTo(0, y + 100), middle);
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(Number(held));
  await page.evaluate(y => scrollTo(0, y), middle);
  await expect(timeline).toHaveValue(held);
  await page.screenshot({ path: info.outputPath('split-mid-transition.png') });
  await timeline.fill('0.4');
  await page.evaluate(() => scrollBy(0, 1));
  await expect.poll(async () => Number(await timeline.inputValue())).toBeCloseTo(.4, 2);
  await page.evaluate(() => scrollBy(0, 80));
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(.4);
});

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
