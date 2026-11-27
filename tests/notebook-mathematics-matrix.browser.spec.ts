import { test, expect, type Page } from '@playwright/test';
const url = '/experiments/fraction-notebook/?notebook=matrix';
const equation = (page: Page) => page.locator('.fn-matrix-object[data-math-view=equation]').first();
const graphs = (page: Page) => page.locator('.fn-matrix-object[data-math-view=graph]');
async function ready(page: Page) {
  await page.goto(url); await expect(page.locator('.fn-matrix-object')).toHaveCount(2);
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
}
async function command(page: Page, query: string) {
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true }); await expect(picker).toBeVisible();
  await picker.locator('.ProseMirror').fill(query); await page.keyboard.press('Enter'); await expect(picker).toBeHidden();
}
test('matrix source editing preserves focus, graph mounts, native history and independent view extents across reload', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 }); await ready(page);
  const source = equation(page), id = await source.getAttribute('data-matrix-resource');
  const field = source.getByRole('textbox', { name: 'A11', exact: true }), input = await field.elementHandle();
  const graph = await graphs(page).locator('svg').elementHandle();
  const slope = await graphs(page).locator('line.fn-matrix-vector[data-role=input]').evaluate(line =>
    (Number(line.getAttribute('y2')) - Number(line.getAttribute('y1'))) / (Number(line.getAttribute('x2')) - Number(line.getAttribute('x1'))));
  expect(slope).toBeCloseTo(-2); // SVG y is downward; world-space units must be equal.
  await field.fill('3'); await expect(field).toBeFocused();
  await expect(source.locator('.fn-math-legend')).toContainText('Av = (5, 2)');
  expect(await input!.evaluate(n => n.isConnected)).toBe(true); expect(await graph!.evaluate(n => n.isConnected)).toBe(true);
  await field.press('ControlOrMeta+z'); await expect(field).toHaveValue('1');
  await field.press('ControlOrMeta+Shift+z'); await expect(field).toHaveValue('3');
  await source.locator('.fn-math-heading').click(); await command(page, 'matrix.graph'); await expect(graphs(page)).toHaveCount(2);
  await graphs(page).first().getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect(graphs(page).first().locator('.fn-math-legend')).toContainText('range ±10');
  await expect(graphs(page).last().locator('.fn-math-legend')).toContainText('range ±5');
  await field.fill('-'); await expect(source.locator('.fn-math-diagnostic')).toContainText('last valid');
  await expect(source.locator('.fn-math-legend')).toContainText('(5, 2)');
  await expect(source.getByRole('button', { name: 'Graph', exact: true })).toBeDisabled();
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid'); await page.reload();
  await expect(field).toHaveValue('-'); await expect(source).toHaveAttribute('data-matrix-resource', id!);
  await expect(graphs(page).first().locator('.fn-math-legend')).toContainText('range ±10');
  await field.fill('2'); await page.screenshot({ path: info.outputPath('matrix-notebook-editor.png') });
  await graphs(page).first().getByRole('button', { name: 'Fold mathematical object', exact: true }).click();
  await expect(graphs(page).first().locator('.fn-math-body')).toBeHidden(); await expect(graphs(page).last().locator('.fn-math-body')).toBeVisible();
  await source.locator('.fn-math-heading').click(); await command(page, 'notebook.toggle-editing');
  const reading = page.frameLocator('iframe').locator('.fn-matrix-object'); await expect(reading).toHaveCount(3);
  await expect(reading.first().locator('.fn-math-legend')).toContainText('(4, 2)');
  await page.screenshot({ path: info.outputPath('matrix-notebook-reading.png') }); expect(errors).toEqual([]);
});
test('matrix commands reject stale targets and ordinary clipboard copy owns independent mathematics', async ({ page }) => {
  await ready(page); const originalId = await equation(page).getAttribute('data-matrix-resource');
  const source = page.locator(`.fn-matrix-object[data-math-view=equation][data-matrix-resource="${originalId}"]`);
  await source.locator('.fn-math-heading').click();
  await page.keyboard.press('Control+x'); await page.keyboard.press('Control+x');
  const picker = page.getByRole('dialog', { name: 'Commands', exact: true }); await picker.locator('.ProseMirror').fill('matrix.graph');
  await source.getByRole('textbox', { name: 'A11', exact: true }).evaluate(node => {
    if (!(node instanceof HTMLInputElement)) throw new Error('Missing matrix field'); node.value = '2'; node.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(picker.getByRole('option', { selected: true })).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape'); await source.locator('.fn-math-heading').click();
  const editor = page.getByLabel('Matrix notebook', { exact: true }); await editor.focus();
  await expect(source).toHaveClass(/ProseMirror-selectednode/);
  const copied = await editor.evaluate(el => {
    const event = new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() }); el.dispatchEvent(event);
    return { html: event.clipboardData?.getData('text/html') ?? '', text: event.clipboardData?.getData('text/plain') ?? '' };
  });
  expect(copied.html).toContain('data-matrix-resource');
  // Open a prose block before pasting. A NodeSelection on the final graph
  // intentionally replaces that graph; it is not a text insertion point.
  await editor.press('G'); await editor.press('o');
  await editor.evaluate((el, copied) => {
    // Firefox gives a synthetic event its own transfer object. Populate that
    // object, rather than assuming the constructor retained the supplied one.
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() });
    if (!event.clipboardData) throw new Error('Missing clipboard transfer');
    event.clipboardData.setData('text/html', copied.html); event.clipboardData.setData('text/plain', copied.text); el.dispatchEvent(event);
  }, copied);
  const equations = page.locator('.fn-matrix-object[data-math-view=equation]'); await expect(equations).toHaveCount(2);
  const copy = page.locator(`.fn-matrix-object[data-math-view=equation]:not([data-matrix-resource="${originalId}"])`);
  await expect(copy).toHaveCount(1);
  await copy.getByRole('textbox', { name: 'v1', exact: true }).fill('4');
  await expect(source.getByRole('textbox', { name: 'v1', exact: true })).toHaveValue('1');
  await expect(graphs(page).locator('.fn-math-legend')).toContainText('(4, 2)');
  await expect(page.locator('.fn-status')).toHaveAttribute('data-state', 'valid');
});
test('matrix notebook stays within a narrow pane and switches without overwriting quadratic drafts', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  await equation(page).getByRole('textbox', { name: 'A11', exact: true }).fill('4');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('matrix-notebook-phone.png') });
  await equation(page).locator('.fn-math-heading').click(); await command(page, 'notebook.open-quadratic');
  const c = page.locator('[data-math-kind=quadratic][data-math-view=equation]').getByRole('textbox', { name: 'c', exact: true });
  await c.fill('3'); await page.locator('[data-math-kind=quadratic]').first().locator('.fn-math-heading').click();
  await command(page, 'notebook.open-matrix'); await expect(equation(page).getByRole('textbox', { name: 'A11', exact: true })).toHaveValue('4');
  await equation(page).locator('.fn-math-heading').click(); await command(page, 'notebook.open-quadratic'); await expect(c).toHaveValue('3');
});
