import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import seed from '../content/notebooks/matrix-object-exemplar.json' with { type: 'json' };
import negative from '../content/math-resources/reference-negative.json' with { type: 'json' };
import zero from '../content/math-resources/reference-zero.json' with { type: 'json' };

const url = '/experiments/matrix-reference/';
const position = (page: Page) => page.getByRole('slider', { name: 'Animation position' });
test('linked geometry follows the equation clock, saved position and shared theme', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(`${url}?geometry=1`);
  await expect(page.locator('.reference-stage')).toHaveAttribute('aria-busy', 'false');
  const graph = page.locator('.reference-geometry');
  await expect(graph).toHaveCount(1);
  for (const step of ['4', '5', '2', '6']) {
    await page.getByLabel('Milestone', { exact: true }).selectOption(step);
    await expect(graph).toHaveAttribute('data-progress', String(Number(step) / 6));
    expect(await graph.getAttribute('data-milestone')).toBe(await page.locator('.kp-column-explanation').getAttribute('data-milestone'));
  }
  await expect(graph.locator('[data-result-label]')).toHaveText('Sum: (3, 2)');
  const before = await graph.locator('g[data-role=contribution]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-end')));
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-kp-theme', 'dark');
  const graphics = await page.evaluate(async () => {
    const modulePath = '/src/rendering/theme-colors.ts';
    const { readThemeColors } = await import(modulePath);
    const host = document.createElement('div'); document.body.append(host);
    host.style.setProperty('--custom-color', 'hsl(120 100% 25%)');
    const count = host.childNodes.length;
    const colors = readThemeColors(host, { paper: '--color-paper', custom: '--custom-color' });
    host.style.setProperty('--custom-color', 'rgb(20 30 40 / .5)');
    let gap: string | undefined;
    try { readThemeColors(host, { custom: '--custom-color' }); } catch (error) { gap = (error as { code: string }).code; }
    const cleaned = host.childNodes.length === count; host.remove();
    return { colors, gap, cleaned };
  });
  expect(graphics.colors.paper).toEqual([18 / 255, 24 / 255, 38 / 255]);
  expect(graphics.colors.custom).toEqual([0, 128 / 255, 0]);
  expect(graphics.gap).toBe('translucent-color'); expect(graphics.cleaned).toBe(true);
  const palette = await page.evaluate(() => {
    const graph = document.querySelector('.reference-geometry .graph-svg__background')!;
    return [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(graph).fill];
  });
  expect(await page.locator('.matrix-card').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(palette[2]);
  expect(await graph.locator('g[data-role=contribution]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-end')))).toEqual(before);
  await page.getByRole('button', { name: 'Find a card', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Saved cards' });
  await expect(picker).toBeVisible();
  expect(await picker.evaluate(node => getComputedStyle(node).backgroundColor)).toBe(palette[1]);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Light theme', exact: true }).click();
  await page.screenshot({ path: info.outputPath('matrix-linked-light.png') });
  await page.reload(); await expect(graph).toHaveAttribute('data-progress', '1');
  await page.getByRole('button', { name: 'Previous milestone', exact: true }).click();
  await expect(graph).toHaveAttribute('data-progress', String(5 / 6));
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', String(5 / 6));
  await upload(page, zero, 'zero-geometry.json');
  await expect(graph).toHaveCount(1); await expect(page.locator('[data-filename]')).toHaveText('zero-geometry.json');
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(graph).toHaveAttribute('data-progress', '1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('matrix-linked-narrow.png'), fullPage: true });
  expect(errors).toEqual([]);
});
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
  await page.getByRole('button', { name: 'Update this card', exact: true }).click();
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
    if ('schemaVersion' in source && source.schemaVersion === 1) await page.getByRole('button', { name: 'Update this card', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('previous saved card is unchanged');
    expect(await initial!.evaluate(node => node.isConnected)).toBe(true);
    await expect(position(page)).toHaveValue('1');
  }
  await page.getByLabel('Open matrix snapshot', { exact: true }).setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByRole('status')).toContainText('previous saved card is unchanged');
  await page.reload(); await expect(position(page)).toHaveValue('1');
  const signed = { ...seed.matrixResources[0], vector: { ...seed.matrixResources[0]!.vector, entries: [0, -2], draft: { x: '0', y: '-2' } } };
  await upload(page, signed, 'signed-zero.json');
  await page.getByRole('button', { name: 'Update this card', exact: true }).click();
  await expect(page.locator('[data-filename]')).toHaveText('signed-zero.json');
  await expect(position(page)).toHaveValue('1'); await expect(page.locator('.comb-stage')).toHaveCount(1);
  await expect(page.locator('[data-kp-comb-key="c-0-0"]')).toHaveText('−2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await page.screenshot({ path: info.outputPath('matrix-reference-narrow.png') });
  await upload(page, seed.matrixResources[0], 'replacement.json');
  await page.getByRole('button', { name: 'Update this card', exact: true }).click();
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
  await page.getByRole('button', { name: 'Update this card', exact: true }).click();
  await expect(page.locator('[data-filename]')).toHaveText('latest.json');
  await page.evaluate(() => window.dispatchEvent(new Event('release-file-read')));
  const second = await context.newPage(); await open(second);
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '1');
  await upload(second, seed.matrixResources[0], 'conflict.json');
  await second.getByRole('button', { name: 'Update this card', exact: true }).click();
  await expect(second.getByRole('status')).toContainText('another tab');
  await expect(second.locator('[data-filename]')).toHaveText('latest.json');
  await second.reload(); await expect(position(second)).toHaveValue('1');
  await expect(second.locator('[data-filename]')).toHaveText('latest.json');
});

