import { test, expect, type Page } from '@playwright/test';
import { cpus } from 'node:os';

const url = '/experiments/fraction-notebook/?notebook=quadratic';
const source = (page: Page) => page.locator('.fn-math-object[data-math-kind=quadratic][data-math-view=equation]').first();
const objects = (page: Page) => page.locator('.fn-math-object');
async function ready(page: Page) {
  await page.goto(url);
  await expect(objects(page)).toHaveCount(2);
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
}
async function command(page: Page, query: string) {
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true });
  await expect(picker).toBeVisible();
  await picker.locator('.ProseMirror').fill(query);
  await page.keyboard.press('Enter');
  await expect(picker).toBeHidden();
}
test('quadratic forms are lazy source projections with honest degree and real-root limits', async ({ page }, info) => {
  const errors: string[] = [], formLoads: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('quadratic-forms-view')) formLoads.push(request.url()); });
  await page.setViewportSize({ width: 1280, height: 1000 }); await ready(page);
  expect(formLoads).toEqual([]);
  await page.goto(`${url}&forms=1`);
  const equation = source(page), graph = page.locator('[data-math-kind=quadratic][data-math-view=graph]');
  const forms = graph.locator('.fn-quadratic-forms');
  await expect(forms.locator('[data-form]')).toHaveCount(3);
  const field = (key: string) => equation.getByRole('textbox', { name: key, exact: true });
  await field('a').fill('0.00000001'); await field('b').fill('1'); await field('c').fill('1');
  await expect(equation.locator('.fn-math-equation annotation')).toContainText('10^{-8}');
  await expect(forms.locator('[data-form=expanded] annotation')).toContainText('10^{-8}');
  await field('a').fill('1'); await field('b').fill('-2'); await field('c').fill('1');
  await expect(forms).toHaveAttribute('data-degree', '2');
  await expect(forms.locator('[data-form=factored]')).toHaveAttribute('data-state', 'available');
  const path = await graph.locator('.graph-curve path').elementHandle();
  const validForms = await forms.textContent();
  await field('c').fill('-'); await expect(field('c')).toBeFocused();
  await expect(forms).toHaveText(validForms!);
  await expect(graph.locator('.fn-math-diagnostic')).not.toBeEmpty();
  await field('c').fill('2');
  await expect(forms.locator('[data-form=factored]')).toHaveAttribute('data-state', 'unavailable');
  await expect(forms.locator('[data-form=factored]')).toContainText(/real/i);
  expect(await path!.evaluate(node => node.isConnected)).toBe(true);
  await field('a').fill('0');
  await expect(forms).toHaveAttribute('data-degree', '1');
  await expect(forms.locator('[data-form=vertex]')).toHaveAttribute('data-state', 'unavailable');
  await expect(forms.locator('[data-form=factored]')).toHaveAttribute('data-state', 'available');
  await field('b').fill('0'); await expect(forms).toHaveAttribute('data-degree', '0');
  await field('a').fill('1'); await field('b').fill('-2'); await field('c').fill('-3');
  await expect(forms.locator('[data-form=factored]')).toHaveAttribute('data-state', 'available');
  await forms.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('quadratic-forms.png') });
  await page.reload(); await expect(forms).toHaveAttribute('data-degree', '2');
  await expect(field('c')).toHaveValue('-3');
  await equation.locator('.fn-math-heading').click(); await command(page, 'notebook.toggle-editing');
  const readerForms = page.frameLocator('iframe').locator('.fn-quadratic-forms');
  await expect(readerForms.locator('[data-form=factored]')).toHaveAttribute('data-state', 'available');
  await command(page, 'notebook.toggle-editing');
  await page.setViewportSize({ width: 390, height: 844 }); await forms.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('quadratic-forms-phone.png') });
  expect(errors).toEqual([]);
});
test('quadratic editing, derived views and persistent identities work in the existing workspace', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await page.setViewportSize({ width: 1440, height: 1000 }); await ready(page);
  const equation = source(page), original = await equation.getAttribute('data-math-resource');
  await equation.locator('.fn-math-heading').click();
  await equation.getByRole('button', { name: 'Derivative', exact: true }).click();
  const derivative = page.locator('[data-math-kind=derivative]'); await expect(derivative).toHaveCount(1);
  const derivedId = await derivative.getAttribute('data-math-resource');
  const field = await equation.getByRole('textbox', { name: 'c', exact: true }).elementHandle();
  await equation.getByRole('textbox', { name: 'c', exact: true }).fill('3');
  expect(await field!.evaluate(node => node.isConnected)).toBe(true);
  await expect(equation.getByRole('textbox', { name: 'c', exact: true })).toBeFocused();
  await expect(equation.locator('.fn-math-equation')).toContainText('3');
  await equation.getByRole('button', { name: 'Tangent', exact: true }).click();
  const tangent = page.locator('[data-math-kind=tangent]'); await expect(tangent).toHaveCount(1);
  await tangent.getByRole('textbox', { name: 'Contact x', exact: true }).fill('2');
  await expect(tangent.locator('.fn-math-contact')).toHaveAttribute('data-x', '2');
  await expect(tangent.locator('.fn-math-contact')).toHaveAttribute('data-y', '7');
  await expect(tangent.locator('.fn-math-legend')).toContainText('slope = 4');
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
  await page.screenshot({ path: info.outputPath('quadratic-linked-views.png') });
  await page.reload(); await expect(objects(page)).toHaveCount(4);
  await expect(source(page)).toHaveAttribute('data-math-resource', original!);
  await expect(derivative).toHaveAttribute('data-math-resource', derivedId!);
  await expect(source(page).getByRole('textbox', { name: 'c', exact: true })).toHaveValue('3');
  await expect(tangent.locator('.fn-math-contact')).toHaveAttribute('data-y', '7');
  await tangent.locator('.fn-math-heading').click(); await command(page, 'notebook.toggle-editing');
  await expect(page.frameLocator('iframe').locator('.fn-math-object')).toHaveCount(4);
  await page.screenshot({ path: info.outputPath('quadratic-reading.png') });
  expect(errors).toEqual([]);
});

