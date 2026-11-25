import { test, expect, type Page } from '@playwright/test';

const player = (page: Page) => page.frameLocator('#project-frame').frameLocator('#object-player');
async function open(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit KP object', exact: true }).click();
  await expect(page.locator('#object-status')).toContainText('Connected.', { timeout: 60000 });
  await expect(player(page).locator('body')).toHaveAttribute('data-kp-reader-hydrated', 'true');
}
async function edit(page: Page, title: string) {
  const value = JSON.parse(await page.locator('#object-source').inputValue());
  value.steps[0].title = title;
  await page.locator('#object-source').fill(JSON.stringify(value, null, 2));
}
async function run(page: Page) {
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await expect(page.locator('#object-status')).toContainText('Preview accepted', { timeout: 30000 });
}
test('workbench object: actual cross-origin editor updates the mounted native player and rejects invalid targets', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await open(page);
  const stage = await player(page).locator('.kp-reader-equation-stage').elementHandle();
  await edit(page, 'Notice what changes together'); await run(page);
  await expect(player(page).locator('[data-kp-beat] h2').first()).toHaveText('Notice what changes together');
  expect(await stage!.evaluate(node => node.isConnected)).toBe(true);
  await player(page).getByRole('combobox', { name: 'Animation moment' }).selectOption('equation.fractional-linear.right-simplified');
  const annotation = (await page.locator('#object-source').inputValue()).replace('Four is half of x. Predict the whole before revealing the next move.', 'Four is one half. What is the whole?');
  await page.locator('#object-source').fill(annotation); await run(page);
  await expect(player(page).locator('.anchored-labels')).toContainText('Four is one half.');
  const invalid = (await page.locator('#object-source').inputValue()).replace('equation.fractional-linear.initial.lhs.plus3', 'invented.target');
  await page.locator('#object-source').fill(invalid);
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await expect(page.locator('#object-status')).toContainText('Preview rejected');
  await expect(player(page).locator('[data-kp-beat] h2').first()).toHaveText('Notice what changes together');
  await expect(player(page).locator('.anchored-labels')).toContainText('Four is one half.');
  expect(await stage!.evaluate(node => node.isConnected)).toBe(true);
  await page.locator('#object-source').fill(invalid.replace('invented.target', 'equation.fractional-linear.initial.lhs.plus3'));
  await run(page);
  await page.locator('#object-source').evaluate(el => { el.scrollTop = 0; });
  await expect(page.locator('#object-status')).toBeInViewport();
  await page.screenshot({ path: info.outputPath('workbench-object.png') });
  await page.getByRole('button', { name: 'Return to reader', exact: true }).click();
  await expect(page.locator('#reader')).toBeVisible();
  await page.getByRole('button', { name: 'Standalone site', exact: true }).click();
  await expect(page.locator('#project-frame')).toHaveAttribute('src', 'http://127.0.0.1:1427/');
  await expect(page.frameLocator('#project-frame').locator('body')).toContainText('This page has its own document');
  expect(errors).toEqual([]);
});
test('workbench object: draft survives reconnect and reload without automatic preview or stale-basis overwrite', async ({ page }) => {
  await open(page);
  await edit(page, 'A retained draft');
  const draft = await page.locator('#object-source').inputValue();
  let previews = 0;
  page.on('request', request => { if (request.url().endsWith('/api/dev/fraction-object') && request.method() === 'POST') previews++; });
  await page.getByRole('button', { name: 'Reconnect', exact: true }).click();
  await expect(page.locator('#object-status')).toContainText('Connected.');
  await expect(page.locator('#object-source')).toHaveValue(draft);
  await page.reload();
  await page.getByRole('button', { name: 'Edit KP object', exact: true }).click();
  await expect(page.locator('#object-status')).toContainText('Connected.');
  await expect(page.locator('#object-source')).toHaveValue(draft);
  await expect(player(page).locator('[data-kp-beat] h2').first()).not.toHaveText('A retained draft');
  expect(previews).toBe(0);
  await page.evaluate(() => {
    const key = 'workbench.project-object.draft.v1';
    const value = JSON.parse(localStorage.getItem(key)!); value.revision = 'stale'; localStorage.setItem(key, JSON.stringify(value));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Edit KP object', exact: true }).click();
  await expect(page.locator('#object-status')).toContainText('Canonical revision changed');
  await expect(page.locator('#object-source')).toHaveValue(draft);
  await expect(page.getByRole('button', { name: 'Preview draft', exact: true })).toBeDisabled();
});
test('workbench object: edited or detached requests cannot apply late results', async ({ page }) => {
  await open(page);
  await edit(page, 'Accepted baseline'); await run(page);
  let release: (() => void) | undefined;
  let arrived: (() => void) | undefined;
  const received = new Promise<void>(resolve => { arrived = resolve; });
  await page.route('**/api/dev/fraction-object', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch();
    arrived?.();
    await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ response }).catch(() => {}); // Browser abort is expected after editing.
  });
  await edit(page, 'Late result must not win');
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await received;
  await edit(page, 'Newest unsent draft');
  release!();
  await expect(player(page).locator('[data-kp-beat] h2').first()).toHaveText('Accepted baseline');
  await page.unroute('**/api/dev/fraction-object');
  await run(page);
  await expect(player(page).locator('[data-kp-beat] h2').first()).toHaveText('Newest unsent draft');
  let detachedArrived: (() => void) | undefined;
  const detachedRequest = new Promise<void>(resolve => { detachedArrived = resolve; });
  let detachedRelease: (() => void) | undefined;
  const aborted = page.waitForEvent('requestfailed', request => request.url().endsWith('/api/dev/fraction-object'));
  await page.route('**/api/dev/fraction-object', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch();
    detachedArrived?.();
    await new Promise<void>(resolve => { detachedRelease = resolve; });
    await route.fulfill({ response }).catch(() => {});
  });
  await edit(page, 'Detached result must not win');
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await detachedRequest;
  // A forged reply from the outer window cannot impersonate the project frame.
  await page.evaluate(() => window.postMessage({ protocol: 'kp.project-object.v1', kind: 'accepted', session: 'foreign', request: 999 }, location.origin));
  await page.getByRole('button', { name: 'Return to reader', exact: true }).click();
  detachedRelease!();
  await aborted;
  await expect(player(page).locator('[data-kp-beat] h2').first()).toHaveText('Newest unsent draft');
  await expect(page.locator('#object-buffer')).toBeHidden();
  await expect(page.locator('#reader')).toBeVisible();
});
test('workbench object: server rejects stale and foreign proposals and timeout disconnects without losing source', async ({ page }) => {
  await open(page);
  const object = await (await page.request.get('http://127.0.0.1:8000/api/dev/fraction-object')).json();
  const foreign = await page.request.post('http://127.0.0.1:8000/api/dev/fraction-object', { data: object, headers: { Origin: 'http://127.0.0.1:1426' } });
  expect(foreign.status()).toBe(403);
  const stale = await page.request.post('http://127.0.0.1:8000/api/dev/fraction-object', { data: { ...object, revision: 'stale' }, headers: { Origin: 'http://127.0.0.1:8000' } });
  expect(stale.status()).toBe(422);
  expect((await stale.json()).error).toContain('revision changed');
  await edit(page, 'Draft survives an uncertain response');
  const draft = await page.locator('#object-source').inputValue();
  let release: (() => void) | undefined;
  await page.route('**/api/dev/fraction-object', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    await new Promise<void>(resolve => { release = resolve; });
    await route.abort().catch(() => {});
  });
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await expect(page.locator('#object-status')).toContainText('not confirmed', { timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Preview draft', exact: true })).toBeDisabled();
  await expect(page.locator('#object-source')).toHaveValue(draft);
  release!();
});