async function choose(page: Page, name: string) {
  await page.getByRole('button', { name: 'Find a card', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Saved cards', exact: true });
  await dialog.getByRole('combobox').fill(name);
  await expect(dialog.getByRole('option')).toHaveCount(1);
  await dialog.getByRole('combobox').press('Enter'); await expect(dialog).toBeHidden();
  await expect(page.getByLabel('Card name', { exact: true })).toHaveValue(name);
}
async function rename(page: Page, name: string) {
  await page.getByLabel('Card name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Save name', exact: true }).click();
  await expect(page.locator('.shelf-current')).toHaveText(`Viewing ${name}`);
}
test('three named snapshots filter, retain independent positions and preserve one active player', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 1050 }); await open(page); await rename(page, 'Shear');
  const originalId = await page.locator('.reference-stage').getAttribute('data-card-id');
  await page.getByLabel('Milestone', { exact: true }).selectOption('2');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', String(2 / 6));
  await page.getByText('Source snapshot', { exact: true }).click();
  const requested = page.waitForEvent('download'); await page.getByRole('link', { name: 'Negative contribution', exact: true }).click();
  const downloaded = await requested, bytes = await readFile((await downloaded.path())!);
  expect(JSON.parse(bytes.toString())).toEqual(negative);
  await page.getByLabel('Open matrix snapshot', { exact: true }).setInputFiles({ name: 'Negative.json', mimeType: 'application/json', buffer: bytes });
  await expect(page.locator('[data-filename]')).toHaveText('Negative.json');
  await page.getByText('Source snapshot', { exact: true }).click();
  await rename(page, 'Negative'); await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '1');
  await upload(page, zero, 'Zero.json'); await expect(page.locator('[data-count]')).toHaveText('3 saved');
  await page.getByLabel('Milestone', { exact: true }).selectOption('3');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '0.5');
  await choose(page, 'Shear'); await expect(position(page)).toHaveValue('0.3333');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-card-id', originalId!);
  await choose(page, 'Negative'); await expect(position(page)).toHaveValue('1');
  await choose(page, 'Zero'); await expect(position(page)).toHaveValue('0.5');
  await page.reload(); await expect(page.getByLabel('Card name', { exact: true })).toHaveValue('Zero');
  await expect(position(page)).toHaveValue('0.5'); await expect(page.locator('.comb-stage')).toHaveCount(1);
  // A playback save must not eat an unfinished rename draft.
  await page.getByLabel('Card name', { exact: true }).fill('Unsubmitted');
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '1');
  await expect(page.getByLabel('Card name', { exact: true })).toHaveValue('Unsubmitted');
  await page.getByLabel('Card name', { exact: true }).fill('Zero');
  await page.getByRole('button', { name: 'Find a card', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Saved cards', exact: true });
  await expect(picker.getByRole('option')).toHaveCount(3);
  await picker.getByRole('combobox').fill('no such card'); await expect(picker.getByRole('option')).toHaveCount(0);
  await picker.getByRole('combobox').fill(''); await page.screenshot({ path: info.outputPath('reference-shelf-picker.png') });
  await picker.getByRole('combobox').press('Escape'); await expect(picker).toBeHidden();
  await expect(page.getByRole('button', { name: 'Find a card', exact: true })).toBeFocused();
  await page.screenshot({ path: info.outputPath('reference-shelf.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await choose(page, 'Shear'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('reference-shelf-narrow.png') }); expect(errors).toEqual([]);
});
test('same-source decisions preserve siblings and cancellation leaves the selected card', async ({ page }) => {
  await open(page); await rename(page, 'Original');
  const original = await page.locator('.reference-stage').getAttribute('data-card-id');
  await page.getByLabel('Milestone', { exact: true }).selectOption('3');
  await upload(page, seed.matrixResources[0], 'Copy.json');
  const decision = page.getByRole('dialog', { name: 'Existing source' });
  await expect(decision).toBeVisible(); await expect(page.locator('[data-count]')).toHaveText('1 saved');
  await decision.getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(decision).toBeHidden();
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-card-id', original!);
  await upload(page, seed.matrixResources[0], 'Copy.json');
  await decision.getByRole('button', { name: 'Save as separate card', exact: true }).click();
  await expect(page.locator('[data-count]')).toHaveText('2 saved'); await rename(page, 'Variation');
  const copy = await page.locator('.reference-stage').getAttribute('data-card-id'); expect(copy).not.toBe(original);
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  const updated = structuredClone(seed.matrixResources[0]!); updated.matrix.entries[0]![0] = 3; updated.matrix.draft.a00 = '3';
  await upload(page, updated, 'Update.json'); await decision.getByLabel('Card to update').selectOption(original!);
  await decision.getByRole('button', { name: 'Update this card', exact: true }).click();
  await expect(page.getByLabel('Card name', { exact: true })).toHaveValue('Original'); await expect(position(page)).toHaveValue('0.5');
  await expect(page.locator('[data-kp-comb-key="c-0-0"]')).toHaveText('5');
  await choose(page, 'Variation'); await expect(position(page)).toHaveValue('1');
  await expect(page.locator('[data-kp-comb-key="c-0-0"]')).toHaveText('3');
  await page.reload(); await expect(page.getByLabel('Card name', { exact: true })).toHaveValue('Variation');
  await expect(page.locator('[data-count]')).toHaveText('2 saved');
});
test('legacy migration keeps original data untouched and concurrent opens share one card identity', async ({ page, context }) => {
  await open(page);
  const saved = { schemaVersion: 1, revision: 7, source: seed.matrixResources[0], view: { filename: 'Legacy.json', progress: .5 } };
  await page.evaluate(async original => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('kp-matrix-reference-v1'); request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('workspace', 'readwrite');
        tx.objectStore('workspace').put(original, 'documents'); tx.objectStore('workspace').delete('shelf-v1');
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
      };
    });
  }, saved);
  const other = await context.newPage(); await Promise.all([open(page), open(other)]);
  await expect(position(page)).toHaveValue('0.5'); await expect(position(other)).toHaveValue('0.5');
  const id = await page.locator('.reference-stage').getAttribute('data-card-id');
  await expect(other.locator('.reference-stage')).toHaveAttribute('data-card-id', id!);
  await rename(page, 'Migrated');
  const retained = await page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open('kp-matrix-reference-v1'); request.onerror = () => reject(request.error);
    request.onsuccess = () => { const db = request.result, get = db.transaction('workspace').objectStore('workspace').get('documents');
      get.onsuccess = () => { db.close(); resolve(get.result); }; get.onerror = () => { db.close(); reject(get.error); }; };
  }));
  expect(retained).toEqual(saved); await page.reload(); await expect(page.getByLabel('Card name', { exact: true })).toHaveValue('Migrated');
  await expect(page.locator('[data-count]')).toHaveText('1 saved');
});