test('M-x discovers applicable operations; repeated views keep local zoom and invalid drafts remain recoverable', async ({ page }) => {
  await ready(page); const equation = source(page);
  await equation.locator('.fn-math-heading').click(); await command(page, 'math.graph');
  const graphs = page.locator('[data-math-kind=quadratic][data-math-view=graph]'); await expect(graphs).toHaveCount(2);
  const firstPath = graphs.first().locator('.graph-curve path'), secondPath = graphs.last().locator('.graph-curve path');
  const original = await secondPath.getAttribute('d');
  await graphs.first().getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect(firstPath).not.toHaveAttribute('d', original!); await expect(secondPath).toHaveAttribute('d', original!);
  await equation.getByRole('textbox', { name: 'c', exact: true }).fill('2');
  await expect(secondPath).not.toHaveAttribute('d', original!);
  const validPath = await secondPath.getAttribute('d');
  await equation.getByRole('textbox', { name: 'c', exact: true }).fill('-');
  await expect(equation.locator('.fn-math-diagnostic')).toContainText('last valid');
  await expect(equation.getByRole('button', { name: 'Derivative', exact: true })).toBeDisabled();
  await expect(secondPath).toHaveAttribute('d', validPath!);
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
  await page.reload(); await expect(graphs).toHaveCount(2);
  await expect(equation.getByRole('textbox', { name: 'c', exact: true })).toHaveValue('-');
  await expect(secondPath).toHaveAttribute('d', validPath!);
  await expect(graphs.first().locator('.fn-math-legend')).toContainText('x -5 … 5');
  await expect(graphs.last().locator('.fn-math-legend')).toContainText('x -4 … 4');
  await equation.getByRole('textbox', { name: 'c', exact: true }).fill('-2');
  await expect(equation.getByRole('button', { name: 'Derivative', exact: true })).toBeEnabled();
  await graphs.first().getByRole('button', { name: 'Fold mathematical object', exact: true }).click();
  await expect(graphs.first().locator('.fn-math-body')).toBeHidden();
  await expect(graphs.last().locator('.fn-math-body')).toBeVisible();
});

