import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { importFractionReading } from '../src/fraction-notebook/model.ts';
import { buildLocalReader } from '../scripts/local-reader-build.ts';
import { gzipSync } from 'node:zlib';
import { fractionV1Fixture } from './fraction-notebook-fixture.ts';
import { migrateV1 } from '../src/fraction-notebook/migration.ts';
const canonical = readFileSync(new URL('../content/authoring/algebra/fractional-linear-reasoning.article.md', import.meta.url), 'utf8');
const seed = importFractionReading(canonical).notebook;
const url = '/experiments/fraction-notebook/';
const preview = (page: Page) => page.frameLocator('iframe');
test('saved theme and palette reach first paint before delayed notebook or preview modules', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kp.notebook.styles.v1', JSON.stringify({ theme: 'light', values: { '--color-paper': '#f6f1e5', '--fn-background': 'var(--color-paper)' } }));
    const paints: string[] = []; Object.defineProperty(window, 'notebookPaints', { value: paints });
    const sample = () => { if (document.body) paints.push(getComputedStyle(document.documentElement).backgroundColor); requestAnimationFrame(sample); }; requestAnimationFrame(sample);
  });
  for (const [path, module] of [[url, '**/src/fraction-notebook/app.ts*'], ['/reader/fraction-notebook-preview/', '**/src/reader/app/exemplar-entry.ts*']]) {
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route(module!, async route => { await gate; await route.continue(); });
    try {
      await page.goto(path!, { waitUntil: 'commit' });
      await expect(page.locator('html')).toHaveAttribute('data-notebook-theme', 'light');
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(246, 241, 229)');
      if (path === url) await expect(page.locator('.fn-header')).toHaveCount(0);
      else await expect(page.locator('body')).not.toHaveAttribute('data-kp-reader-hydrated', 'true');
      await page.waitForTimeout(150);
      const paints: string[] = await page.evaluate(() => Reflect.get(window, 'notebookPaints'));
      expect(paints.length).toBeGreaterThan(0); expect(new Set(paints)).toEqual(new Set(['rgb(246, 241, 229)']));
    } finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
  }
});
test('corrupt theme storage remains intact and has a valid first-paint fallback', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kp.notebook.styles.v1', '{broken'));
  await page.route('**/src/fraction-notebook/app.ts*', route => route.abort());
  await page.goto(url); await expect(page.locator('html')).toHaveAttribute('data-notebook-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 24, 38)');
  expect(await page.evaluate(() => localStorage.getItem('kp.notebook.styles.v1'))).toBe('{broken');
  await page.unrouteAll(); await page.reload(); await expect(page.locator('.fn-status')).toContainText('preview up to date');
  expect(await page.evaluate(() => localStorage.getItem('kp.notebook.styles.v1'))).toBe('{broken');
});
async function ready(page: Page) {
  await page.goto(url);
  const edit = page.getByRole('button', { name: 'Edit', exact: true });
  if (await edit.getAttribute('aria-pressed') === 'false') await edit.click();
  await page.locator('.ProseMirror').focus(); await page.keyboard.press('i');
  await expect(page.locator('.fn-status')).toContainText('preview up to date', { timeout: 45000 });
  await expect(preview(page).locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
}
async function jump(page: Page, id: string) {
  const frame = preview(page);
  await page.locator('iframe').scrollIntoViewIfNeeded();
  await frame.getByRole('combobox', { name: 'Animation moment' }).selectOption(id);
}
async function menu(page: Page, name: 'writing' | 'structure') {
  const details = page.locator(`.fn-${name}`);
  if (await details.getAttribute('open') === null) await details.locator(':scope > summary').click();
}
async function action(page: Page, name: string, group: 'writing' | 'structure' = 'writing') {
  await menu(page, group); await page.getByRole('button', { name, exact: true }).click();
}
async function blockOption(page: Page, name: string, value: string) {
  await menu(page, 'structure'); await page.getByRole('combobox', { name }).selectOption(value);
  await expect(page.locator('.fn-structure')).not.toHaveAttribute('open');
}
async function replaceSpec(page: Page, source: string, run = true) {
  const summary = page.getByText('Edit animation specification', { exact: true });
  if (!(await page.locator('.fn-story details').getAttribute('open') !== null)) await summary.click();
  await page.locator('.cm-content').click(); await page.keyboard.press('Escape'); await page.keyboard.press('i');
  await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.insertText(source);
  if (run) await page.keyboard.press('Shift+Enter');
}
test('direct prose, formatting and undo update the native reader without remounting', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  const frame = preview(page);
  const stage = await frame.locator('.kp-reader-equation-stage').elementHandle();
  const first = page.locator('.ProseMirror > .fn-block > .fn-block-content > p').first();
  await first.click({ clickCount: 3 }); await page.keyboard.insertText('A changed opening makes the relationship clear.');
  await expect(first).toHaveText('A changed opening makes the relationship clear.');
  await expect(frame.locator('.kp-caption-document-intro')).toContainText('A changed opening');
  await first.click({ clickCount: 3 });
  await action(page, 'Bold');
  await expect(frame.locator('.kp-caption-document-intro strong')).toContainText('A changed opening');
  await action(page, 'Undo');
  await expect(frame.locator('.kp-caption-document-intro strong')).toHaveCount(0);
  expect(await stage!.evaluate(node => node.isConnected)).toBe(true);
  await action(page, 'Show details');
  await expect(page.locator('.fn-cell-details')).toBeVisible();
  await action(page, 'Hide details');
  await expect(page.locator('.fn-cell-details')).toBeHidden();
  // The ordinary 50vw pane uses the vertical source/result layout at 1440px.
  // Exercise the existing horizontal divider at a genuinely wide pane size.
  await page.setViewportSize({ width: 1800, height: 960 });
  await page.getByText('Edit animation specification', { exact: true }).click();
  await expect(page.locator('.fn-source-pane')).toBeVisible();
  await page.getByRole('separator').focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('separator')).toHaveAttribute('aria-valuenow', '52');
  await page.getByRole('button', { name: 'Close buffer', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.reload(); await expect(page.locator('.fn-status')).toContainText('preview up to date'); await page.locator('.ProseMirror').focus(); await page.keyboard.press('i');
  await expect(page.locator('.ProseMirror > .fn-block > .fn-block-content > p').first()).toContainText('A changed opening');
  await page.screenshot({ caret: 'initial', path: info.outputPath('fraction-editor.png') }); expect(errors).toEqual([]);
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
  await page.screenshot({ caret: 'initial', path: info.outputPath('fraction-specification.png') });
  await replaceSpec(page, source.replace('equation.fractional-linear.right-simplified.rhs.4', 'missing.target'));
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'invalid');
  await expect(plane.locator('.anchored-labels')).toContainText('Four is one half.');
  await page.reload(); await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'pending');
  await jump(page, 'equation.fractional-linear.right-simplified');
  await expect(preview(page).locator('.anchored-labels')).toContainText('Four is one half.');
  await page.getByText('Edit animation specification', { exact: true }).click();
  await expect(page.locator('.cm-content')).toContainText('missing.target');
  await replaceSpec(page, source); await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await action(page, 'Show selected passage');
  await expect(preview(page).locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', 'equation.fractional-linear.initial');
  expect(errors).toEqual([]);
});
test('phone stacks usable panes; ordinary fractional readers exclude authoring modules', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ caret: 'initial', path: info.outputPath('fraction-editor-phone.png') });
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
  const first = page.locator('.ProseMirror > .fn-block > .fn-block-content > p').first(), originalId = await first.locator('..').locator('..').getAttribute('data-cell-id');
  await first.click({ clickCount: 3 }); await page.keyboard.insertText('First paragraph.'); await page.keyboard.press('Enter'); await page.keyboard.insertText('New paragraph.');
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  expect(await page.locator('.ProseMirror > .fn-block').first().getAttribute('data-cell-id')).toBe(originalId);
  const ids = await page.locator('.ProseMirror > [data-cell-id]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-cell-id')));
  expect(new Set(ids).size).toBe(ids.length); expect(ids.length).toBe(seed.cells.length + 1);
  const other = await context.newPage(); await ready(other);
  await other.locator('.ProseMirror > .fn-block > .fn-block-content > p').first().click({ clickCount: 3 }); await other.keyboard.insertText('Saved by another tab.');
  await expect(other.locator('.fn-status')).toContainText('preview up to date');
  await first.click({ clickCount: 3 }); await page.keyboard.insertText('Keep my separate draft.');
  await expect(page.locator('.fn-status')).toContainText('Another tab changed');
  await page.reload(); await expect(page.locator('.ProseMirror > .fn-block > .fn-block-content > p').first()).toHaveText('Keep my separate draft.');
  await expect(page.locator('.fn-status')).toContainText('Recovered a separate unsaved draft');
  await other.reload(); await expect(other.locator('.ProseMirror > .fn-block > .fn-block-content > p').first()).toHaveText('Saved by another tab.');
});
test('production reader erases the experiment and editor dependencies', async () => {
  const built = await buildLocalReader('src/reader/app/exemplar-entry.ts');
  const modules = built.chunks.flatMap(chunk => chunk.modules);
  expect(modules.filter(path => /fraction-notebook|prosemirror|codemirror/.test(path))).toEqual([]);
  const script = Buffer.concat([...built.files].filter(([name]) => name.endsWith('.js')).map(([, bytes]) => bytes));
  console.log(`Canonical reader closure: ${script.length} JS bytes, ${gzipSync(script).length} gzip, ${modules.length} modules; no notebook editor.`);
});
test('typed header, author credits, metadata and caption edit the article without duplicating source', async ({ page }) => {
  await ready(page);
  const title = page.locator('.fn-article-header h1');
  await title.click({ clickCount: 3 }); await page.keyboard.insertText('An editable fraction article');
  await expect(preview(page).locator('.kp-caption-document-intro h1')).toHaveText('An editable fraction article');
  await page.locator('.fn-author').first().click({ clickCount: 3 }); await page.keyboard.insertText('Kyle Eschen');
  await expect(preview(page).locator('.kp-document-byline')).toHaveText('By Kyle Eschen');
  await action(page, 'Add author'); await page.keyboard.insertText('A second author');
  await expect(preview(page).locator('.kp-document-byline')).toHaveCount(2);
  await action(page, 'Show details');
  await page.getByRole('combobox', { name: 'Credit role' }).selectOption('editor');
  await page.getByRole('textbox', { name: 'Metadata JSON' }).fill('{"contribution":"revision"}');
  await page.getByRole('button', { name: 'Apply metadata' }).click();
  await expect(preview(page).locator('.kp-document-byline').last()).toHaveText('Edited by A second author');
  await action(page, 'Hide details');
  const paragraph = page.locator('.ProseMirror > .fn-block > .fn-block-content > p').first(); await paragraph.click({ clickCount: 3 });
  await action(page, 'Annotate');
  await page.getByRole('textbox', { name: 'Metadata JSON' }).fill('{"note":"Preserve the reasoning"}');
  await page.getByRole('button', { name: 'Apply metadata' }).click();
  await expect(paragraph.locator('[data-annotation-id]')).toHaveCount(1);
  await action(page, 'Hide details');
  const caption = page.locator('.fn-caption p'); await caption.click({ clickCount: 3 }); await page.keyboard.insertText('Start with the last operation.');
  await action(page, 'Show selected passage');
  await expect(preview(page).locator('.anchored-labels')).toContainText('Start with the last operation.');
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await page.reload(); await expect(page.locator('.fn-status')).toContainText('preview up to date'); await page.locator('.ProseMirror').focus(); await page.keyboard.press('i');
  await expect(page.locator('.fn-caption p')).toHaveText('Start with the last operation.');
  await expect(page.locator('.fn-author').last()).toHaveAttribute('data-kp-meta', '{"contribution":"revision"}');
  await expect(page.locator('[data-annotation-id]')).toHaveAttribute('data-kp-meta', '{"note":"Preserve the reasoning"}');
  await page.locator('.fn-article-header h1').click(); await page.keyboard.press('Home'); await page.keyboard.press('Backspace');
  await expect(page.locator('.fn-article-header h1')).toHaveText('An editable fraction article');
  await page.keyboard.press('End'); await page.keyboard.press('Enter');
  expect(await page.evaluate(() => Boolean(window.getSelection()?.anchorNode?.parentElement?.closest('.fn-author')))).toBe(true);
});
for (const version of [1, 2]) test(`saved v${version} notebooks migrate into v3 without rewriting the original recovery copy`, async ({ page }) => {
  const original = fractionV1Fixture(), old = version === 1 ? original : migrateV1(original);
  await page.route('**/__fraction-storage-fixture', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Storage fixture</body></html>' }));
  await page.goto('/__fraction-storage-fixture');
  await page.evaluate(async ({ old, version }) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(`kp-fraction-notebook-v${version}`, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('workspace');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { const db = request.result, tx = db.transaction('workspace', 'readwrite'); tx.objectStore('workspace').put({ draft: old, lastValid: old }, 'documents'); tx.oncomplete = () => { db.close(); resolve(); }; };
    });
  }, { old, version });
  await ready(page);
  await expect(page.locator('.fn-article-header h1')).toHaveAttribute('data-cell-id', original.cells[0]!.id);
  await page.locator('.fn-author').first().click({ clickCount: 3 }); await page.keyboard.insertText('Migrated author');
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  const stored = await page.evaluate(async version => new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open(`kp-fraction-notebook-v${version}`); request.onerror = () => reject(request.error);
    request.onsuccess = () => { const db = request.result, read = db.transaction('workspace').objectStore('workspace').get('documents'); read.onsuccess = () => { resolve(read.result); db.close(); }; };
  }), version);
  expect(stored).toEqual({ draft: old, lastValid: old });
});
test('links and mathematics reveal source, preserve identity and recover invalid edits', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  const first = page.locator('.ProseMirror > .fn-block > .fn-block-content > p').first(); await first.click({ clickCount: 3 });
  await page.keyboard.insertText('Half is $\\frac{x}{2}$; see [the explanation](/reader/solve-fractional-linear/).');
  await page.locator('.ProseMirror > .fn-block > .fn-block-content > p').nth(1).click();
  const math = page.locator('.fn-inline-object[data-inline-kind=math]'), link = page.locator('.fn-inline-object[data-inline-kind=link]');
  await expect(math.locator('.katex')).toHaveCount(1); await expect(link.locator('.fn-inline-display')).toHaveText('the explanation');
  await expect(preview(page).locator('.kp-caption-document-intro .katex')).toHaveCount(1);
  const mathId = await math.getAttribute('data-cell-id'), linkId = await link.getAttribute('data-cell-id');
  await math.locator('.fn-inline-display').click(); const source = page.getByRole('textbox', { name: 'Math source', exact: true });
  await expect(source).toBeFocused(); await expect(source).toHaveValue('$\\frac{x}{2}$');
  await source.fill('$\\frac{x}{3}$'); await source.press('Enter'); await expect(source).toBeHidden();
  await expect(preview(page).locator('.kp-caption-document-intro annotation')).toHaveText('\\frac{x}{3}');
  await page.keyboard.press('Backspace'); await expect(source).toBeFocused(); await expect(source).toHaveValue('$\\frac{x}{3}$');
  await source.press('ControlOrMeta+z'); await expect(source).toHaveValue('$\\frac{x}{2}$');
  await source.press('ControlOrMeta+Shift+z'); await expect(source).toHaveValue('$\\frac{x}{3}$');
  await source.fill('$\\frac{$'); await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'invalid');
  await expect(source).toHaveAttribute('aria-invalid', 'true');
  await expect(preview(page).locator('.kp-caption-document-intro annotation')).toHaveText('\\frac{x}{3}');
  await page.reload(); await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'invalid');
  await expect(math).toHaveAttribute('data-cell-id', mathId!); await math.locator('.fn-inline-display').click();
  await expect(source).toHaveValue('$\\frac{$'); await source.fill('$\\frac{x}{4}$'); await source.press('Enter');
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await link.locator('.fn-inline-display').click();
  const linkSource = page.getByRole('textbox', { name: 'Link source', exact: true });
  await expect(linkSource).toHaveValue('[the explanation](/reader/solve-fractional-linear/)');
  await action(page, 'Show details');
  await page.getByRole('textbox', { name: 'Metadata JSON' }).fill('{"purpose":"reference"}');
  await page.getByRole('button', { name: 'Apply metadata' }).click(); await action(page, 'Hide details');
  await link.locator('.fn-inline-display').click(); await linkSource.fill('[original reading](/reader/solve-fractional-linear/?reading=reasoning)'); await linkSource.press('Enter');
  await expect(link).toHaveAttribute('data-cell-id', linkId!); await expect(link).toHaveAttribute('data-kp-meta', '{"purpose":"reference"}');
  await expect(preview(page).locator('.kp-caption-document-intro a')).toHaveText('original reading');
  await link.locator('.fn-inline-display').click(); await linkSource.fill('[unsafe](javascript:alert)'); await linkSource.press('Enter');
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'invalid');
  await expect(preview(page).locator('.kp-caption-document-intro a')).toHaveText('original reading');
  await page.keyboard.press('Backspace'); await expect(linkSource).toBeFocused();
  await linkSource.fill('[original reading](/reader/solve-fractional-linear/?reading=reasoning)'); await linkSource.press('Enter');
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await page.screenshot({ caret: 'initial', path: info.outputPath('inline-rendered.png') });
  await math.locator('.fn-inline-display').click(); await page.screenshot({ caret: 'initial', path: info.outputPath('inline-source.png') });
  expect(errors).toEqual([]);
});
test('inline keyboard boundaries, composition and clipboard preserve complete objects', async ({ page }) => {
  await ready(page);
  const first = page.locator('.ProseMirror > .fn-block > .fn-block-content > p').first(); await first.click({ clickCount: 3 });
  await page.keyboard.insertText('Before $x$ after'); await page.locator('.ProseMirror > .fn-block > .fn-block-content > p').nth(1).click();
  const object = page.locator('.fn-inline-object[data-inline-kind=math]');
  await object.locator('.fn-inline-display').click();
  const source = page.getByRole('textbox', { name: 'Math source', exact: true });
  await source.press('Home'); await source.press('ArrowLeft'); await expect(source).toBeHidden();
  await page.keyboard.press('ArrowRight'); await expect(source).toBeFocused();
  expect(await source.evaluate(el => el instanceof HTMLInputElement && el.selectionStart)).toBe(0);
  await source.dispatchEvent('compositionstart'); await source.fill('$y$');
  await expect(object.locator('annotation')).toHaveText('x');
  await source.dispatchEvent('compositionend'); await expect(object.locator('annotation')).toHaveText('y');
  await source.press('End'); await source.press('ArrowRight'); await expect(source).toBeHidden();
  await page.keyboard.press('ArrowLeft'); await expect(source).toBeFocused();
  expect(await source.evaluate(el => el instanceof HTMLInputElement && el.selectionStart)).toBe(3);
  await source.press('Escape'); await first.click({ clickCount: 3 });
  const original = await object.getAttribute('data-cell-id');
  const clipboard = await first.evaluate(el => {
    const data = new DataTransfer(); el.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: data }));
    return { html: data.getData('text/html'), text: data.getData('text/plain') };
  });
  expect(clipboard.html).toContain('data-inline-kind="math"');
  const second = page.locator('.ProseMirror > .fn-block > .fn-block-content > p').nth(1); await second.click({ clickCount: 3 });
  await second.evaluate((el, saved) => {
    const data = new DataTransfer(); data.setData('text/html', saved.html); data.setData('text/plain', saved.text);
    el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
  }, clipboard);
  await expect(object).toHaveCount(2);
  const ids = await object.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-cell-id')));
  expect(ids[0]).toBe(original); expect(ids[1]).not.toBe(original);
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await page.reload(); await expect(page.locator('.fn-status')).toContainText('preview up to date'); await page.locator('.ProseMirror').focus(); await page.keyboard.press('i');
  expect(await object.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-cell-id')))).toEqual(ids);
  const third = page.locator('.ProseMirror > .fn-block > .fn-block-content > p').nth(2); await third.click({ clickCount: 3 });
  await third.evaluate(el => {
    const data = new DataTransfer();
    data.setData('text/html', '<p data-cell-id="invalid"><span data-annotation-id="invalid">Readable pasted text.</span></p>');
    el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
  });
  await expect(third).toHaveText('Readable pasted text.');
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await expect(page.locator('[data-cell-id="invalid"], [data-annotation-id="invalid"]')).toHaveCount(0);
});

