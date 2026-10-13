import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { rowWorkbenchExamples } from '../src/experiments/rectangular-product/row-workbench-examples.ts';
import { rowWorkbenchReading } from '../src/experiments/rectangular-product/row-workbench-reading.ts';

for (const key of ['redundant', 'inconsistent']) test(`${key}: authored reasoning follows checked state and survives cancellation and undo`, async ({ page }, info) => {
  const model = rowWorkbenchExamples.find(e => e.key === key)!.model, authored = model.steps[0]!;
  await page.goto(`/experiments/rectangular-product/?view=row-operation&example=${key}`);
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root.locator('[data-cue]')).toHaveText(model.introduction);
  await root.locator('[data-demo]').click(); await root.locator('[data-pause]').click();
  await expect(root.locator('[data-cue]')).toContainText(authored.during);
  await expect(root).toHaveAttribute('data-authored-step', authored.id);
  await root.locator('[data-scrub]').fill('0.65');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath(`${key}-adding.png`) });
  await root.locator('[data-cancel]').click();
  await expect(root.locator('[data-cue]')).toHaveText(model.introduction);
  await expect(root.locator('[data-demo]')).toBeEnabled(); await expect(root).toHaveAttribute('data-cursor', '0');
  await root.locator('[data-demo]').click(); await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
  await expect(root.locator('[data-cue]')).toHaveText(authored.after);
  for (const column of [0, 1, 2]) await expect(root.locator(`[data-native] [data-row="1"][data-column="${column}"]`)).toHaveText('0');
  await expect(root.locator('[data-native] [data-row="1"][data-column="3"]')).toHaveText(key === 'redundant' ? '0' : '1');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath(`${key}-conclusion.png`) });
  await root.locator('[data-undo]').click(); await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
  await expect(root.locator('[data-cue]')).toHaveText(model.introduction);
  await expect(root.locator('[data-demo]')).toBeEnabled();
  await root.locator('[data-redo]').click(); await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
  await expect(root.locator('[data-cue]')).toHaveText(authored.after);
  await root.locator('[data-operation]').selectOption('swap'); await root.locator('[data-apply]').click();
  await expect(root.locator('[data-finish]')).toBeEnabled(); await root.locator('[data-finish]').click();
  await expect(root.locator('[data-cue]')).not.toHaveText(authored.after);
  await expect(root.locator('[data-demo]')).toBeDisabled();
  await root.locator('[data-example]').selectOption(key === 'redundant' ? 'inconsistent' : 'redundant');
  await expect(page).toHaveURL(new RegExp(`example=${key === 'redundant' ? 'inconsistent' : 'redundant'}`));
  await expect(root).toHaveAttribute('data-cursor', '0');
});

test('changed coefficients, unknowns, annotations and step IDs run through the same mounted player', async ({ page }) => {
  await page.goto('/experiments/rectangular-product/?view=row-operation');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(async () => {
    // Retire the canonical instance before installing a source-only pressure caller.
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
    const sourcePath = '/src/experiments/rectangular-product/row-workbench-source.ts';
    const playerPath = '/src/experiments/rectangular-product/row-workbench.ts';
    const { requireRowWorkbenchSource } = await import(sourcePath);
    const { mountRowWorkbench } = await import(playerPath);
    const model = requireRowWorkbenchSource({ id: 'pressure', title: 'Different letters, same mechanism', introduction: 'Inspect u, v and w.',
      unknowns: ['u', 'v', 'w'], coefficients: [[3, -2, 1], [6, -4, 2]], rhs: [5, 11],
      steps: [{ id: 'compare-constraints', operation: { kind: 'add', sourceRow: 0, targetRow: 1, factor: -2 },
        during: 'Cancel the three matching coefficients.', after: 'The remaining equation is 0 = 1. These constraints are inconsistent.' }] });
    await mountRowWorkbench(document.querySelector('#rectangular-player'), model);
  });
  await expect(root.locator('[data-unknown]')).toHaveText(['u', 'v', 'w']);
  await root.locator('[data-demo]').click();
  await expect(root).toHaveAttribute('data-authored-step', 'pressure.step.compare-constraints');
  await expect(root.locator('[data-cue]')).toContainText('0 = 1');
  await expect(root.locator('[data-native] [data-row="1"][data-column="3"]')).toHaveText('1');
  await root.locator('.row-wb-reading summary').click();
  await expect(root.locator('.row-wb-reading')).toContainText('Inspect u, v and w.');
  await expect(root.locator('.row-wb-reading math')).toHaveCount(4);
});

test('authored static readings are usable without scripts and expose the same endpoints', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }), page = await context.newPage();
  for (const { model } of rowWorkbenchExamples) {
    await page.setContent(rowWorkbenchReading(model, 'mathml'));
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('math')).toHaveCount(1 + model.steps.length * 3);
    await expect(page.locator('article')).toContainText(model.steps.at(-1)!.after);
  }
  await context.close();
  // Examples must remain declarations; no renderer/player hooks enter their source.
  const source = await readFile('src/experiments/rectangular-product/row-workbench-examples.ts', 'utf8');
  expect(source).not.toMatch(/row-workbench-view|row-workbench\.css|document\.|window\.|prepareFusion/);
});
