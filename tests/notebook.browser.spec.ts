import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const seed = ['shared-matrix', 'compare-inputs'].map(name => JSON.parse(readFileSync(new URL(`../content/notebooks/${name}.json`, import.meta.url), 'utf8')));

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