test('Edit opens in Normal mode; split, nest, titles and folding preserve the native player', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 960 }); await page.goto(url);
  const edit = page.getByRole('button', { name: 'Edit', exact: true });
  await expect(edit).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fn-left')).toBeVisible();
  await expect(page.locator('.ProseMirror')).toHaveAttribute('data-vim-mode', 'normal');
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  const first = page.locator('.ProseMirror > .fn-block').first(), body = first.locator(':scope > .fn-block-content > p');
  const originalId = await first.getAttribute('data-cell-id');
  await body.click({ clickCount: 3 }); const originalText = await body.textContent();
  await expect(body).toHaveClass(/kp-active-textblock/);
  await expect(page.locator('.fn-editor .ProseMirror')).toHaveAttribute('data-kp-line-visible', 'true');
  await page.keyboard.insertText('Blocked in Normal'); await expect(body).toHaveText(originalText!);
  await body.evaluate(el => {
    const data = new DataTransfer(); data.setData('text/plain', 'Blocked paste');
    el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
  });
  await expect(body).toHaveText(originalText!);
  const geometry = (el: Element) => { const css = getComputedStyle(el); return {
    size: css.fontSize, weight: css.fontWeight, lineHeight: css.lineHeight, indent: css.textIndent, margin: css.marginBottom
  }; };
  expect(await body.evaluate(geometry)).toEqual(await preview(page).locator('.kp-caption-document-intro .fn-block p').first().evaluate(geometry));
  await page.keyboard.press('i'); await page.keyboard.insertText('Part and whole');
  await page.keyboard.press('End'); await page.keyboard.press('Enter'); await page.keyboard.insertText('Inspect this detail.');
  const next = page.locator('.ProseMirror > .fn-block').nth(1), nextId = await next.getAttribute('data-cell-id');
  await page.keyboard.press('Tab');
  const child = first.locator(':scope > .fn-block-content > .fn-block');
  await expect(child).toHaveAttribute('data-cell-id', nextId!);
  await expect(first).toHaveAttribute('data-cell-id', originalId!);
  await page.keyboard.press('Escape');
  await menu(page, 'structure');
  await action(page, 'Add title', 'structure'); await page.keyboard.insertText('A closer look');
  await expect(child.locator('h2')).toHaveText('A closer look');
  await expect(child.locator('h2')).toHaveClass(/kp-active-textblock/);
  await expect(child.locator('h2')).not.toHaveCSS('background-image', 'none');
  await expect(body).not.toHaveClass(/kp-active-textblock/);
  await blockOption(page, 'Block type', 'note');
  await body.click(); await blockOption(page, 'Children display', 'outline');
  await expect(child).toHaveCSS('border-left-width', '1px');
  await expect(child).toHaveCSS('border-left-color', 'rgb(88, 97, 90)');
  await blockOption(page, 'Children display', 'bullets');
  await expect(first).toHaveAttribute('data-layout', 'bullets');
  const player = await preview(page).locator('.kp-reader-equation-stage').elementHandle();
  await expect(preview(page).locator('.fn-block-title')).toHaveText('A closer look');
  await first.getByRole('button', { name: 'Collapse 1 child blocks', exact: true }).click();
  await expect(child).toBeHidden();
  await expect(body).toHaveClass(/kp-active-textblock/);
  await action(page, 'Undo'); await expect(child).toBeVisible();
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  expect(await player!.evaluate(node => node.isConnected)).toBe(true);
  await page.screenshot({ caret: 'initial', path: info.outputPath('nested-structure.png') });
  await edit.click(); await expect(page.locator('.fn-left')).toBeHidden();
  await edit.click(); await expect(page.locator('.ProseMirror')).toHaveAttribute('data-vim-mode', 'normal');
  await page.reload(); await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await expect(child).toHaveAttribute('data-cell-id', nextId!); await expect(child).toHaveAttribute('data-kind', 'note');
  await expect(first).toHaveAttribute('data-layout', 'bullets');
  expect(errors).toEqual([]);
});

