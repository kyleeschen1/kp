import { test, expect, type Page, type Locator } from '@playwright/test';
const url = '/experiments/fraction-notebook/?notebook=projection';
const inputs = (page: Page) => page.locator('.fn-projection-object[data-projection-view=inputs]');
const explanations = (page: Page) => page.locator('.fn-projection-object[data-projection-view=explanation]');
const vector = (view: Locator, role: string) => view.locator(`[data-graph] g[data-role=${role}]`);
async function ready(page: Page) {
  await page.goto(url); await expect(inputs(page)).toHaveCount(1); await expect(explanations(page).locator('svg')).toHaveCount(1);
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
}
async function command(page: Page, query: string) {
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true }); await expect(picker).toBeVisible();
  await picker.locator('.ProseMirror').fill(query); await page.keyboard.press('Enter'); await expect(picker).toBeHidden();
}
test('shared sources, independent playback, native history, invalid drafts and reload', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 }); await ready(page);
  const source = inputs(page).first(), field = source.getByRole('textbox', { name: 'a x', exact: true });
  const originalId = await source.getAttribute('data-projection-resource');
  await field.fill('-4'); await expect(field).toBeFocused();
  await expect(vector(explanations(page).first(), 'parallel')).toHaveAttribute('data-end', '-1,-1');
  await source.getByRole('button', { name: 'Explain projection', exact: true }).click(); await expect(explanations(page)).toHaveCount(2);
  const first = explanations(page).first(), second = explanations(page).last();
  await expect(first.locator('.kp-projection')).toHaveCSS('white-space', 'normal');
  await first.getByRole('slider').fill('1'); await second.getByRole('slider').fill('0.375');
  await expect(first.getByRole('slider')).toHaveValue('1'); await expect(second.getByRole('slider')).toHaveValue('0.375');
  await expect(first).toHaveAttribute('data-projection-resource', originalId!);
  await first.getByRole('button', { name: 'Return to inputs', exact: true }).click();
  await expect(source).toHaveClass(/ProseMirror-selectednode/);
  const editor = page.getByLabel('Projection notebook', { exact: true });
  await editor.press('ControlOrMeta+z'); await expect(explanations(page)).toHaveCount(1);
  await editor.press('ControlOrMeta+Shift+z'); await expect(explanations(page)).toHaveCount(2);
  const savedId = await first.getAttribute('data-cell-id');
  await first.getByRole('slider').fill('1'); const oldGraph = await first.locator('[data-graph] svg').elementHandle();
  await field.fill('-'); await expect(first.getByRole('slider')).toBeDisabled();
  await expect(first.locator('.fn-math-diagnostic')).toContainText('last valid');
  expect(await oldGraph!.evaluate(node => node.isConnected)).toBe(true);
  await expect(source.getByRole('button', { name: 'Explain projection', exact: true })).toBeDisabled();
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
  await page.reload(); await expect(field).toHaveValue('-');
  await expect(vector(first, 'parallel')).toHaveAttribute('data-end', '-1,-1');
  await field.fill('6'); await expect(field).toBeFocused();
  await expect(vector(first, 'parallel')).toHaveAttribute('data-end', '4,4');
  await expect(vector(second, 'parallel')).toHaveAttribute('data-end', '4,4');
  await expect(first).toHaveAttribute('data-cell-id', savedId!);
  await first.getByRole('button', { name: 'Fold vector-pair object', exact: true }).click(); await expect(first.locator('.kp-projection')).toHaveCount(0);
  await first.getByRole('button', { name: 'Fold vector-pair object', exact: true }).click(); await expect(first.getByRole('slider')).toHaveValue('1');
  await first.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('projection-notebook-linked.png') });
  await source.getByRole('textbox', { name: 'b x', exact: true }).fill('0'); await source.getByRole('textbox', { name: 'b y', exact: true }).fill('0');
  await expect(first.locator('[data-undefined]')).toBeVisible(); await expect(first.locator('svg')).toHaveCount(0);
  await source.getByRole('textbox', { name: 'b x', exact: true }).fill('1'); await expect(first.locator('svg')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('discovery rejects stale targets and native copy isolates values while cut keeps identity', async ({ page }) => {
  await ready(page); const source = inputs(page).first(); await source.locator('.fn-math-heading').click();
  await command(page, 'math.discover');
  const picker = page.getByRole('dialog', { name: 'Mathematical capabilities', exact: true });
  await expect(picker.getByRole('option')).toHaveCount(2);
  await source.getByRole('textbox', { name: 'a x', exact: true }).evaluate(node => {
    const input = node as HTMLInputElement; input.value = '5'; input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await picker.getByRole('combobox').fill('Explain'); await page.keyboard.press('Enter');
  await expect(picker).toBeVisible(); await expect(picker).toContainText('changed'); await expect(explanations(page)).toHaveCount(1);
  await page.keyboard.press('Escape'); await source.locator('.fn-math-heading').click(); await command(page, 'math.discover');
  await picker.getByRole('combobox').fill('linked'); await page.keyboard.press('Enter'); await expect(inputs(page)).toHaveCount(2);
  await inputs(page).last().getByRole('textbox', { name: 'a y', exact: true }).fill('9'); await expect(source.getByRole('textbox', { name: 'a y', exact: true })).toHaveValue('9');
  const editor = page.getByLabel('Projection notebook', { exact: true });
  const copy = async (kind: 'copy' | 'cut') => {
    await source.locator('.fn-math-heading').click(); await editor.focus();
    return editor.evaluate((el, kind) => {
      const event = new ClipboardEvent(kind, { bubbles: true, cancelable: true, clipboardData: new DataTransfer() }); el.dispatchEvent(event);
      return { html: event.clipboardData?.getData('text/html') ?? '', text: event.clipboardData?.getData('text/plain') ?? '' };
    }, kind);
  };
  const paste = async (clipboard: { html: string; text: string }) => {
    await editor.focus(); await editor.press('G'); await editor.press('o');
    await editor.evaluate((el, clipboard) => {
      const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() });
      event.clipboardData!.setData('text/html', clipboard.html); event.clipboardData!.setData('text/plain', clipboard.text); el.dispatchEvent(event);
    }, clipboard);
    await editor.press('Escape');
  };
  const original = await source.getAttribute('data-projection-resource'), clipboard = await copy('copy');
  expect(clipboard.html).toContain('data-projection-resource'); await paste(clipboard); await expect(inputs(page)).toHaveCount(3);
  const independent = page.locator(`.fn-projection-object[data-projection-view=inputs]:not([data-projection-resource="${original}"])`);
  await independent.getByRole('textbox', { name: 'a x', exact: true }).fill('99'); await expect(source.getByRole('textbox', { name: 'a x', exact: true })).toHaveValue('5');
  const id = await source.getAttribute('data-cell-id'), cut = await copy('cut'); await expect(page.locator(`[data-cell-id="${id}"]`)).toHaveCount(0);
  await paste(cut); await expect(page.locator(`[data-cell-id="${id}"]`)).toHaveAttribute('data-projection-resource', original!);
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
});
test('narrow themed reader, reduced motion and visibility release preserve other notebook sources', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page);
  const source = inputs(page).first(), explanation = explanations(page).first();
  await source.getByRole('textbox', { name: 'a x', exact: true }).fill('7');
  await explanation.getByRole('slider').fill('0.625'); await explanation.locator('[data-play]').click();
  await expect(explanation.getByRole('slider')).toHaveValue('0.75');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await explanation.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('projection-phone-light.png') });
  await source.locator('.fn-math-heading').click(); await command(page, 'notebook.toggle-editing');
  await expect(explanation.locator('.kp-projection')).toHaveCount(0);
  const reader = page.frameLocator('iframe').locator('.fn-projection-object[data-projection-view=explanation]');
  await expect(reader.locator('svg')).toHaveCount(1); await reader.getByRole('slider').fill('1');
  await expect(vector(reader, 'parallel')).toHaveAttribute('data-end', '4.5,4.5');
  await command(page, 'styles.set-theme');
  await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('dark');
  await page.getByRole('button', { name: 'Close styles', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-notebook-theme', 'dark');
  await expect(page.frameLocator('iframe').locator('html')).toHaveAttribute('data-notebook-theme', 'dark');
  expect(await reader.locator('.graph-svg__background').evaluate(el => getComputedStyle(el).fill)).toBe('rgb(18, 24, 38)');
  await reader.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('projection-phone-reader-dark.png') });
  await command(page, 'notebook.toggle-editing'); await expect(reader.locator('svg')).toHaveCount(0);
  await expect(explanation.getByRole('slider')).toHaveValue('0.75');
  await source.locator('.fn-math-heading').click(); await command(page, 'notebook.open-matrix');
  const matrix = page.locator('.fn-matrix-object[data-math-view=equation]').first();
  await matrix.getByRole('textbox', { name: 'A11', exact: true }).fill('8');
  await matrix.locator('.fn-math-heading').click(); await command(page, 'notebook.open-projection');
  await expect(inputs(page).first().getByRole('textbox', { name: 'a x', exact: true })).toHaveValue('7');
  expect(errors).toEqual([]);
});
test('deletion releases occurrence capacity and delayed player imports cannot resurrect a folded view', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  const playerRequest = /\/src\/projection-explanation\/player\.ts(?:\?|$)/;
  await page.route(playerRequest, async route => { requested = true; await gate; await route.continue(); });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' }); await expect(inputs(page)).toHaveCount(1);
    await expect.poll(() => requested).toBe(true);
    await explanations(page).first().getByRole('button', { name: 'Fold vector-pair object', exact: true }).click();
  } finally { release(); }
  // Completing the import after folding must not create a hidden clock owner.
  const source = inputs(page).first();
  for (let i = 0; i < 6; i++) await source.getByRole('button', { name: 'Linked view', exact: true }).click();
  await expect(inputs(page)).toHaveCount(7); await expect(source.getByRole('button', { name: 'Linked view', exact: true })).toBeDisabled();
  await expect(explanations(page).locator('.kp-projection')).toHaveCount(0);
  const removed = await inputs(page).last().getAttribute('data-cell-id');
  await inputs(page).last().locator('.fn-math-heading').click();
  const editor = page.getByLabel('Projection notebook', { exact: true }); await editor.focus();
  // Normal-mode Delete is deliberately unimplemented; native cut is the
  // existing supported block-removal path and must release occurrence capacity.
  await editor.evaluate(el => el.dispatchEvent(new ClipboardEvent('cut', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() })));
  await expect(inputs(page)).toHaveCount(6); await expect(source.getByRole('button', { name: 'Linked view', exact: true })).toBeEnabled();
  await editor.press('ControlOrMeta+z'); await expect(inputs(page)).toHaveCount(7);
  await expect(page.locator(`[data-cell-id="${removed}"]`)).toHaveCount(1);
  await editor.press('ControlOrMeta+Shift+z'); await expect(inputs(page)).toHaveCount(6);
  await source.getByRole('button', { name: 'Explain projection', exact: true }).click();
  await expect(explanations(page)).toHaveCount(2); await expect(explanations(page).locator('.kp-projection')).toHaveCount(1);
});