test('tangent dragging commits once, Escape cancels, and clock reversal and interruption preserve endpoints', async ({ page }) => {
  await ready(page); await source(page).getByRole('button', { name: 'Tangent', exact: true }).click();
  const tangent = page.locator('[data-math-kind=tangent]'), slider = tangent.getByRole('slider'), contact = tangent.locator('.fn-math-contact');
  const graph = await tangent.locator('svg').elementHandle();
  const drag = (values: number[], commit: boolean) => slider.evaluate((node, data) => {
    if (!(node instanceof HTMLInputElement)) throw new Error('Missing tangent slider'); node.focus();
    for (const value of data.values) { node.value = String(value); node.dispatchEvent(new Event('input', { bubbles: true })); }
    if (data.commit) node.dispatchEvent(new Event('change', { bubbles: true }));
  }, { values, commit });
  await drag([1.25, 1.5, 2, 2.25], false); await expect(contact).toHaveAttribute('data-x', '2.25');
  await slider.press('Escape'); await expect(contact).toHaveAttribute('data-x', '1');
  await drag([1.25, 1.5, 2, 2.25], true); await expect(contact).toHaveAttribute('data-x', '2.25');
  await slider.press('ControlOrMeta+z'); await expect(contact).toHaveAttribute('data-x', '1');
  await slider.press('ControlOrMeta+Shift+z'); await expect(contact).toHaveAttribute('data-x', '2.25');
  expect(await graph!.evaluate(node => node.isConnected)).toBe(true);
  await tangent.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(async () => Number(await contact.getAttribute('data-x'))).toBeGreaterThan(2.3);
  await tangent.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await contact.getAttribute('data-x');
  await page.waitForTimeout(100); await expect(contact).toHaveAttribute('data-x', paused!);
  await tangent.getByRole('button', { name: 'Reverse', exact: true }).click();
  await expect.poll(async () => Number(await contact.getAttribute('data-x'))).toBeLessThan(Number(paused));
  await source(page).getByRole('textbox', { name: 'c', exact: true }).fill('3');
  await expect(contact).toHaveAttribute('data-x', paused!);
  await expect(tangent.getByRole('button', { name: 'Pause', exact: true })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await tangent.getByRole('button', { name: 'Play', exact: true }).click(); await expect(contact).toHaveAttribute('data-x', '4');
  await tangent.getByRole('button', { name: 'Reverse', exact: true }).click(); await expect(contact).toHaveAttribute('data-x', '-4');
});

test('copy creates an independent source, while Graph preserves the original resource', async ({ page }) => {
  await ready(page); const original = await source(page).getAttribute('data-math-resource');
  await source(page).locator('.fn-math-heading').click();
  const editor = page.getByLabel('Mathematical notebook', { exact: true }); await editor.focus();
  const copied = await editor.evaluate(el => {
    const event = new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() }); el.dispatchEvent(event);
    return { html: event.clipboardData?.getData('text/html') ?? '', text: event.clipboardData?.getData('text/plain') ?? '' };
  });
  expect(copied.html).toContain('data-math-resource');
  await editor.press('G'); await editor.press('A');
  await editor.evaluate((el, copied) => {
    // Firefox supplies its own transfer object for synthetic clipboard events.
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() });
    if (!event.clipboardData) throw new Error('Missing clipboard transfer');
    event.clipboardData.setData('text/html', copied.html); event.clipboardData.setData('text/plain', copied.text); el.dispatchEvent(event);
  }, copied);
  const equations = page.locator('[data-math-kind=quadratic][data-math-view=equation]'); await expect(equations).toHaveCount(2);
  expect(await equations.last().getAttribute('data-math-resource')).not.toBe(original);
  await equations.last().getByRole('textbox', { name: 'c', exact: true }).fill('5');
  await expect(equations.first().getByRole('textbox', { name: 'c', exact: true })).toHaveValue('0');
  await expect(page.locator('[data-math-view=graph]')).toHaveAttribute('data-math-resource', original!);
});

test('saved dark theme reaches math reading before its deferred module; narrow editor stays within its pane', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('kp.notebook.styles.v1', JSON.stringify({ theme: 'dark', values: {} })));
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/src/fraction-notebook/math-preview.ts*', async route => { await gate; await route.continue(); });
  try {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(objects(page)).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(source(page)).toHaveCSS('color', 'rgb(226, 226, 217)');
    await page.screenshot({ path: info.outputPath('quadratic-phone-dark.png') });
    const reading = page.frameLocator('iframe').locator('html');
    await expect(reading).toHaveAttribute('data-notebook-theme', 'dark');
    await expect(page.frameLocator('iframe').locator('body')).toHaveCSS('background-color', 'rgb(18, 24, 38)');
  } finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});

