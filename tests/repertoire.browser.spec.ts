import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { installBuiltFocusRoute } from './support/built-focus-route.ts';

test('disciplines, topics, evidence and mobile reading stay simple', async ({ page }, info) => {
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto('/experiments/repertoire/#linear-algebra');
  await expect(page.getByRole('heading', { name: 'Projection and least squares', exact: true })).toBeVisible();
  await expect(page.locator('[data-discipline]:visible')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('repertoire-wide.png') });
  await page.getByLabel('Discipline', { exact: true }).selectOption('probability-statistics');
  await expect(page.getByRole('heading', { name: 'Probability and conditional reasoning', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Discipline', { exact: true })).toHaveValue('probability-statistics');
  const evidence = page.locator('[data-discipline]:visible .evidence').first();
  const response = await page.request.get((await evidence.getAttribute('href'))!);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toContain('binary');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('repertoire-phone.png') });
  await page.getByRole('link', { name: 'Shared reading motifs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Detail and continuity', exact: true })).toBeVisible();
});

test('topic and row links restore context after reload and history navigation', async ({ page }, info) => {
  await page.goto('/experiments/repertoire/#algebra');
  const topic = page.getByLabel('Topic', { exact: true });
  await topic.selectOption({ label: 'Logarithms and exponential equations' });
  await expect(page.locator('[data-discipline]:visible .topic:visible')).toHaveCount(1);
  await page.reload();
  await expect(topic).toHaveValue('topic-algebra-logarithms-and-exponential-equations');
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('repertoire-logarithms.png') });
  await page.goto('/experiments/repertoire/#alg.log.quotient-combine');
  await expect(page.locator('[id="alg.log.quotient-combine"]')).toBeInViewport();
  await expect(topic).toHaveValue('topic-algebra-logarithms-and-exponential-equations');
  await page.getByLabel('Discipline', { exact: true }).selectOption('programming');
  await page.goBack();
  await expect(page.getByLabel('Discipline', { exact: true })).toHaveValue('algebra');
  await expect(page.locator('[id="alg.log.quotient-combine"]')).toBeInViewport();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '125%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('repertoire-large-font.png') });
  await page.goto('/experiments/repertoire/#unknown-row');
  await expect(page.getByLabel('Discipline', { exact: true })).toHaveValue('algebra');
  await expect(page.locator('[data-discipline]:visible')).toHaveCount(1);
});

test('without scripts every discipline remains readable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:8000/experiments/repertoire/');
  await expect(page.locator('[data-discipline]:visible')).toHaveCount(await page.locator('#discipline option').count());
  await expect(page.getByLabel('Discipline', { exact: true })).toBeDisabled();
  await context.close();
});

test('built dashboard and packaged evidence need no development endpoints', async ({ page, context }) => {
  const output = new URL('../dist/', import.meta.url);
  await installBuiltFocusRoute(context, { output, pathname: '/experiments/repertoire/', origin: 'http://localhost:8000' });
  const evidencePath = 'experiments/repertoire/evidence/docs/project/repertoire-notes/algebra-audit.md.txt';
  await context.route('**/' + evidencePath, async route => {
    await route.fulfill({ body: await readFile(new URL(evidencePath, output)), contentType: 'text/plain' });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/repertoire/#alg.log.quotient-combine');
  const row = page.locator('[id="alg.log.quotient-combine"]');
  await expect(row).toBeInViewport();
  const popup = page.waitForEvent('popup');
  await row.locator('.evidence').click();
  await expect((await popup).locator('body')).toContainText('Algebra implementation audit');
  expect(errors).toEqual([]);
});