test('block moves, outdent and merge preserve IDs and restore through undo', async ({ page }) => {
  await ready(page); await menu(page, 'structure');
  await page.keyboard.press('Escape'); await expect(page.locator('.fn-structure')).not.toHaveAttribute('open');
  const blocks = page.locator('.ProseMirror > .fn-block'), firstId = await blocks.first().getAttribute('data-cell-id');
  const body = blocks.first().locator(':scope > .fn-block-content > p');
  await body.click({ clickCount: 3 }); await page.keyboard.insertText('First');
  await page.keyboard.press('End'); await page.keyboard.press('Enter'); await page.keyboard.insertText('Second');
  const secondId = await blocks.nth(1).getAttribute('data-cell-id');
  await action(page, 'Nest', 'structure');
  await action(page, 'Outdent', 'structure'); await expect(blocks.nth(1)).toHaveAttribute('data-cell-id', secondId!);
  await action(page, 'Move up', 'structure'); await expect(blocks.first()).toHaveAttribute('data-cell-id', secondId!);
  await action(page, 'Undo'); await expect(blocks.first()).toHaveAttribute('data-cell-id', firstId!);
  await body.click(); await action(page, 'Merge next', 'structure');
  await expect(body).toHaveText('First Second'); await expect(blocks.first()).toHaveAttribute('data-cell-id', firstId!);
  await action(page, 'Undo'); await expect(blocks.nth(1)).toHaveAttribute('data-cell-id', secondId!);
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
});