test('a command captured before a document edit cannot silently act on the new revision', async ({ page }) => {
  await ready(page); await source(page).locator('.fn-math-heading').click();
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true }); await picker.locator('.ProseMirror').fill('math.derivative');
  await expect(picker.getByRole('option', { selected: true })).toHaveAttribute('aria-disabled', 'false');
  // Model an update arriving while a picker owns focus. User input cannot
  // click the inert pane, but another admitted producer can change its data.
  await source(page).locator('input[aria-label=a]').evaluate(input => {
    if (!(input instanceof HTMLInputElement)) throw new Error('Missing coefficient'); input.value = '2'; input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(picker.getByRole('option', { selected: true })).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter'); await expect(picker).toBeVisible(); await expect(objects(page)).toHaveCount(2);
  await page.keyboard.press('Escape'); await command(page, 'math.derivative');
  await expect(page.locator('[data-math-kind=derivative] .fn-math-equation')).toContainText('4');
});

test('cost: complete loaded imports, numeric draft latency and tangent frames have a repeatable baseline', async ({ page, browserName, browser }, info) => {
  const requests = new Set<string>(); page.on('request', request => requests.add(new URL(request.url()).pathname));
  await page.setViewportSize({ width: 1440, height: 1000 });
  const start = performance.now(); await ready(page); const coldBrowserMs = performance.now() - start;
  const warmBrowserMs: number[] = [];
  for (let index = 0; index < 3; index++) { const start = performance.now(); await page.reload(); await expect(objects(page)).toHaveCount(2); warmBrowserMs.push(performance.now() - start); }
  const latency = await source(page).getByRole('textbox', { name: 'c', exact: true }).evaluate(async element => {
    if (!(element instanceof HTMLInputElement)) throw new Error('Missing coefficient');
    const samples: number[] = [];
    for (let index = 0; index < 60; index++) {
      const start = performance.now(); element.value = String(index % 7 - 3); element.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); samples.push(performance.now() - start);
    }
    return samples;
  });
  await source(page).getByRole('button', { name: 'Tangent', exact: true }).click();
  const tangent = page.locator('[data-math-kind=tangent]'); await tangent.getByRole('textbox', { name: 'Contact x', exact: true }).fill('-4');
  await tangent.getByRole('button', { name: 'Play', exact: true }).click();
  const frames = await page.evaluate(() => new Promise<number[]>(resolve => {
    const samples: number[] = []; let previous: number | undefined;
    const sample = (now: number) => { if (previous !== undefined) samples.push(now - previous); previous = now;
      if (samples.length === 90) resolve(samples); else requestAnimationFrame(sample); }; requestAnimationFrame(sample);
  }));
  await tangent.getByRole('button', { name: 'Pause', exact: true }).click();
  const completion = await page.evaluate(async () => {
    const path = '/src/editor-commands/matching.ts';
    const { matchCommands } = await import(path) as typeof import('../src/editor-commands/matching.ts');
    const commands = Array.from({ length: 5000 }, (_, index) => ({ id: `concept.${index}`, title: `Quadratic relation ${index}`, category: 'Mathematics',
      keywords: ['derivative', 'tangent', 'graph'], state: () => ({ enabled: true as const }), execute: async () => ({ ok: true as const }) }));
    matchCommands(commands, 'tangent'); const samples: number[] = [];
    for (let index = 0; index < 60; index++) { const start = performance.now(); matchCommands(commands, index % 2 ? 'tangent' : 'quadratic 1'); samples.push(performance.now() - start); }
    return samples;
  });
  const summarize = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return { samples: sorted.length, p50: sorted[Math.floor(sorted.length * .5)]!, p95: sorted[Math.floor(sorted.length * .95)]!, max: sorted.at(-1)! }; };
  const report = { machine: { platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model }, browser: `${browserName} ${browser.version()}`, viewport: '1440×1000', coldBrowserMs, warmBrowserMs,
    draftToNextFrameMs: summarize(latency), playbackFrameMs: summarize(frames), metadataMatchMs: summarize(completion), requests: [...requests].sort(),
    qualification: 'One cold browser cache on a warm shared Vite server, three warm reloads. Numeric dispatch through the next RAF is a paint-opportunity proxy. 60 draft samples, 90 playback intervals. Metadata-only matching over 5,000 synthetic records; this does not certify mounting a 5,000-row picker. No live model calls.' };
  await info.attach('mathematics-runtime-cost.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  console.log(JSON.stringify({ ...report, requests: report.requests.length }));
  expect(report.requests.filter(path => /graph-3d|animation-catalogue|mathjs/.test(path))).toEqual([]);
  expect(report.draftToNextFrameMs.p95).toBeLessThan(250); expect(report.playbackFrameMs.p95).toBeLessThan(33); expect(report.metadataMatchMs.p95).toBeLessThan(50);
});
