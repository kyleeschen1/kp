import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { importFractionReading } from '../src/fraction-notebook/model.ts';
import { buildLocalReader } from '../scripts/local-reader-build.ts';
import { gzipSync } from 'node:zlib';
const canonical = readFileSync(new URL('../content/authoring/algebra/fractional-linear-reasoning.article.md', import.meta.url), 'utf8');
const seed = importFractionReading(canonical).notebook;
const url = '/experiments/fraction-notebook/';
const preview = (page: Page) => page.frameLocator('iframe');
async function ready(page: Page) {
  await page.goto(url);
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  await expect(preview(page).locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
}
async function jump(page: Page, id: string) {
  const frame = preview(page);
  await frame.locator('.kp-rising-navigation > summary').click();
  await frame.locator(`.kp-lesson-toc a[href="#${id}"]`).click();
}
async function replaceSpec(page: Page, source: string) {
  const summary = page.getByText('Edit animation specification', { exact: true });
  if (!(await page.locator('.fn-story details').getAttribute('open') !== null)) await summary.click();
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.insertText(source);
}
test('direct prose, formatting and undo update the native reader without remounting', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  const frame = preview(page);
  const stage = await frame.locator('.kp-reader-equation-stage').elementHandle();
  const first = page.locator('.ProseMirror > p').first();
  await first.click({ clickCount: 3 }); await page.keyboard.insertText('A changed opening makes the relationship clear.');
  await expect(first).toHaveText('A changed opening makes the relationship clear.');
  await expect(frame.locator('.kp-caption-document-intro')).toContainText('A changed opening');
  await first.click({ clickCount: 3 });
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(frame.locator('.kp-caption-document-intro strong')).toContainText('A changed opening');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(frame.locator('.kp-caption-document-intro strong')).toHaveCount(0);
  expect(await stage!.evaluate(node => node.isConnected)).toBe(true);
  await page.getByRole('button', { name: 'Show details', exact: true }).click();
  await expect(page.locator('.fn-cell-details')).toBeVisible();
  await page.getByRole('button', { name: 'Hide details', exact: true }).click();
  await expect(page.locator('.fn-cell-details')).toBeHidden();
  await page.getByRole('separator').focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('separator')).toHaveAttribute('aria-valuenow', '52');
  await page.reload(); await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await expect(page.locator('.ProseMirror > p').first()).toContainText('A changed opening');
  await page.screenshot({ path: info.outputPath('fraction-editor.png') }); expect(errors).toEqual([]);
});
test('annotation edits keep the native moment; invalid specification remains recoverable', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  await jump(page, 'equation.fractional-linear.right-simplified');
  const plane = preview(page).locator('.kp-caption-pin');
  await expect(plane).toHaveAttribute('data-anchored-state', 'equation.fractional-linear.right-simplified');
  const old = seed.cells.find(c => c.type === 'story'); if (old?.type !== 'story') throw new Error('Missing fixture');
  const source = old.source.replace('Four is half of x. Predict the whole before revealing the next move.', 'Four is one half. What is the whole?');
  await replaceSpec(page, source);
  await expect(plane.locator('.anchored-labels')).toContainText('Four is one half.');
  await expect(plane).toHaveAttribute('data-anchored-state', 'equation.fractional-linear.right-simplified');
  await page.screenshot({ path: info.outputPath('fraction-specification.png') });
  await replaceSpec(page, source.replace('equation.fractional-linear.right-simplified.rhs.4', 'missing.target'));
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'invalid');
  await expect(plane.locator('.anchored-labels')).toContainText('Four is one half.');
  await page.reload(); await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'invalid');
  await jump(page, 'equation.fractional-linear.right-simplified');
  await expect(preview(page).locator('.anchored-labels')).toContainText('Four is one half.');
  await page.getByText('Edit animation specification', { exact: true }).click();
  await expect(page.locator('.cm-content')).toContainText('missing.target');
  await replaceSpec(page, source); await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await page.getByRole('button', { name: 'Show selected passage' }).click();
  await expect(preview(page).locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', 'equation.fractional-linear.initial');
  expect(errors).toEqual([]);
});
test('phone stacks usable panes; ordinary fractional readers exclude authoring modules', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('fraction-editor-phone.png') });
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  await page.goto('/reader/solve-fractional-linear/?reading=reasoning');
  await expect(page.locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
  expect(requests.filter(url => /fraction-notebook|prosemirror|codemirror/i.test(url))).toEqual([]);
  await expect(page.locator('.kp-lesson')).toContainText('The tempting wrong move');
});
test('preview boundary rejects foreign requests and changed mathematical authority', async ({ request }) => {
  const denied = await request.post('/api/dev/fraction-notebook', { data: seed }); expect(denied.status()).toBe(403);
  const foreign = await request.post('/api/dev/fraction-notebook', { headers: { origin: 'https://127.0.0.1:8000' }, data: seed }); expect(foreign.status()).toBe(403);
  const invalid = await request.post('/api/dev/fraction-notebook', { headers: { origin: 'http://127.0.0.1:8000' }, data: { ...seed, execute: 'code' } }); expect(invalid.status()).toBe(422);
});
test('new paragraphs get new UUIDs and concurrent tabs preserve the losing draft', async ({ page, context }) => {
  await ready(page);
  const first = page.locator('.ProseMirror > p').first(), originalId = await first.getAttribute('data-cell-id');
  await first.click({ clickCount: 3 }); await page.keyboard.insertText('First paragraph.'); await page.keyboard.press('Enter'); await page.keyboard.insertText('New paragraph.');
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  expect(await page.locator('.ProseMirror > p').first().getAttribute('data-cell-id')).toBe(originalId);
  const ids = await page.locator('.ProseMirror > [data-cell-id]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-cell-id')));
  expect(new Set(ids).size).toBe(ids.length); expect(ids.length).toBe(seed.cells.length + 1);
  const other = await context.newPage(); await ready(other);
  await other.locator('.ProseMirror > p').first().click({ clickCount: 3 }); await other.keyboard.insertText('Saved by another tab.');
  await expect(other.locator('.fn-status')).toContainText('preview up to date');
  await first.click({ clickCount: 3 }); await page.keyboard.insertText('Keep my separate draft.');
  await expect(page.locator('.fn-status')).toContainText('Another tab changed');
  await page.reload(); await expect(page.locator('.ProseMirror > p').first()).toHaveText('Keep my separate draft.');
  await expect(page.locator('.fn-status')).toContainText('Recovered a separate unsaved draft');
  await other.reload(); await expect(other.locator('.ProseMirror > p').first()).toHaveText('Saved by another tab.');
});
test('production reader erases the experiment and editor dependencies', async () => {
  const built = await buildLocalReader('src/reader/app/exemplar-entry.ts');
  const modules = built.chunks.flatMap(chunk => chunk.modules);
  expect(modules.filter(path => /fraction-notebook|prosemirror|codemirror/.test(path))).toEqual([]);
  const script = Buffer.concat([...built.files].filter(([name]) => name.endsWith('.js')).map(([, bytes]) => bytes));
  console.log(`Canonical reader closure: ${script.length} JS bytes, ${gzipSync(script).length} gzip, ${modules.length} modules; no notebook editor.`);
});
