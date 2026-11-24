import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { gzipSync } from 'node:zlib';
import { buildLocalReader } from '../scripts/local-reader-build.ts';
const seed = ['shared-matrix', 'compare-inputs'].map(name => JSON.parse(readFileSync(new URL(`../content/notebooks/${name}.json`, import.meta.url), 'utf8')));
const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

test('invalid input preserves the displayed scene and recovers its draft after reload', async ({ page }) => {
  await page.goto('/experiments/notebook/'); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  const edit = () => page.locator(`.nb-document [data-node-id="${id(22)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
  await edit(); await page.getByLabel('Matrix entries (2 × 2 JSON)').fill('[[1e100,0],[1,1]]');
  await page.getByRole('button', { name: 'Save block', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('scientific notation');
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '0');
  await expect(page.locator('.nb-document [data-type="scene"]').first()).toHaveAttribute('data-mount-count', '1');
  await page.reload(); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true'); await edit();
  await expect(page.getByLabel('Matrix entries (2 × 2 JSON)')).toHaveValue('[[1e100,0],[1,1]]');
  await page.getByRole('button', { name: 'Reload latest block', exact: true }).click();
  await expect(page.getByLabel('Matrix entries (2 × 2 JSON)')).toHaveValue('[[2,0],[1,1]]');
});

test('keyboard structural controls, undo and exported UUIDs preserve authored content', async ({ page }) => {
  await page.goto('/experiments/notebook/'); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  await page.locator(`.nb-document [data-node-id="${id(21)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Move down', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '1');
  expect(await page.locator('.nb-document > section').first().getAttribute('data-node-id')).toBe(id(22));
  await page.getByRole('button', { name: 'Undo last save', exact: true }).click();
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '2');
  expect(await page.locator('.nb-document > section').first().getAttribute('data-node-id')).toBe(id(21));
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download notebook JSON' }).click();
  const file = await download, path = await file.path(); expect(path).not.toBeNull();
  const exported = JSON.parse(readFileSync(path!, 'utf8')); expect(exported.id).toBe(id(20)); expect(exported.children).toEqual(seed[1].children);
});

test('folding during playback pauses the occurrence and retains its semantic position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/experiments/notebook/'); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  const scene = page.locator('.nb-document [data-type="scene"]').first(), slider = scene.locator('[data-scrub]');
  await scene.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Collapse Compare the two explanations', exact: true }).click();
  const held = await slider.inputValue(); await page.waitForTimeout(150);
  expect(await slider.inputValue()).toBe(held);
  await page.getByRole('button', { name: 'Expand Compare the two explanations', exact: true }).click();
  await expect(slider).toHaveValue(held); await expect(scene.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('local edits preserve the other scene; folds, moves and reload retain both positions', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/notebook/');
  await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  const scenes = page.locator('.nb-document [data-type="scene"]'); await expect(scenes).toHaveCount(2);
  await scenes.nth(0).locator('[data-scrub]').evaluate((el: HTMLInputElement) => { el.value = '0.65'; el.dispatchEvent(new Event('input')); });
  await scenes.nth(1).locator('[data-scrub]').evaluate((el: HTMLInputElement) => { el.value = '0.35'; el.dispatchEvent(new Event('input')); });
  const before = await scenes.evaluateAll(nodes => nodes.map(n => n.getAttribute('data-mount-count')));
  await page.locator(`.nb-document [data-node-id="${id(22)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Matrix entries (2 × 2 JSON)').fill('[[3,0],[1,1]]');
  await page.getByRole('button', { name: 'Save block', exact: true }).click();
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '1');
  expect(await scenes.nth(0).getAttribute('data-mount-count')).not.toBe(before[0]);
  expect(await scenes.nth(1).getAttribute('data-mount-count')).toBe(before[1]);
  await expect(scenes.nth(0).locator('[data-scrub]')).toHaveValue('0.65');
  await expect(scenes.nth(1).locator('[data-scrub]')).toHaveValue('0.35');
  const after = await scenes.evaluateAll(nodes => nodes.map(n => n.getAttribute('data-mount-count')));
  await page.locator(`.nb-document [data-node-id="${id(21)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Explanation', { exact: true }).fill('A revised explanation. Both inputs retain their own position.');
  await expect(page.getByRole('button', { name: 'Move down', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Save block', exact: true }).click();
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '2');
  expect(await scenes.evaluateAll(nodes => nodes.map(n => n.getAttribute('data-mount-count')))).toEqual(after);
  await page.getByRole('button', { name: 'Collapse Compare the two explanations', exact: true }).click();
  await expect(scenes.nth(0)).toBeHidden();
  await page.getByRole('button', { name: 'Expand Compare the two explanations', exact: true }).click();
  await expect(scenes.nth(0).locator('[data-scrub]')).toHaveValue('0.65');
  await page.locator(`.nb-document [data-node-id="${id(26)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Unnest', exact: true }).click();
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '3');
  expect(await scenes.evaluateAll(nodes => nodes.map(n => n.getAttribute('data-mount-count')))).toEqual(after);
  await page.reload(); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  await expect(scenes.nth(0).locator('[data-scrub]')).toHaveValue('0.65');
  await expect(scenes.nth(1).locator('[data-scrub]')).toHaveValue('0.35');
  await page.screenshot({ path: testInfo.outputPath('notebook-editor.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('shared source updates live consumers across tabs and stale drafts remain editable', async ({ page, context }) => {
  await page.goto('/experiments/notebook/'); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  const scenes = page.locator('.nb-document [data-type="scene"]');
  await page.locator(`.nb-document [data-node-id="${id(21)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Explanation', { exact: true }).fill('Unsaved local draft');
  const source = await context.newPage(); await source.goto(`/experiments/notebook/?notebook=${id(1)}`);
  await expect(source.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  await source.locator(`.nb-document [data-node-id="${id(3)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
  await source.getByLabel('Matrix entries (2 × 2 JSON)').fill('[[2,2],[3,4]]');
  await source.getByRole('button', { name: 'Save block', exact: true }).click();
  await expect(source.locator('#notebook')).toHaveAttribute('data-revision', '1');
  await expect(scenes.nth(0)).toHaveAttribute('data-mount-count', '2');
  await expect(scenes.nth(1)).toHaveAttribute('data-mount-count', '2');
  await expect(page.getByLabel('Explanation', { exact: true })).toHaveValue('Unsaved local draft');
  await source.getByLabel('Notebook', { exact: true }).selectOption(id(20));
  await expect(source.locator('h1')).toHaveText('Compare two inputs');
  await source.locator(`.nb-document [data-node-id="${id(21)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
  await source.getByLabel('Explanation', { exact: true }).fill('Another tab saved first');
  await source.getByRole('button', { name: 'Save block', exact: true }).click();
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '1');
  await page.getByRole('button', { name: 'Save block', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('changed');
  await expect(page.getByLabel('Explanation', { exact: true })).toHaveValue('Unsaved local draft');
  await expect(page.locator('.nb-document')).toContainText('Another tab saved first');
});

test('reader keeps the existing player but does not request editing modules', async ({ page }, testInfo) => {
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  await page.goto('/experiments/notebook/reader.html'); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-type="scene"]')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Save block' })).toHaveCount(0);
  expect(requests.filter(url => /\/notebook\/(editor|transactions)|codemirror|prosemirror|spindle/.test(url))).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('h1')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('notebook-reader-phone.png'), fullPage: true });
});

test('storage persists exact UUIDs across connections and rejects a concurrent stale save', async ({ page }) => {
  await page.goto('/experiments/matrix-column-combinations/?input=dependent-columns');
  const result = await page.evaluate(async seed => {
    const storagePath = '/src/notebook/persistence.ts', transactionPath = '/src/notebook/transactions.ts';
    const { openNotebookStore } = await import(storagePath);
    const { transact } = await import(transactionPath);
    const name = `notebook-test-${crypto.randomUUID()}`;
    const a = await openNotebookStore(seed, name), b = await openNotebookStore(seed, name);
    const baseline = await a.read(), original = baseline[1];
    const first = transact(original, 0, [{ type: 'rename', id: original.children[0].id, title: 'First saved edit' }]);
    const second = transact(original, 0, [{ type: 'rename', id: original.children[0].id, title: 'Stale overwrite' }]);
    const settled = await Promise.allSettled([a.save(0, first), b.save(0, second)]);
    a.close(); b.close();
    const reopened = await openNotebookStore(seed, name), docs = await reopened.read(); reopened.close();
    indexedDB.deleteDatabase(name);
    return { statuses: settled.map(x => x.status), revision: docs[1].revision, id: docs[1].children[0].id,
      title: docs[1].children[0].title, originalId: original.children[0].id, unchanged: JSON.stringify(docs[0]) === JSON.stringify(baseline[0]) };
  }, seed);
  expect(result.statuses.sort()).toEqual(['fulfilled', 'rejected']);
  expect(result.revision).toBe(1); expect(result.id).toBe(result.originalId); expect(result.unchanged).toBe(true);
  expect(['First saved edit', 'Stale overwrite']).toContain(result.title);
});

test('separate views receive committed changes and malformed saves preserve storage', async ({ page }) => {
  await page.goto('/experiments/matrix-column-combinations/');
  const result = await page.evaluate(async seed => {
    const path = '/src/notebook/persistence.ts', { openNotebookStore } = await import(path);
    const name = `notebook-test-${crypto.randomUUID()}`, a = await openNotebookStore(seed, name), b = await openNotebookStore(seed, name);
    const notification = new Promise<void>(resolve => b.subscribe(resolve));
    const next = { ...seed[0], revision: 1, title: 'Saved canonical definition' };
    await a.save(0, next); await notification;
    let rejected = false;
    try { await b.save(1, { ...next, revision: 2, children: [...next.children, next.children[0]] }); } catch { rejected = true; }
    const docs = await b.read(); a.close(); b.close(); indexedDB.deleteDatabase(name);
    return { rejected, title: docs[0].title, revision: docs[0].revision };
  }, seed);
  expect(result).toEqual({ rejected: true, title: 'Saved canonical definition', revision: 1 });
});

test('import preserves UUIDs and source revision and refuses to overwrite an existing notebook', async ({ page }) => {
  await page.goto('/experiments/notebook/'); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
  const imported = { schemaVersion: 1, id: id(500), revision: 7, title: 'Imported notebook', children: [
    { id: id(501), type: 'prose', title: 'Original resource', metadata: { 'kp:origin': 'external-file' }, text: 'Persistent identity.' }
  ] };
  const file = { name: 'imported.notebook.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) };
  await page.getByLabel('Import notebook JSON', { exact: true }).setInputFiles(file);
  await expect(page.locator('h1')).toHaveText('Imported notebook');
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '7');
  await expect(page.locator(`.nb-document [data-node-id="${id(501)}"]`)).toContainText('Persistent identity.');
  await page.reload(); await expect(page.locator('h1')).toHaveText('Imported notebook');
  await page.getByLabel('Import notebook JSON', { exact: true }).setInputFiles(file);
  await expect(page.getByRole('status')).toContainText('already exists');
  await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '7');
});

test.describe('production notebook closure', () => {
  let server: Server | undefined, origin: string;
  test.beforeAll(async () => {
    const files = new Map<string, Buffer>();
    for (const mode of ['reader', 'editor']) {
      const built = await buildLocalReader(`src/notebook/${mode}-entry.ts`);
      const modules = built.chunks.flatMap(c => c.modules);
      if (mode === 'reader') expect(modules.filter(path => /src\/notebook\/(editor|transactions)|codemirror|prosemirror|spindle/.test(path))).toEqual([]);
      const script = Buffer.concat([...built.files].filter(([name]) => name.endsWith('.js')).map(([,bytes]) => bytes));
      console.log(`Notebook ${mode}: ${script.length} JS bytes; ${gzipSync(script).length} gzip; ${modules.length} built modules.`);
      const styles = [...built.files.keys()].filter(path => path.endsWith('.css'));
      const template = readFileSync(`experiments/notebook/${mode === 'reader' ? 'reader.html' : 'index.html'}`, 'utf8');
      const html = template.replace(`src="/src/notebook/${mode}-entry.ts"`, 'src="./reader.js"')
        .replace('</head>', `${styles.map(path => `<link rel="stylesheet" href="./${path}">`).join('')}</head>`);
      for (const [name, bytes] of built.files) files.set(`${mode}/${name}`, bytes);
      files.set(`${mode}/index.html`, Buffer.from(html));
    }
    server = createServer((request, response) => {
      const path = new URL(request.url!, 'http://localhost').pathname.slice(1), bytes = files.get(path);
      if (!bytes) { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.html') ? 'text/html' : 'application/octet-stream'); response.end(bytes);
    });
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve));
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing production server address');
    origin = `http://127.0.0.1:${address.port}`;
  });
  test.afterAll(async () => { if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve())); });
  test('built editor saves content that the isolated reader reopens with reversible playback', async ({ page }) => {
    const errors: string[] = [], external: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('requestfailed', request => errors.push(request.url()));
    page.on('request', request => { if (!request.url().startsWith(origin)) external.push(request.url()); });
    await page.goto(`${origin}/editor/index.html`); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
    await page.locator(`.nb-document [data-node-id="${id(21)}"] > header`).getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Explanation', { exact: true }).fill('Saved from the production editor.');
    await page.getByRole('button', { name: 'Save block', exact: true }).click();
    await expect(page.locator('#notebook')).toHaveAttribute('data-revision', '1');
    await page.goto(`${origin}/reader/index.html`); await expect(page.locator('#notebook')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('.nb-document')).toContainText('Saved from the production editor.');
    const scene = page.locator('[data-type="scene"]').first();
    const poses = new Map<number, (string | null)[]>();
    for (const p of [0, .25, .5, .75, 1, .75, .5, .25, 0]) {
      await scene.locator('[data-scrub]').evaluate((el: HTMLInputElement, value) => { el.value = String(value); el.dispatchEvent(new Event('input')); }, p);
      const pose = await scene.locator('.comb-material > span').evaluateAll(nodes => nodes.map(n => n.getAttribute('style')));
      expect(pose.length).toBeGreaterThan(0);
      if (poses.has(p)) expect(pose).toEqual(poses.get(p)); else poses.set(p, pose);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]); expect(external).toEqual([]);
  });
});
