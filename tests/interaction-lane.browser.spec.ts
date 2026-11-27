import { expect, test } from '@playwright/test';

const url = process.env['KP_INTERACTION_LAB_URL'] ?? 'http://127.0.0.1:8011/';

test('standalone picker narrows, navigates beyond five results, restores focus and remounts', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  const launch = page.getByRole('button', { name: 'Open picker', exact: true });
  await launch.click();
  const dialog = page.getByRole('dialog', { name: 'fruit and commands' });
  const query = dialog.getByRole('combobox');
  await expect(dialog.getByRole('option')).toHaveCount(5);
  for (let count = 0; count < 11; count++) await query.press('ArrowDown');
  await expect(dialog.locator('[aria-selected="true"]')).toContainText('Pear');
  await query.fill('apricot'); await expect(dialog.getByRole('option')).toHaveCount(1);
  await query.press('Enter'); await expect(dialog).not.toBeVisible();
  await expect(page.locator('#selection')).toHaveText('Selected Apricot · fruit.apricot'); await expect(launch).toBeFocused();
  await launch.click(); await query.press('Escape'); await expect(launch).toBeFocused();
  await launch.click(); await query.fill('reopen'); await query.press('Enter');
  await expect(dialog).toBeVisible(); await expect(query).toHaveValue(''); await expect(dialog.getByRole('option')).toHaveCount(5);
  await query.press('Escape'); await page.getByRole('button', { name: 'Remount picker' }).click();
  await expect(page.locator('#mount-status')).toHaveText('Picker mount 2');
  await expect(page.locator('#interaction-picker')).toHaveCount(1);
  await query.fill('orange'); await query.press('Enter'); await expect(page.locator('#selection')).toHaveText('Selected Orange · fruit.orange');
  expect(errors).toEqual([]);
  await launch.click();
  await page.screenshot({ path: test.info().outputPath('picker.png'), fullPage: true });
});

test('tag filters preserve query and return focus without growing past five mounted rows', async ({ page }) => {
  await page.goto(url); await page.getByRole('button', { name: 'Open picker', exact: true }).click();
  const dialog = page.getByRole('dialog'), query = dialog.getByRole('combobox');
  await query.press('Control+h');
  const fruit = dialog.getByRole('button', { name: 'Fruit', exact: true });
  await expect(fruit).toBeFocused(); await fruit.click();
  await expect(dialog.getByRole('option')).toHaveCount(3);
  await fruit.press('q'); await expect(query).toBeFocused(); await expect(fruit).not.toBeVisible();
  await query.fill('reset'); await expect(dialog.getByRole('option')).toHaveCount(1);
  await expect(dialog.getByRole('option')).toContainText('Clear selection');
  await query.press('Enter'); await expect(dialog).not.toBeVisible();
});
