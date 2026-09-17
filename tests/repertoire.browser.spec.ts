import { test, expect } from '@playwright/test';

test('disciplines, topics, evidence and mobile reading stay simple', async ({ page }, info) => {
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto('/experiments/repertoire/#linear-algebra');
  await expect(page.getByRole('heading', { name: 'Projection', exact: true })).toBeVisible();
  await expect(page.locator('[data-discipline]:visible')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('repertoire-wide.png') });
  await page.getByLabel('Discipline', { exact: true }).selectOption('probability-statistics');
  await expect(page.getByRole('heading', { name: 'Conditional probability', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Discipline', { exact: true })).toHaveValue('probability-statistics');
  const evidence = page.locator('[data-discipline]:visible .evidence').first();
  const response = await page.request.get((await evidence.getAttribute('href'))!);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toContain('Bayesian');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('repertoire-phone.png') });
  await page.getByRole('link', { name: 'Shared reading motifs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Detail and continuity', exact: true })).toBeVisible();
});

test('without scripts every discipline remains readable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:8000/experiments/repertoire/');
  await expect(page.locator('[data-discipline]:visible')).toHaveCount(await page.locator('#discipline option').count());
  await expect(page.getByLabel('Discipline', { exact: true })).toBeDisabled();
  await context.close();
});