test('one document and focused source preserve the mounted player and current reading', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  const frame = preview(page), edit = page.getByRole('button', { name: 'Edit', exact: true });
  await expect(page.locator('.fn-left > .fn-tools, .fn-left > .fn-structure, .fn-writing-hint, .fn-right > .fn-tools')).toHaveCount(0);
  await expect(frame.locator('.kp-reader-wordmark')).toBeHidden();
  expect(await frame.locator('.kp-reader-masthead').evaluate(el => el.getBoundingClientRect().height)).toBe(0);
  const editorFont = await page.locator('.fn-block-content > p').first().evaluate(el => getComputedStyle(el).fontFamily);
  expect(editorFont).toContain('Source Serif 4');
  expect(await frame.locator('.fn-block-content > p').first().evaluate(el => getComputedStyle(el).fontFamily)).toBe(editorFont);
  expect(await frame.locator('.kp-caption-document-intro h1').evaluate(el => getComputedStyle(el).fontFamily)).toBe(editorFont);
  await jump(page, 'equation.fractional-linear.right-simplified');
  const stage = await frame.locator('.kp-reader-equation-stage').elementHandle();
  const plane = frame.locator('.kp-caption-pin');
  await expect(plane).toHaveAttribute('data-anchored-state', 'equation.fractional-linear.right-simplified');
  await edit.click(); await expect(page.locator('.fn-left')).toBeHidden();
  await edit.click();
  expect((await page.locator('.fn-left').boundingBox())!.width).toBe((await page.locator('.fn-workspace').boundingBox())!.width);
  await edit.click({ force: true }); await edit.click({ force: true });
  await page.getByText('Edit animation specification', { exact: true }).click();
  await expect(page.locator('.fn-source-pane')).toBeVisible();
  const sourceBox = (await page.locator('.fn-source-pane').boundingBox())!, resultBox = (await page.locator('.fn-right').boundingBox())!;
  expect(resultBox.x).toBe(sourceBox.x); expect(resultBox.width).toBe(sourceBox.width);
  expect(resultBox.y).toBeCloseTo(sourceBox.y + sourceBox.height, 0);
  await expect(plane).toHaveAttribute('data-anchored-state', 'equation.fractional-linear.right-simplified');
  expect(await stage!.evaluate(el => el.isConnected)).toBe(true);
  await page.screenshot({ caret: 'initial', path: info.outputPath('focused-source.png') });
  await page.getByRole('button', { name: 'Close buffer', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' }); await edit.click();
  await expect(page.locator('.fn-right')).toHaveCSS('transition-duration', '0s');
  await expect(page.locator('.fn-left')).toBeHidden();
  await page.screenshot({ caret: 'initial', path: info.outputPath('unified-reading.png') });
  expect(errors).toEqual([]);
});

test('theme-variable modal cursors preserve text at graphemes, empty blocks and inline boundaries', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  const prose = page.locator('.ProseMirror'), body = page.locator('.fn-block-content > p').first();
  await body.click({ clickCount: 3 }); await page.keyboard.insertText('A 👩‍🔬 note.');
  await page.keyboard.press('Escape'); await page.keyboard.press('0');
  const blockCursor = prose.locator('.fn-normal-cursor');
  await expect(blockCursor).toHaveText('A'); await expect(blockCursor).toHaveCSS('background-color', 'rgb(240, 112, 112)');
  await expect(prose).toHaveCSS('caret-color', 'rgba(0, 0, 0, 0)');
  await page.keyboard.press('l'); await page.keyboard.press('l'); await expect(blockCursor).toHaveText('👩‍🔬');
  await page.evaluate(() => document.documentElement.style.setProperty('--kp-editor-cursor', '#ff4444'));
  await expect(blockCursor).toHaveCSS('background-color', 'rgb(255, 68, 68)');
  await page.screenshot({ caret: 'initial', path: info.outputPath('normal-cursor.png') });
  await page.keyboard.press('i'); await expect(blockCursor).toHaveCount(0); await expect(prose).toHaveCSS('caret-color', 'rgb(255, 68, 68)');
  await page.keyboard.press('Escape'); await page.keyboard.press('$'); await expect(prose.locator('.fn-empty-cursor')).toBeVisible();
  await expect(body).toHaveText('A 👩‍🔬 note.');
  await page.keyboard.press('o'); await page.keyboard.press('Escape'); await expect(prose.locator('.fn-empty-cursor')).toBeVisible();
  await page.keyboard.press('i'); await page.keyboard.insertText('$x$');
  await body.click(); const math = prose.locator('.fn-inline-object[data-inline-kind=math]');
  await expect(math.locator('.katex')).toBeVisible();
  await math.locator('.fn-inline-display').click();
  await expect(page.getByRole('textbox', { name: 'Math source' })).toHaveCSS('caret-color', 'rgb(255, 68, 68)');
  await page.getByRole('textbox', { name: 'Math source' }).press('Enter');
  await page.keyboard.press('Escape'); await expect(prose.locator('.fn-empty-cursor')).toBeVisible();
  await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await page.getByText('Edit animation specification', { exact: true }).click();
  await page.locator('.cm-content').click();
  await expect(page.locator('.fn-specification details')).toHaveAttribute('open', '');
  await expect(page.locator('.cm-content')).toBeFocused();
  const mode = page.locator('.kp-modeline-mode');
  await expect(mode).toHaveText('[N]');
  await page.keyboard.press('g'); await page.keyboard.press('g');
  await page.screenshot({ caret: 'initial', path: info.outputPath('json-normal-cursor.png') });
  await expect(page.locator('.cm-fat-cursor')).toHaveCSS('background-color', 'rgb(255, 68, 68)');
  await expect(page.locator('.cm-vimCursorLayer')).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('i'); await expect(mode).toHaveText('[I]');
  await expect(page.locator('.cm-cursor').first()).toHaveCSS('border-left-color', 'rgb(255, 68, 68)');
  await page.keyboard.press('Escape'); await expect(mode).toHaveText('[N]');
  expect(errors).toEqual([]);
});

