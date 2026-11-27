import { readFile, writeFile } from 'node:fs/promises';
import { test, expect, type Page, type Locator } from '@playwright/test';

const index = '/experiments/math-reference/';
test('preview imports report active failures but cannot revive or report after cancellation', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => window.addEventListener('message', event => {
    if (event.data?.protocol === 'kp.fraction-notebook.v1' && event.data.kind === 'ready') document.documentElement.dataset['readerReady'] = 'yes';
  }));
  for (const family of ['matrix', 'projection', 'composition']) {
    for (const outcome of ['active-failure', 'cancelled-failure', 'cancelled-success']) {
      const cancelled = outcome !== 'active-failure';
      let release: () => void = () => {}, requested: () => void = () => {};
      const gate = new Promise<void>(resolve => { release = resolve; });
      const seen = new Promise<void>(resolve => { requested = resolve; });
      const pattern = `**/src/fraction-notebook/${family}-reading.ts*`;
      await page.route(pattern, async route => { requested(); await gate;
        if (outcome === 'cancelled-success') await route.continue(); else await route.abort(); });
      await page.goto(`/experiments/fraction-notebook/math-preview.html?notebook=${family}`, { waitUntil: 'commit' });
      await seen;
      if (cancelled) await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
      release(); await page.waitForLoadState('networkidle');
      if (cancelled) { await expect(page.getByRole('alert')).toHaveCount(0); await expect(page.locator('.ProseMirror')).toHaveCount(0);
        await expect(page.locator('html')).not.toHaveAttribute('data-reader-ready', 'yes'); }
      else await expect(page.getByRole('alert')).toContainText('Could not load the mathematical reading');
      await page.unroute(pattern);
    }
  }
  expect(errors).toEqual([]);
});
async function command(page: Page, query: string) {
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true });
  await picker.locator('.ProseMirror').fill(query); await page.keyboard.press('Enter'); await expect(picker).toBeHidden();
}
async function exportSource(page: Page, source: Locator) {
  await source.locator('.fn-math-heading').click();
  const requested = page.waitForEvent('download'); await command(page, 'matrix.export-resource');
  const download = await requested;
  return readFile((await download.path())!);
}
async function selectCard(page: Page, name: string) {
  await page.getByRole('button', { name: 'Find a card', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Saved cards' });
  await picker.getByRole('combobox').fill(name); await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Card name', exact: true })).toHaveValue(name);
}
test('the collection groups seven canonical destinations without loading any players', async ({ page, request }, info) => {
  const requests: string[] = []; page.on('request', r => requests.push(r.url()));
  await page.goto(index); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mathematical reference');
  await expect(page.locator('html')).toHaveAttribute('data-kp-theme', 'light');
  const links = page.locator('[data-reference]'); await expect(links).toHaveCount(7);
  const destinations = await links.evaluateAll(nodes => nodes.map(n => (n as HTMLAnchorElement).getAttribute('href')!));
  for (const href of destinations) expect((await request.get(href)).status()).toBe(200);
  expect(requests.filter(p => /src\/(animation-player|fraction-notebook|matrix-reference)|katex|three|graph-3d/.test(p))).toEqual([]);
  await expect(page.locator('canvas, iframe, .comb-stage')).toHaveCount(0);
  await page.getByRole('link', { name: 'Functions & change', exact: true }).click();
  await expect(page).toHaveURL(/#functions$/);
  await page.screenshot({ path: info.outputPath('collection-desktop.png'), fullPage: true });
  await page.getByRole('link', { name: 'Where do sine and cosine come from?', exact: true }).click();
  await expect(page.locator('#circle-trig')).toHaveAttribute('data-ready', 'true');
  await page.goBack(); await expect(page).toHaveURL(/#functions$/);
});
test('the index remains readable and navigable on a phone without JavaScript', async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`http://127.0.0.1:8000${index}`);
    await page.getByText('Make and save both examples', { exact: true }).click();
    await expect(page.locator('details')).toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('collection-phone.png'), fullPage: true });
    await page.getByRole('link', { name: 'Why can area accumulate to zero?', exact: true }).click();
    await expect(page.locator('h1')).toBeVisible(); await expect(page.locator('svg').first()).toBeVisible();
  } finally { await context.close(); }
});
test('a product-authored copy and substantive revision export and reopen as independent saved explanations', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const started = performance.now();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/experiments/fraction-notebook/?notebook=matrix');
  await expect(page.locator('.fn-matrix-object')).toHaveCount(2);
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
  const originalId = await page.locator('.fn-matrix-object[data-math-view=equation]').first().getAttribute('data-matrix-resource');
  // Bind the original by identity: a paste may insert before it in document order.
  const original = page.locator(`.fn-matrix-object[data-math-view=equation][data-matrix-resource="${originalId}"]`);
  await original.locator('.fn-math-heading').click();
  const editor = page.getByLabel('Matrix notebook', { exact: true }); await editor.focus();
  // Exercise the editor's real clipboard handlers; no document/model injection.
  const clipboard = await editor.evaluate(el => {
    const event = new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() }); el.dispatchEvent(event);
    return { html: event.clipboardData?.getData('text/html') ?? '', text: event.clipboardData?.getData('text/plain') ?? '' };
  });
  expect(clipboard.html).toContain('data-matrix-resource');
  await editor.press('G'); await editor.press('o');
  await editor.evaluate((el, data) => {
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() });
    if (!event.clipboardData) throw new Error('Missing clipboard transfer');
    event.clipboardData.setData('text/html', data.html); event.clipboardData.setData('text/plain', data.text); el.dispatchEvent(event);
  }, clipboard);
  const source = page.locator(`.fn-matrix-object[data-math-view=equation]:not([data-matrix-resource="${originalId}"])`);
  await expect(source).toHaveCount(1);
  for (const [name, value] of [['A11', '2'], ['A12', '-1'], ['A21', '1'], ['A22', '2'], ['v1', '1'], ['v2', '2']] as const)
    await source.getByRole('textbox', { name, exact: true }).fill(value);
  await expect(source.locator('.fn-math-legend')).toContainText('Av = (0, 5)');
  await expect(original.locator('.fn-math-legend')).toContainText('Av = (3, 2)');
  await source.getByRole('button', { name: 'Explain', exact: true }).click();
  const explanation = page.locator('[data-math-view=columns]'); await expect(explanation.locator('.comb-stage')).toHaveCount(1);
  await explanation.getByLabel('Milestone', { exact: true }).selectOption('6');
  await expect(explanation.locator('[data-result-label]')).toHaveText('Sum: (0, 5)');
  const first = await exportSource(page, source), createdAt = performance.now();
  const revisionStarted = performance.now();
  await source.getByRole('textbox', { name: 'v2', exact: true }).fill('-2');
  await expect(explanation.locator('[data-result-label]')).toHaveText('Sum: (4, -3)');
  const revisionVisible = performance.now(), second = await exportSource(page, source);
  const a = JSON.parse(first.toString()), b = JSON.parse(second.toString());
  expect(a.id).not.toBe(originalId); expect(b.id).toBe(a.id);
  expect(a.matrix.entries).toEqual([[2, -1], [1, 2]]); expect(b.matrix).toEqual(a.matrix);
  expect(a.vector.entries).toEqual([1, 2]); expect(b.vector.entries).toEqual([1, -2]);
  expect(b.vector.revision).toBeGreaterThan(a.vector.revision); expect(b.result).toEqual(a.result);
  await writeFile(info.outputPath('cancellation.json'), first); await writeFile(info.outputPath('reinforcement.json'), second);
  await page.reload(); await expect(source.getByRole('textbox', { name: 'v2', exact: true })).toHaveValue('-2');
  await expect(explanation.locator('[data-result-label]')).toHaveText('Sum: (4, -3)');
  await page.goto('/experiments/matrix-reference/?geometry=1');
  await expect(page.locator('.reference-stage')).toHaveAttribute('aria-busy', 'false');
  for (const [i, bytes, name] of [[0, first, 'Cancellation'], [1, second, 'Reinforcement']] as const) {
    await page.getByLabel('Open matrix snapshot', { exact: true }).setInputFiles({ name: `${name}.json`, mimeType: 'application/json', buffer: bytes });
    if (i === 1) await page.getByRole('button', { name: 'Save as separate card', exact: true }).click();
    await expect(page.locator('[data-filename]')).toHaveText(`${name}.json`);
    await page.getByRole('textbox', { name: 'Card name', exact: true }).fill(name);
    await page.getByRole('button', { name: 'Save name', exact: true }).click();
    await page.getByLabel('Milestone', { exact: true }).selectOption(i === 0 ? '6' : '4');
    await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', i === 0 ? '1' : String(4 / 6));
    await expect(page.locator('.comb-stage')).toHaveCount(1); await expect(page.locator('.reference-geometry')).toHaveCount(1);
  }
  await page.reload(); await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', String(4 / 6));
  await expect(page.locator('[data-result-label]')).toHaveText('Sum: (4, -3)');
  await selectCard(page, 'Cancellation'); await expect(page.locator('[data-result-label]')).toHaveText('Sum: (0, 5)');
  await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', '1');
  await page.screenshot({ path: info.outputPath('authored-cancellation.png'), fullPage: true });
  await selectCard(page, 'Reinforcement'); await expect(page.locator('.reference-stage')).toHaveAttribute('data-saved-progress', String(4 / 6));
  await page.getByLabel('Milestone', { exact: true }).selectOption('6');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('[data-result-label]')).toHaveText('Sum: (4, -3)');
  await page.screenshot({ path: info.outputPath('authored-reinforcement-phone.png'), fullPage: true });
  await writeFile(info.outputPath('authoring-measurement.json'), JSON.stringify({
    browser: info.project.name, creationThroughExportMs: createdAt - started,
    revisionToVisibleMs: revisionVisible - revisionStarted, completeWorkflowMs: performance.now() - started,
    sourceId: a.id, note: 'Automated local interaction time, including waits; not human or model authoring latency. Clipboard events use real product handlers.'
  }, null, 2));
  expect(errors).toEqual([]);
});
