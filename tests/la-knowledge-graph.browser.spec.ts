import { test, expect } from '@playwright/test';

test('browse conceptual relationships into real statements and proofs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/la-knowledge-graph/');
  await expect(page.getByRole('heading', { name: 'Matrix multiplication', exact: true })).toBeVisible();
  await expect(page.locator('article .katex').first()).toBeVisible();
  await page.getByRole('button', { name: 'A proof neighborhood' }).click();
  await expect(page.getByRole('heading', { name: 'Informal proof outline' })).toBeVisible();
  await page.locator('article .relationships a').filter({ hasText: 'leastsquares-ATA-method' }).click();
  await expect(page.locator('article > .eyebrow')).toContainText('source-structure');
  await page.locator('article .relationships li').filter({ has: page.locator('.relation', { hasText: '← proof of' }) }).locator('a').click();
  await expect(page.locator('article > .eyebrow')).toContainText('/ proof /');
  await expect(page.locator('article > .math-text')).not.toBeEmpty();
  await page.goBack();
  await expect(page.locator('article > .eyebrow')).toContainText('/ theorem /');
  expect(errors).toEqual([]);
});

test('search four sources, restore deep links, and expose extraction limits', async ({ page }) => {
  await page.goto('/experiments/la-knowledge-graph/#concept%3Acovector');
  await expect(page.getByRole('heading', { name: 'Covector / linear functional', exact: true })).toBeVisible();
  await page.getByLabel('Collection', { exact: true }).selectOption('axler');
  await page.getByLabel('Search definitions, statements, proofs', { exact: true }).fill('dual space');
  await expect(page.locator('.results')).toContainText('PDF page 119');
  await page.locator('.results').getByRole('link', { name: 'PDF page 119', exact: true }).click();
  await expect(page.locator('.pdf-text')).toContainText('linear functional');
  await page.getByText('Sources, licenses and extraction boundaries', { exact: true }).click();
  await expect(page.locator('.audit')).toContainText('No extracted proof is formally verified');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'PDF page 119', exact: true })).toBeVisible();
});

test('one exemplar is usable on desktop and narrow screens', async ({ page }, testInfo) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/experiments/la-knowledge-graph/#concept%3Aproduct');
    await expect(page.locator('article .katex').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    expect(overflow).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`graph-${width}.png`), fullPage: true });
  }
});