async function ex(page: Page, value: string) {
  await page.keyboard.press('Escape'); await page.keyboard.type(':');
  const input = page.getByRole('textbox', { name: 'Ex command' }); await expect(input).toBeFocused();
  await input.fill(value); await input.press('Enter');
}
test('focused source separates save from run, survives reload, and returns to its document', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  const story = seed.cells.find(cell => cell.type === 'story'); if (story?.type !== 'story') throw new Error('Missing story');
  await jump(page, 'equation.fractional-linear.right-simplified');
  const old = 'Four is half of x. Predict the whole before revealing the next move.';
  const source = story.source.replace(old, 'Inspect this saved draft before running.');
  const stage = await preview(page).locator('.kp-reader-equation-stage').elementHandle();
  await page.getByText('Edit animation specification', { exact: true }).scrollIntoViewIfNeeded();
  const position = await page.locator('.fn-editor').evaluate(el => el.scrollTop);
  await replaceSpec(page, source, false);
  await expect(page.locator('.fn-result-status')).toContainText('have not run');
  await expect(preview(page).locator('.anchored-labels')).toContainText(old);
  await ex(page, 'w'); await expect(page.locator('.fn-status')).toContainText('Saved locally');
  await expect(preview(page).locator('.anchored-labels')).toContainText(old);
  await ex(page, 'run'); await expect(preview(page).locator('.anchored-labels')).toContainText('Inspect this saved draft');
  await expect(preview(page).locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', 'equation.fractional-linear.right-simplified');
  await replaceSpec(page, '{broken', false); await ex(page, 'run');
  await expect(page.locator('.fn-result-status')).toContainText('Previous result');
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'invalid');
  await expect(preview(page).locator('.anchored-labels')).toContainText('Inspect this saved draft');
  await ex(page, 'q'); await expect(page.locator('.fn-source-pane')).toBeHidden();
  expect(await page.locator('.fn-editor').evaluate(el => el.scrollTop)).toBeCloseTo(position, 0);
  expect(await stage!.evaluate(el => el.isConnected)).toBe(true);
  await page.reload(); await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'pending');
  await replaceSpec(page, '{broken', false); await expect(page.locator('.cm-content')).toHaveText('{broken');
  await replaceSpec(page, source); await expect(page.locator('.fn-status')).toContainText('preview up to date');
  await page.screenshot({ caret: 'initial', path: info.outputPath('focused-run.png') });
  expect(errors).toEqual([]);
});
test('help, Ex line numbers and inherited styles work in document and JSON', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  await ex(page, 'h'); await expect(page.getByRole('complementary', { name: 'Keyboard help' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search keybindings' }).fill('run');
  await expect(page.locator('.fn-help')).toContainText('Shift-Enter');
  await page.getByRole('button', { name: 'Close help' }).click();
  await ex(page, 'set nonumber'); await expect(page.locator('.fn-line-gutter span')).toHaveCount(0);
  await ex(page, 'set relativenumber'); await expect(page.locator('.fn-line-gutter span').first()).toBeVisible();
  await jump(page, 'equation.fractional-linear.right-simplified');
  await page.getByRole('button', { name: 'Styles', exact: true }).click();
  await page.getByRole('combobox', { name: 'Body color color', exact: true }).selectOption('var(--color-green-light)');
  await expect(page.locator('.ProseMirror')).toHaveCSS('color', 'rgb(182, 213, 163)');
  await expect(preview(page).locator('body')).toHaveCSS('color', 'rgb(182, 213, 163)');
  await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
  await expect(page.locator('.ProseMirror')).toHaveCSS('color', 'rgb(56, 108, 54)');
  expect(await preview(page).locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--kp-tutorial-card').trim())).toBe('#eeefe9');
  await page.getByRole('textbox', { name: 'Document title weight', exact: true }).fill('300');
  await page.getByRole('textbox', { name: 'Document title weight', exact: true }).press('Tab');
  await expect(page.locator('.fn-article-header h1')).toHaveCSS('font-weight', '300');
  await expect(preview(page).locator('.kp-caption-document-intro h1')).toHaveCSS('font-weight', '300');
  await expect(preview(page).locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', 'equation.fractional-linear.right-simplified');
  await page.getByRole('button', { name: 'Close styles' }).click();
  const font = await page.locator('.ProseMirror').evaluate(el => getComputedStyle(el).fontFamily);
  await expect(page.locator('.fn-wordmark')).toHaveCSS('font-family', font);
  await page.getByText('Edit animation specification', { exact: true }).click();
  await page.locator('.cm-content').focus(); await ex(page, 'help');
  await expect(page.locator('.fn-help')).toContainText('Active buffer: animation JSON');
  await page.screenshot({ caret: 'initial', path: info.outputPath('focused-help-light.png') });
  await page.getByRole('button', { name: 'Close help' }).click();
  await ex(page, 'set nonumber'); await expect(page.locator('.cm-lineNumbers')).toHaveCount(0);
  await ex(page, 'set number'); await expect(page.locator('.cm-lineNumbers')).toBeVisible();
  await ex(page, 'wq'); await expect(page.locator('.fn-source-pane')).toBeHidden();
  await page.reload(); await expect(page.locator('.fn-article-header h1')).toHaveCSS('font-weight', '300');
});

test('Styles compares properties across objects and preserves named references', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  await page.getByRole('button', { name: 'Styles', exact: true }).click();
  const panel = page.locator('.fn-styles'), search = page.getByRole('searchbox', { name: 'Search styles' });
  await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
  await search.fill('weight');
  await expect(panel.locator('.fn-style-row')).toHaveCount(6);
  await expect(panel.locator('legend')).toHaveText(['Font weight']);
  await page.screenshot({ path: info.outputPath('styles-weight-comparison.png') });
  await page.getByRole('combobox', { name: 'Style object', exact: true }).selectOption('Section headings');
  await expect(panel.locator('.fn-style-row')).toHaveCount(1);
  await search.fill('size'); await expect(panel.locator('.fn-style-row')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Style property', exact: true }).selectOption('font-weight');
  await expect(panel).toContainText('No matching styles');
  await search.fill(''); await page.getByRole('combobox', { name: 'Style object', exact: true }).selectOption('');
  await page.getByRole('combobox', { name: 'Group styles by', exact: true }).selectOption('object');
  await expect(panel.locator('legend')).toHaveCount(6);
  await page.getByRole('combobox', { name: 'Style property', exact: true }).selectOption('color');
  await search.fill('body');
  const choice = page.getByRole('combobox', { name: 'Body color color', exact: true });
  await choice.selectOption('var(--color-green-light)');
  await expect(panel.getByRole('img', { name: 'Body color: Green' })).toHaveCSS('background-color', 'rgb(56, 108, 54)');
  await expect(panel.getByRole('textbox', { name: 'Body color', exact: true })).toBeHidden();
  await choice.selectOption('custom');
  const raw = panel.getByRole('textbox', { name: 'Body color', exact: true });
  // Math defaults to body color, so pointing body back at math must be rejected.
  await raw.fill('var(--fn-math)'); await raw.press('Tab');
  await expect(raw).toHaveJSProperty('validationMessage', 'Use a valid CSS value without circular references.');
  await expect(page.locator('.ProseMirror')).toHaveCSS('color', 'rgb(56, 108, 54)');
  await raw.fill('#345678'); await raw.press('Tab');
  await expect(page.locator('.ProseMirror')).toHaveCSS('color', 'rgb(52, 86, 120)');
  await page.reload(); await expect(page.locator('.ProseMirror')).toHaveCSS('color', 'rgb(52, 86, 120)');
  await page.getByRole('button', { name: 'Styles', exact: true }).click();
  await page.getByRole('button', { name: 'Reset overrides' }).click();
  await expect(page.locator('.ProseMirror')).toHaveCSS('color', 'rgb(36, 43, 53)');
  await search.fill('window opacity');
  const alpha = page.getByRole('textbox', { name: 'Window opacity', exact: true });
  for (const value of ['0.8', '80%']) {
    await alpha.fill(value); await alpha.press('Tab');
    expect(await page.locator('.kp-page-window').evaluate(node => getComputedStyle(node, '::before').opacity)).toBe('0.8');
    await expect(page.locator('.kp-page-window')).toHaveCSS('opacity', '1');
  }
  await alpha.fill(''); await alpha.press('Tab');
  expect(await page.locator('.kp-page-window').evaluate(node => getComputedStyle(node, '::before').opacity)).toBe('0.96');
  await page.setViewportSize({ width: 390, height: 844 });
  await search.fill('weight');
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('styles-phone.png') });
});

test('light canvas and parent gaps unify prose and the animation entrance', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 960 }); await ready(page);
  await page.getByRole('button', { name: 'Styles', exact: true }).click();
  await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(238, 239, 233)');
  for (const selector of ['.fn-source-pane', '.fn-styles']) await expect(page.locator(selector)).toHaveCSS('background-color', 'rgb(238, 239, 233)');
  await expect(page.locator('.fn-left')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('.fn-header')).toHaveCSS('background-color', 'rgb(238, 239, 233)');
  await expect(preview(page).locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(await page.locator('.kp-page-window').evaluate(node => getComputedStyle(node).getPropertyValue('--kp-window-background').trim())).toBe('#eeefe9');
  await expect(page.locator('.kp-page-window')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: 'Close styles' }).click();
  const geometry = await page.locator('.ProseMirror').evaluate(root => {
    const blocks = [...root.children], story = root.querySelector('.fn-story')!;
    const before = story.previousElementSibling!, first = blocks[1]!, second = blocks[2]!;
    const gap = (a: Element, b: Element) => b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
    return { paragraph: gap(first, second), stage: gap(before, story), outer: [getComputedStyle(story).marginTop, getComputedStyle(story).paddingTop], paragraphMargin: getComputedStyle(first.querySelector('p')!).marginBottom };
  });
  expect(geometry.paragraph).toBeGreaterThan(8); expect(geometry.paragraph).toBeLessThan(20);
  expect(geometry.stage).toBeCloseTo(geometry.paragraph, 1);
  expect(geometry.outer).toEqual(['0px', '0px']); expect(geometry.paragraphMargin).toBe('0px');
  expect(await page.locator('.fn-header').evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none');
  await menu(page, 'writing');
  expect(await page.locator('.fn-writing .fn-menu-panel').evaluate(el => { const rect = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(rect.x + 15, rect.y + 15)); })).toBe(true);
  await page.locator('.fn-writing > summary').click();
  await page.locator('.fn-editor').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: info.outputPath('light-document-rhythm.png') });
  await expect(preview(page).locator('.kp-caption-document-intro header')).toHaveCSS('row-gap', '6.4px');
  await expect(preview(page).locator('.kp-caption-document-intro header h1')).toHaveCSS('margin-bottom', '0px');
  await page.getByRole('button', { name: 'Styles', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search styles' }).fill('block gap');
  await page.getByRole('textbox', { name: 'Block gap', exact: true }).fill('1rem');
  await page.getByRole('textbox', { name: 'Block gap', exact: true }).press('Tab');
  await expect(page.locator('.ProseMirror')).toHaveCSS('row-gap', '16px');
  await expect(preview(page).locator('.kp-caption-document-intro')).toHaveCSS('row-gap', '16px');
});

