import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import seed from '../content/notebooks/matrix-object-exemplar.json' with { type: 'json' };

const url = '/experiments/matrix-reference/';
const position = (page: Page) => page.getByRole('slider', { name: 'Animation position' });
async function open(page: Page) {
  await page.goto(url); await expect(page.locator('.reference-stage')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.comb-stage')).toHaveCount(1);
}
async function upload(page: Page, source: unknown, name = 'matrix.json') {
  await page.getByLabel('Open matrix snapshot', { exact: true }).setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(source)) });
}
test('notebook export opens independently with exact source identity and persistent reversible playback', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/experiments/fraction-notebook/?notebook=matrix');
  const source = page.locator('.fn-matrix-object[data-math-view=equation]').first();
  await source.getByRole('textbox', { name: 'A11', exact: true }).fill('3');
  await source.locator('.fn-math-heading').click();
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true });
  await picker.locator('.ProseMirror').fill('matrix.export-resource');
  const downloaded = page.waitForEvent('download'); await page.keyboard.press('Enter');
  const download = await downloaded, bytes = await readFile((await download.path())!);
  const exported = JSON.parse(bytes.toString());
  expect(exported.id).toBe(seed.matrixResources[0]!.id);
  expect(exported.matrix.entries[0][0]).toBe(3);
  expect(exported.result).toEqual(seed.matrixResources[0]!.result);
  const imports: string[] = []; page.on('request', request => imports.push(request.url()));
  await open(page);
  await page.getByLabel('Open matrix snapshot', { exact: true }).setInputFiles({ name: download.suggestedFilename(), mimeType: 'application/json', buffer: bytes });
  await expect(page.locator('[data-filename]')).toHaveText(download.suggestedFilename());
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-source-id', exported.id);
  await expect(page.locator('[data-kp-comb-key="c-0-0"]')).toHaveText('5');
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '1');
  await page.getByRole('button', { name: 'Previous milestone', exact: true }).click();
  await expect(position(page)).toHaveValue('0.8333');
  await page.getByRole('button', { name: 'Next milestone', exact: true }).click();
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '1');
  await page.getByLabel('Milestone', { exact: true }).selectOption('2');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', String(2 / 6));
  await page.reload(); await expect(position(page)).toHaveValue('0.3333');
  await expect(page.locator('[data-kp-comb-key="c-0-0"]')).toHaveText('5');
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await page.screenshot({ path: info.outputPath('matrix-reference.png') });
  expect(imports.filter(path => /prosemirror|src\/(fraction-notebook|editor-chat)|graph-3d/.test(path))).toEqual([]);
  expect(errors).toEqual([]);
});
test('invalid paint, malformed files and repeated replacement preserve a valid card in a narrow host', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page);
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '1');
  const initial = await page.locator('.comb-stage').elementHandle();
  for (const source of [{}, { ...seed.matrixResources[0], schemaVersion: 99 },
    { ...seed.matrixResources[0], matrix: { ...seed.matrixResources[0]!.matrix, entries: [[0.00000001, 1], [0, 1]], draft: { a00: '0.00000001', a01: '1', a10: '0', a11: '1' } } }]) {
    await upload(page, source);
    await expect(page.getByRole('status')).toContainText('previous saved card is unchanged');
    expect(await initial!.evaluate(node => node.isConnected)).toBe(true);
    await expect(position(page)).toHaveValue('1');
  }
  await page.getByLabel('Open matrix snapshot', { exact: true }).setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByRole('status')).toContainText('previous saved card is unchanged');
  await page.reload(); await expect(position(page)).toHaveValue('1');
  const signed = { ...seed.matrixResources[0], vector: { ...seed.matrixResources[0]!.vector, entries: [0, -2], draft: { x: '0', y: '-2' } } };
  await upload(page, signed, 'signed-zero.json');
  await expect(page.locator('[data-filename]')).toHaveText('signed-zero.json');
  await expect(position(page)).toHaveValue('0'); await expect(page.locator('.comb-stage')).toHaveCount(1);
  await expect(page.locator('[data-kp-comb-key="c-0-0"]')).toHaveText('−2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await page.screenshot({ path: info.outputPath('matrix-reference-narrow.png') });
  await upload(page, seed.matrixResources[0], 'replacement.json');
  await expect(page.locator('[data-filename]')).toHaveText('replacement.json');
  await expect(page.locator('.comb-stage')).toHaveCount(1);
});
test('late file reads and another tab cannot silently replace the chosen card', async ({ page, context }) => {
  await page.addInitScript(() => {
    const original = File.prototype.text;
    File.prototype.text = async function () {
      if (this.name === 'slow.json') await new Promise<void>(resolve => window.addEventListener('release-file-read', () => resolve(), { once: true }));
      return original.call(this);
    };
  });
  await open(page); await upload(page, seed.matrixResources[0], 'slow.json');
  await upload(page, seed.matrixResources[0], 'latest.json');
  await expect(page.locator('[data-filename]')).toHaveText('latest.json');
  await page.evaluate(() => window.dispatchEvent(new Event('release-file-read')));
  const second = await context.newPage(); await open(second);
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '1');
  await upload(second, seed.matrixResources[0], 'conflict.json');
  await expect(second.getByRole('status')).toContainText('another tab');
  await expect(second.locator('[data-filename]')).toHaveText('latest.json');
  await second.reload(); await expect(position(second)).toHaveValue('1');
  await expect(second.locator('[data-filename]')).toHaveText('latest.json');
});
