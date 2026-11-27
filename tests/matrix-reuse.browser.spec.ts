import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { ChatService } from '../server/chat/service.ts';
import { chatHttp } from '../server/chat/http.ts';
import { ChatPeer, MemoryChatStore } from './fixtures/editor-chat.ts';

const url = (id: string) => `/experiments/fraction-notebook/?notebook=matrix&document=${id}`;
const equations = (page: Page) => page.locator('.fn-editor .fn-matrix-object[data-math-view=equation]');
async function ready(page: Page, id: string) {
  await page.goto(url(id), { waitUntil: 'domcontentloaded' }); await expect(equations(page)).toHaveCount(1);
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
  await expect(page.locator('[data-matrix-studio=ready]')).toHaveCount(1);
}
async function command(page: Page, query: string) {
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true });
  await picker.getByRole('combobox').fill(query);
  await expect(picker.getByRole('option', { selected: true })).toHaveAttribute('aria-disabled', 'false');
  await page.keyboard.press('Enter'); await expect(picker).toBeHidden();
}
async function publish(page: Page) {
  const id = await equations(page).first().getAttribute('data-matrix-resource');
  const published = () => page.evaluate(resource => new Promise<number>((resolve, reject) => {
    const open = indexedDB.open('kp-matrix-publications-v1'); open.onerror = () => reject(open.error);
    open.onsuccess = () => { const db = open.result, tx = db.transaction('workspace', 'readonly');
      const read = tx.objectStore('workspace').get('documents');
      read.onsuccess = () => resolve((read.result as { document: { id: string }; revision: number }[]).find(p => p.document.id === resource)?.revision ?? 0);
      read.onerror = () => reject(read.error); tx.oncomplete = () => db.close(); };
  }), id);
  const revision = await published();
  await equations(page).first().locator('.fn-math-heading').click(); await command(page, 'matrix.publish');
  await expect.poll(published).toBe(revision + 1);
}
async function reuse(page: Page, relationship: string, mode = 'live') {
  await command(page, 'matrix.reuse');
  const dialog = page.getByRole('dialog', { name: 'Reuse a published matrix' });
  await dialog.getByLabel('Reuse relationship').selectOption(relationship);
  await dialog.getByLabel('Source updates').selectOption(mode);
  await dialog.getByRole('button', { name: 'Insert selected source' }).click(); await expect(dialog).toBeHidden();
}
test('matrix reuse picker remains usable in a phone width', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page, randomUUID());
  await publish(page); await command(page, 'matrix.reuse');
  const dialog = page.getByRole('dialog', { name: 'Reuse a published matrix' });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox(); expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await expect(dialog.getByRole('button', { name: 'Insert selected source' })).toBeInViewport();
  await expect(dialog.getByLabel('Reuse relationship')).toBeInViewport();
  await page.screenshot({ path: info.outputPath('matrix-reuse-phone.png') });
  await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
  await expect(equations(page)).toHaveCount(1);
});
test('matrix reuse keeps live transclusion, local derivation and independent copy distinct across notebooks', async ({ page, context }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const ownerId = randomUUID(), targetId = randomUUID(); await ready(page, ownerId);
  const source = equations(page).first(); await source.getByRole('textbox', { name: 'A11', exact: true }).fill('2');
  await publish(page);
  const other = await context.newPage(); other.on('pageerror', e => errors.push(e.message)); await ready(other, targetId);
  await reuse(other, 'transclude'); await reuse(other, 'derive'); await reuse(other, 'copy');
  await expect(equations(other)).toHaveCount(4);
  const transcluded = equations(other).nth(1), derived = equations(other).nth(2), copy = equations(other).nth(3);
  await expect(transcluded.getByLabel('A11', { exact: true })).toHaveAttribute('readonly', '');
  await expect(derived.getByLabel('A11', { exact: true })).toHaveAttribute('readonly', '');
  await derived.getByLabel('v2', { exact: true }).fill('7');
  await source.getByLabel('A11', { exact: true }).fill('4'); await source.getByLabel('v1', { exact: true }).fill('-2'); await publish(page);
  await expect(transcluded.getByLabel('A11', { exact: true })).toHaveValue('4');
  await expect(transcluded.getByLabel('v1', { exact: true })).toHaveValue('-2');
  await expect(derived.getByLabel('A11', { exact: true })).toHaveValue('4');
  await expect(derived.getByLabel('v2', { exact: true })).toHaveValue('7');
  await expect(copy.getByLabel('A11', { exact: true })).toHaveValue('2');
  await transcluded.getByRole('button', { name: 'Explain', exact: true }).click();
  await expect(other.locator('.fn-editor .comb-stage')).toHaveCount(1);
  await other.screenshot({ path: info.outputPath('matrix-reuse-linked.png') });
  await other.reload({ waitUntil: 'domcontentloaded' }); await expect(equations(other)).toHaveCount(4);
  await expect(equations(other).nth(2).getByLabel('v2', { exact: true })).toHaveValue('7');
  await expect(equations(other).nth(1).getByLabel('A11', { exact: true })).toHaveValue('4');
  const returned = await equations(other).nth(1).getAttribute('data-cell-id');
  await equations(other).nth(1).locator('.fn-math-heading').click(); await command(other, 'matrix.open-source');
  await expect(other).toHaveURL(new RegExp(ownerId));
  await expect(other.locator('.fn-editor .ProseMirror-selectednode')).toHaveAttribute('data-matrix-resource', (await source.getAttribute('data-matrix-resource'))!);
  await command(other, 'matrix.return-to-notebook'); await expect(other).toHaveURL(new RegExp(targetId));
  await expect(other.locator('.fn-editor .ProseMirror-selectednode')).toHaveAttribute('data-cell-id', returned!);
  expect(errors).toEqual([]);
});
test('matrix reuse pins updates, preserves undo and retains withdrawn snapshots', async ({ page, context }) => {
  const owner = randomUUID(), target = randomUUID(); await ready(page, owner); await publish(page);
  const other = await context.newPage(); await ready(other, target); await reuse(other, 'transclude', 'pinned');
  const imported = equations(other).nth(1), original = await imported.getByLabel('A11', { exact: true }).inputValue();
  await equations(page).first().getByLabel('A11', { exact: true }).fill('8'); await publish(page);
  await expect(imported.getByLabel('A11', { exact: true })).toHaveValue(original);
  await imported.locator('.fn-math-heading').click(); await command(other, 'matrix.refresh-sources');
  await expect(imported.getByLabel('A11', { exact: true })).toHaveValue('8');
  await imported.getByLabel('A11', { exact: true }).press('ControlOrMeta+z');
  await expect(imported.getByLabel('A11', { exact: true })).toHaveValue(original);
  await expect(other.locator('.fn-status')).toContainText('mathematical views up to date');
  await equations(page).first().locator('.fn-math-heading').click(); await command(page, 'matrix.withdraw');
  // Picker dismissal does not await the publication commit. A refresh before
  // the tombstone exists correctly sees the previous, still-live revision.
  const resource = await equations(page).first().getAttribute('data-matrix-resource');
  await expect.poll(() => page.evaluate(id => new Promise<boolean>((resolve, reject) => {
    const open = indexedDB.open('kp-matrix-publications-v1'); open.onerror = () => reject(open.error);
    open.onsuccess = () => { const db = open.result, tx = db.transaction('workspace', 'readonly');
      const read = tx.objectStore('workspace').get('documents');
      read.onsuccess = () => resolve((read.result as { document: { id: string }; withdrawn: boolean }[]).find(p => p.document.id === id)?.withdrawn ?? false);
      read.onerror = () => reject(read.error); tx.oncomplete = () => db.close(); };
  }), resource)).toBe(true);
  await imported.locator('.fn-math-heading').click(); await command(other, 'matrix.refresh-sources');
  await expect(other.locator('.fn-status')).toContainText('unavailable');
  await expect(imported.getByLabel('A11', { exact: true })).toHaveValue(original);
  await other.reload({ waitUntil: 'domcontentloaded' }); await expect(equations(other).nth(1).getByLabel('A11', { exact: true })).toHaveValue(original);
});
test('matrix reuse integrates a source-pinned chat note, explicit acceptance, undo and publication', async ({ page, context, browser }, info) => {
  const peer = new ChatPeer(), store = new MemoryChatStore();
  const service = new ChatService(store, peer.factory, process.cwd());
  const server = createServer((req, res) => { void chatHttp(service)(req, res); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing fixture address');
  const backend = `http://127.0.0.1:${address.port}`;
  await context.route('**/api/dev/chat', async route => {
    const response = await route.fetch({ url: backend, headers: { ...route.request().headers(), host: `127.0.0.1:${address.port}`, origin: backend } });
    await route.fulfill({ response });
  });
  await context.addInitScript(() => sessionStorage.setItem('kp.workspace.header', 'true'));
  try {
    await ready(page, randomUUID());
    const source = equations(page).first();
    for (const [label, value] of [['A11', '2'], ['A12', '-1'], ['A21', '1'], ['A22', '2'], ['v1', '1'], ['v2', '2']])
      await source.getByLabel(label!, { exact: true }).fill(value!);
    await source.getByRole('button', { name: 'Explain', exact: true }).click();
    await expect(page.locator('.fn-editor .comb-stage')).toHaveCount(1);
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.getByRole('textbox', { name: 'Conversation transcript' }).focus(); await page.keyboard.press('Control+c');
    await page.getByRole('dialog', { name: 'Chat commands' }).getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready'); await page.keyboard.press('Escape');
    await source.locator('.fn-math-heading').click(); await command(page, 'matrix.revise-note');
    const panel = page.getByRole('complementary', { name: 'Revise matrix explanation' });
    await panel.getByLabel('Requested matrix note change').fill('Explain why the result points vertically.');
    await panel.getByRole('button', { name: 'Prepare request in chat' }).click();
    const composer = page.locator('.kp-rich-composer .ProseMirror'); await expect(composer).toContainText('Response shape');
    const prompt = await composer.innerText();
    const shape = JSON.parse(prompt.split('Response shape (replace title/content as needed):')[1]!.trim());
    expect(peer.sends()).toHaveLength(0);
    await composer.press('ControlOrMeta+Enter'); await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'running');
    const content = 'Why does the result point straight up? The horizontal contributions cancel while the vertical contributions add to five.';
    peer.finish(JSON.stringify({ ...shape, title: 'Why vertical?', content }));
    await expect(page.locator('.kp-chat')).toHaveAttribute('data-phase', 'ready');
    await expect(panel.getByLabel('Completed model response').locator('option')).toHaveCount(2);
    await panel.getByLabel('Completed model response').selectOption({ index: 1 });
    await panel.getByRole('button', { name: 'Preview proposal' }).click();
    await expect(panel.getByRole('button', { name: 'Accept note' })).toBeEnabled();
    await expect(page.frameLocator('iframe.fn-preview').locator('.fn-matrix-note').first()).toContainText(content);
    await panel.getByRole('button', { name: 'Accept note' }).click();
    await expect(source.locator('.fn-matrix-note')).toContainText(content);
    await source.getByLabel('A11', { exact: true }).press('ControlOrMeta+z'); await expect(source.locator('.fn-matrix-note')).toBeHidden();
    await source.getByLabel('A11', { exact: true }).press('ControlOrMeta+Shift+z'); await expect(source.locator('.fn-matrix-note')).toContainText(content);
    await publish(page);
    const other = await context.newPage(); await ready(other, randomUUID()); await reuse(other, 'transclude');
    await expect(equations(other).nth(1).locator('.fn-matrix-note')).toContainText(content);
    await other.reload({ waitUntil: 'domcontentloaded' }); await expect(equations(other).nth(1).locator('.fn-matrix-note')).toContainText(content);
    await page.screenshot({ path: info.outputPath('matrix-note-accepted.png') });
    await source.locator('.fn-math-heading').click();
    const downloading = page.waitForEvent('download'); await command(page, 'notebook.export-json');
    const download = await downloading; await download.saveAs(info.outputPath('matrix-note-notebook.json'));
    const bytes = await readFile(info.outputPath('matrix-note-notebook.json'));
    const exported = JSON.parse(bytes.toString());
    const restoredContext = await browser.newContext();
    try {
      const restored = await restoredContext.newPage(); await ready(restored, randomUUID());
      const selecting = restored.waitForEvent('filechooser'); await command(restored, 'notebook.import-matrix');
      await (await selecting).setFiles({ name: 'notebook.json', mimeType: 'application/json', buffer: bytes });
      await expect(restored).toHaveURL(new RegExp(exported.id));
      await expect(equations(restored).first().locator('.fn-matrix-note')).toContainText(content);
      await expect(equations(restored).first().getByLabel('A11', { exact: true })).toHaveValue('2');
      // Import never silently replaces a later saved revision of this identity.
      await equations(restored).first().getByLabel('A11', { exact: true }).fill('6');
      await expect(restored.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
      const conflicting = restored.waitForEvent('filechooser'); await command(restored, 'notebook.import-matrix');
      await (await conflicting).setFiles({ name: 'notebook.json', mimeType: 'application/json', buffer: bytes });
      await expect(restored.locator('.fn-status')).toContainText('different saved content');
      await expect(equations(restored).first().getByLabel('A11', { exact: true })).toHaveValue('6');
    } finally { await restoredContext.close(); }
  } finally {
    await context.unrouteAll({ behavior: 'wait' }); await service.close();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