test('source typing makes no preview request and a superseded Run cannot replace the result', async ({ page }) => {
  await ready(page);
  const story = seed.cells.find(cell => cell.type === 'story'); if (story?.type !== 'story') throw new Error('Missing story');
  await page.getByText('Edit animation specification', { exact: true }).click();
  await expect(page.locator('.fn-source-pane')).toBeVisible();
  let requests = 0; page.on('request', request => { if (request.url().endsWith('/api/dev/fraction-notebook')) requests++; });
  await replaceSpec(page, story.source.replace('Notice the last operation', 'A delayed run'), false);
  // Wait beyond the prose debounce to distinguish explicit Run from old live compilation.
  await page.waitForTimeout(450); expect(requests).toBe(0);
  let release: () => void = () => {}, reached: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { reached = resolve; });
  await page.route('**/api/dev/fraction-notebook', async route => {
    const response = await route.fetch(); reached(); await gate;
    await route.fulfill({ response });
  });
  await page.keyboard.press('Shift+Enter'); await started;
  await replaceSpec(page, story.source.replace('Notice the last operation', 'A newer draft'), false);
  release();
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'pending');
  await expect(preview(page).getByRole('combobox', { name: 'Animation moment' })).not.toContainText('A delayed run');
  await page.unrouteAll({ behavior: 'wait' });
  await page.keyboard.press('Shift+Enter');
  await expect(preview(page).getByRole('combobox', { name: 'Animation moment' })).toContainText('A newer draft');
});

test('phone focused buffer keeps both source and result usable', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  await page.getByText('Edit animation specification', { exact: true }).click();
  await expect(page.locator('.fn-source-pane')).toBeVisible();
  const code = (await page.locator('.fn-source-pane').boundingBox())!, result = (await page.locator('.fn-right').boundingBox())!;
  expect(code.height).toBeGreaterThan(250); expect(result.y).toBeGreaterThanOrEqual(code.y + code.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ caret: 'initial', path: info.outputPath('focused-phone.png') });
  await page.getByRole('button', { name: 'Close buffer', exact: true }).click(); await expect(page.locator('.fn-source-pane')).toBeHidden();
});
