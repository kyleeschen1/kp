import { expect, test } from "@playwright/test";
import { buildKpVisualContactSheetHtml, type KpVisualContactSheetItem } from "../scripts/capture-visual-contact-sheet.ts";
import { env, combination, beats, numberOf } from "../src/experiments/matrix-column-combinations/model.ts";
import { matrixInputs } from "../content/authoring/convergence/matrices.ts";
import { projectionLoss } from "../content/authoring/linear-algebra/projection-loss.ts";
import { dependentColumns } from "../content/authoring/linear-algebra/dependent-columns.ts";

test("all matrix pages and the menu use the three-term page theme", async ({ page }, info) => {
  const routes = ['dot-product-passage/', 'matrix-column-product/', 'matrix-column-combinations/',
    'matrix-column-combinations/?example=identity', 'matrix-column-combinations/?example=orthonormality',
    'matrix-column-combinations/?example=composition', 'matrix-examples/'];
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const [index, route] of routes.entries()) {
      await page.goto(`/experiments/${route}`);
      const menu = route === 'matrix-examples/';
      const light = menu || route === 'dot-product-passage/';
      if (!menu) await expect(page.locator('[data-ready="true"]')).toHaveCount(1);
      await expect(page.locator('html')).toHaveCSS('color-scheme', light ? 'light' : 'dark');
      await expect(page.locator('body')).toHaveCSS('background-color', light ? 'rgb(255, 253, 248)' : 'rgb(32, 34, 34)');
      await expect(page.locator('body')).toHaveCSS('color', light ? 'rgb(36, 35, 31)' : 'rgb(208, 208, 203)');
      await expect(page.locator('.matrix-controls button').first()).toHaveCSS('font-weight', '600');
      if (!menu) {
        await expect(page.locator('.matrix-card')).toHaveCSS('background-color', light ? 'color(srgb 0.970118 0.956392 0.931137)' : 'rgb(32, 34, 34)');
        await expect(page.locator('.matrix-card')).toHaveCSS('border-top-color', light ? 'rgb(183, 177, 165)' : 'rgb(76, 80, 80)');
        await expect(page.locator('.matrix-card .katex').first()).toHaveCSS('font-weight', '400');
      } else {
        await expect(page.frameLocator('#example-frame').locator('#dot-player')).toHaveAttribute('data-ready', 'true');
        await expect(page.frameLocator('#example-frame').locator('body')).toHaveCSS('background-color', 'rgb(255, 253, 248)');
      }
      if (colorScheme === 'light') await page.screenshot({ path: info.outputPath(`shared-page-${index}.png`), fullPage: true });
    }
  }
});

const route = "/experiments/matrix-column-combinations/";
test("persistent comparison retains fractional positions, focus and browser history without reloading", async ({ page }) => {
  let documents = 0;
  page.on("request", request => { if (request.resourceType() === "document") documents++; });
  await page.goto(`${route}?input=dependent-columns&context=compare#p=0.64`);
  const root = page.locator("#comb-player"), slider = page.getByRole("slider");
  await expect(root).toHaveAttribute("data-ready", "true");
  await expect(slider).toHaveValue("0.64");
  const oldSlider = await slider.elementHandle();
  // WebKit does not focus links on pointer clicks. Exercise actual keyboard
  // focus ownership rather than imposing another engine's pointer behavior.
  const second = page.getByRole("link", { name: "2", exact: true });
  await second.focus(); await second.press("Enter");
  await expect(root).toHaveAttribute("data-column", "1");
  await expect(slider).toHaveValue("0.64");
  await expect(page.getByRole("link", { name: "2", exact: true })).toBeFocused();
  expect(await oldSlider!.evaluate(node => node.oninput === null && !node.isConnected)).toBe(true);
  expect(new URL(page.url()).searchParams.get("context")).toBe("compare");
  await page.goBack(); await expect(root).toHaveAttribute("data-column", "0");
  await expect(slider).toHaveValue("0.64");
  await page.goForward(); await expect(root).toHaveAttribute("data-column", "1");
  await expect(slider).toHaveValue("0.64");
  await page.getByRole("link", { name: projectionLoss.reading.title, exact: true }).click();
  await expect(root).toHaveAttribute("data-source-id", projectionLoss.product.id);
  await expect(slider).toHaveValue("0");
  await page.goBack(); await expect(root).toHaveAttribute("data-source-id", dependentColumns.product.id);
  await expect(root).toHaveAttribute("data-column", "1"); await expect(slider).toHaveValue("0.64");
  expect(documents).toBe(1);
  await page.reload(); await expect(root).toHaveAttribute("data-ready", "true");
  await expect(slider).toHaveValue("0.64");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await slider.fill("0.42"); await expect(slider).toHaveValue("0.42");
  expect(new URL(page.url()).hash).toBe("#p=0.42");
});

test("latest matrix selection wins delayed loads and failed loads preserve the usable source", async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/content/authoring/linear-algebra/dependent-columns.ts*", async request => { await held; await request.continue(); });
  await page.goto(`${route}?input=projection-loss#scaled`);
  const root = page.locator("#comb-player"); await expect(root).toHaveAttribute("data-ready", "true");
  await page.getByRole("link", { name: dependentColumns.reading.title, exact: true }).click();
  await expect(root).toHaveAttribute("aria-busy", "true");
  await page.getByRole("link", { name: "Identity", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Identity selects each column");
  const loaded = page.waitForResponse(response => response.url().includes("/linear-algebra/dependent-columns.ts"));
  release(); await loaded;
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Identity selects each column");
  await expect(root).toHaveAttribute("aria-busy", "false");
  const previous = page.url();
  await page.getByRole("link", { name: "Original", exact: true }).evaluate(link => link.setAttribute("href", "?input=missing"));
  await page.getByRole("link", { name: "Original", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Choose a matrix input");
  expect(page.url()).toBe(previous);
  await page.getByRole("slider").fill("0.64"); await expect(page.getByRole("slider")).toHaveValue("0.64");
  await page.getByRole("link", { name: "2", exact: true }).click();
  await expect(root).toHaveAttribute("data-column", "1"); await expect(page.getByRole("alert")).toHaveCount(0);
});

test("repeated selection releases old player observers and page disposal cancels playback", async ({ page }) => {
  await page.addInitScript(() => {
    const observers = new Set<ResizeObserver>();
    const Native = window.ResizeObserver;
    window.ResizeObserver = class extends Native {
      override observe(target: Element, options?: ResizeObserverOptions) {
        observers.add(this); document.documentElement.dataset["observerCount"] = String(observers.size); super.observe(target, options);
      }
      override disconnect() { observers.delete(this); document.documentElement.dataset["observerCount"] = String(observers.size); super.disconnect(); }
    };
  });
  await page.goto(`${route}?input=dependent-columns#scaled`);
  const root = page.locator("#comb-player"); await expect(root).toHaveAttribute("data-ready", "true");
  const observers = await page.locator("html").getAttribute("data-observer-count");
  for (let index = 0; index < 8; index++) {
    const column = index % 2 === 0 ? 1 : 0;
    await page.getByRole("link", { name: String(column + 1), exact: true }).click();
    await expect(root).toHaveAttribute("data-column", String(column));
    await expect(page.locator("html")).toHaveAttribute("data-observer-count", observers!);
    await expect(page.locator(".comb-stage")).toHaveCount(1);
  }
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await expect(page.locator("html")).toHaveAttribute("data-observer-count", "0");
  expect(await page.getByRole("slider").evaluate(node => (node as HTMLInputElement).oninput)).toBe(null);
  await expect(page.locator(".comb-material")).toBeEmpty();
});

test("failed native preparation restores the previous matrix source and held state", async ({ page }) => {
  await page.goto(`${route}?input=projection-loss#p=0.64`);
  const root = page.locator("#comb-player"); await expect(root).toHaveAttribute("data-ready", "true");
  const previous = page.url();
  await page.evaluate(() => {
    const measure = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList.contains("comb-stage")) {
        Element.prototype.getBoundingClientRect = measure;
        throw new Error("Injected endpoint preparation failure");
      }
      return measure.call(this);
    };
  });
  await page.getByRole("link", { name: "Identity", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Injected endpoint preparation failure");
  await expect(root).toHaveAttribute("data-source-id", projectionLoss.product.id);
  await expect(page.getByRole("slider")).toHaveValue("0.64"); expect(page.url()).toBe(previous);
  await page.getByRole("link", { name: "2", exact: true }).click();
  await expect(root).toHaveAttribute("data-column", "1");
  await expect(page.getByRole("slider")).toHaveValue("0.64");
});

test("matrix discovery fetches only the selected authored source", async ({ page }) => {
  const sources: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/content/authoring/")) sources.push(request.url());
  });
  await page.goto(route);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  expect(sources.some(url => url.includes("/linear-algebra/"))).toBe(false);
  expect(sources.some(url => url.includes("/convergence/matrices.ts"))).toBe(false);
  await page.getByRole("link", { name: projectionLoss.reading.title, exact: true }).click();
  await expect(page.locator("#comb-player")).toHaveAttribute("data-source-id", projectionLoss.product.id);
  expect(sources.some(url => url.includes("/projection-loss.ts"))).toBe(true);
  expect(sources.some(url => url.includes("/dependent-columns.ts"))).toBe(false);
});

for (const { source, result, label } of [
  { source: projectionLoss, result: [3, 0], label: "projection" },
  { source: dependentColumns, result: [1, 2], label: "dependent columns" }
]) test(`${label} explanation keeps authored cues above unchanged reversible contributions`, async ({ page, browser }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto(`${route}?input=${source.id}`);
  const root = page.locator("#comb-player");
  await expect(root).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(source.reading.title);
  await expect(page.locator("#matrix-story > p")).toHaveText(source.reading.introduction);
  await expect(root).toHaveAttribute("data-source-id", source.product.id);
  for (const column of [0, 1] as const) {
    const chooser = page.getByRole("combobox", { name: "Milestone" });
    await expect(chooser.locator("option")).toHaveCount(7);
    for (const [index, beat] of beats.entries()) {
      await chooser.selectOption(String(index));
      await expect(page.locator("[data-cue]")).toHaveText(source.reading.cues[column][beat.id]);
    }
    for (const [row, entry] of result.entries()) {
      await expect(page.locator(`[data-kp-comb-key="c-${row}-${column}"]`)).toHaveText(String(entry));
      await expect(page.locator(`[data-kp-comb-key="c-${row}-${column}"]`)).toHaveCSS("opacity", "1");
      await expect(page.locator(`[data-contributor-occurrence="scaled-1-${row}:input:0"]`))
        .toHaveAttribute("data-source-id", source.product.right.rows[1]![column]!.id);
    }
    const slider = page.getByRole("slider", { name: "Animation position" });
    await slider.fill("0.64");
    const pose = () => page.locator(".comb-material > span").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")));
    const held = await pose(); await slider.fill("1"); await slider.fill("0"); await slider.fill("0.64");
    expect(await pose()).toEqual(held);
    await chooser.selectOption("4");
    for (const row of [0, 1]) for (const term of [0, 1]) {
      const pair = source.product.cell(row, column).dot.pairs[term]!;
      const scaled = page.locator(`[data-kp-comb-key="scaled-${term}-${row}"]`);
      await expect(scaled).toHaveText(String(numberOf(pair.product)).replace('-', '−'));
      await expect(scaled).toHaveCSS("opacity", "1");
      await expect(page.locator(`[data-contributor-occurrence="scaled-${term}-${row}:input:1"]`))
        .toHaveAttribute("data-source-id", pair.left.id);
    }
    const cue = await page.locator("[data-cue]").boundingBox(), stage = await page.locator(".comb-stage").boundingBox();
    expect(cue!.y + cue!.height).toBeLessThanOrEqual(stage!.y);
    await page.screenshot({ path: info.outputPath(`${source.id}-${column}.png`), fullPage: true });
    if (column === 0) {
      await page.getByRole("link", { name: "2", exact: true }).click();
      await expect(root).toHaveAttribute("data-ready", "true");
      await expect(root).toHaveAttribute("data-source-id", source.product.id);
      expect(new URL(page.url()).searchParams.get("input")).toBe(source.id);
    }
  }
  await expect(page.getByRole("region", { name: "What the comparison shows" })).toContainText("reverse playback is not a mathematical inverse");
  await page.getByText("Check your reasoning", { exact: true }).click();
  await expect(page.getByText(source.reading.question.answer, { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("slider").press("End");
  await expect(root).toHaveAttribute("data-milestone", "placed");
  await page.screenshot({ path: info.outputPath(`${source.id}-phone.png`), fullPage: true });
  expect(errors).toEqual([]);
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await noScript.newPage(); await staticPage.goto(`${route}?input=${source.id}`);
    await expect(staticPage.locator("noscript p")).toContainText("needs JavaScript to load the selected matrices");
    await expect(staticPage.locator("noscript p")).toBeVisible();
    await expect(staticPage.locator('[data-ready="true"]')).toHaveCount(0);
  } finally { await noScript.close(); }
});

test("accepted continuity receives enclosures and evaluates without switching whole lines", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto(route);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  const slider = page.getByRole("slider", { name: "Animation position" });
  const seek = async (phase: number, local: number) => slider.fill(String(Number(((phase - 1 + local) / 6).toFixed(4))));
  const poses = () => page.locator('.comb-stage [style]').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { transform: style.transform, opacity: style.opacity, clip: style.clipPath };
  }));
  const captures: KpVisualContactSheetItem[] = [];
  for (const [phase, local] of [[1, .25], [1, .55], [3, .5], [4, .35], [4, .85], [5, .35], [5, .85], [6, 1]] as const) {
    await seek(phase, local);
    const held = await poses();
    await slider.fill("1"); await slider.fill("0"); await seek(phase, local);
    expect(await poses()).toEqual(held);
    const file = info.outputPath(`continuous-${phase}-${local}.png`);
    const buffer = await page.locator('.matrix-card').screenshot({ path: file });
    captures.push({ id: `${phase}-${local}`, label: `Phase ${phase}, ${local}`, progress: (phase - 1 + local) / 6,
      viewport: { width: 1200, height: 950 }, file, dataUrl: `data:image/png;base64,${buffer.toString('base64')}` });
  }
  await seek(1, .55);
  const bracket = page.locator('[data-column-shell="0"] .katex-html .mopen');
  const opacity = Number(await bracket.evaluate(node => getComputedStyle(node).opacity));
  expect(opacity).toBeGreaterThan(0); expect(opacity).toBeLessThan(1);
  await expect(page.locator('[data-kp-comb-key="column-0-0"]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-occurrence="column-0-0"]')).toHaveCSS('opacity', '0');
  await seek(3, .5);
  expect(await bracket.evaluate(node => getComputedStyle(node).transform)).not.toBe('none');
  for (const phase of [4, 5]) {
    await seek(phase, .85);
    await expect(page.locator(`.comb-evaluated > [data-reveal="${phase}"]`).first()).toHaveCSS('opacity', '1');
    const target = page.locator(`[data-kp-comb-key="${phase === 4 ? 'scaled-0-0' : 'sum-0'}"]`);
    await expect(target).toHaveCSS('opacity', '1');
    expect(await target.evaluate(node => getComputedStyle(node).transform)).not.toBe('none');
    await page.getByRole('combobox', { name: 'Milestone' }).selectOption(String(phase));
    await expect(target).toHaveCSS('transform', 'none');
    await expect(page.locator('[data-contributor-occurrence]').filter({ visible: true }).first()).toHaveCSS('opacity', '0');
  }
  await expect(page.locator('.comb-material [data-kp-comb-key]')).toHaveCount(0);
  await expect(page.locator('[data-contributor-occurrence="scaled-0-0:input:0"]')).toHaveAttribute('data-source-id', combination.terms[0]!.pairs[0]!.right.id);
  await expect(page.locator('[data-contributor-occurrence="scaled-0-0:input:1"]')).toHaveAttribute('data-source-id', combination.terms[0]!.pairs[0]!.left.id);
  await expect(page.locator('[data-contributor-occurrence="sum-0:input:0"]')).toHaveAttribute('data-source-id', combination.terms[0]!.entries[0]!.id);
  await expect(page.locator('[data-contributor-occurrence="sum-0:input:0"]')).toHaveAttribute('data-result-id', combination.result.entries[0]!.id);
  await slider.fill('1');
  await expect(page.locator('[data-kp-comb-key="c-0-0"]')).toHaveText('4');
  await expect(page.locator('[data-kp-comb-key="c-1-0"]')).toHaveText('10');
  // Resize must rebuild from untransformed native endpoints, not sampled paint.
  await seek(4, .85); await page.setViewportSize({ width: 1050, height: 950 });
  await expect(page.locator('.comb-stage')).toHaveAttribute('data-progress', '0.6417');
  const resized = await poses(); await slider.fill('0'); await seek(4, .85); expect(await poses()).toEqual(resized);
  expect(errors).toEqual([]);
  const sheet = await page.context().newPage(); await sheet.setViewportSize({ width: 1500, height: 1000 });
  await sheet.setContent(buildKpVisualContactSheetHtml(captures, { title: 'Column continuity candidate', columns: 2, imageFit: 'contain', imageHeightPx: 320 }));
  await sheet.screenshot({ path: info.outputPath('continuity-contact-sheet.png'), fullPage: true }); await sheet.close();
});

for (const input of matrixInputs) test(`source-only ${input.id} preserves correspondence, results and reversible motion`, async ({ page }, info) => {
  // Two full columns and repeated navigation share a machine with other suites;
  // this bounds end-to-end automation, not animation frame time or readiness.
  test.setTimeout(60000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const column of [0, 1]) {
    await page.goto(`${route}?input=${input.id}&column=${column}`);
    await expect(page.locator('#comb-player')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#comb-player')).toHaveAttribute('data-source-id', input.product.id);
    for (const [key, matrix] of [['a', input.product.left], ['b', input.product.right]] as const) {
      for (const row of [0, 1]) for (const col of [0, 1]) {
        await expect(page.locator(`[data-kp-comb-key="${key}-${row}-${col}"]`)).toHaveText(String(numberOf(matrix.rows[row]![col]!)).replace('-', '−'));
      }
    }
    const slider = page.getByRole('slider', { name: 'Animation position' });
    const poses = () => page.locator('.comb-material > span').evaluateAll(nodes => nodes.map(node => {
      const s = getComputedStyle(node); return [s.transform, s.opacity];
    }));
    for (const p of [.1, .4, .55, .64, .73, .8, 1]) {
      await slider.fill(String(p)); const held = await poses();
      await slider.fill('0'); await slider.fill('1'); await slider.fill(String(p)); expect(await poses()).toEqual(held);
    }
    for (const row of [0, 1]) {
      const cell = input.product.cell(row, column);
      await expect(page.locator(`[data-kp-comb-key="c-${row}-${column}"]`)).toHaveText(String(numberOf(cell.result)).replace('-', '−'));
      await expect(page.locator(`[data-kp-comb-key="c-${row}-${column}"]`)).toHaveCSS('opacity', '1');
      for (const term of [0, 1]) {
        const pair = cell.dot.pairs[term]!;
        await expect(page.locator(`[data-contributor-occurrence="scaled-${term}-${row}:input:0"]`)).toHaveAttribute('data-source-id', pair.right.id);
        await expect(page.locator(`[data-contributor-occurrence="scaled-${term}-${row}:input:1"]`)).toHaveAttribute('data-source-id', pair.left.id);
      }
    }
    await page.getByText('Read the calculation', { exact: true }).click();
    await expect(page.locator('.comb-static .katex-mathml annotation')).toHaveCount(1);
    await page.getByRole('combobox', { name: 'Milestone' }).selectOption('3');
    const cells = await page.locator('.comb-expanded > .comb-term').evaluateAll(nodes => nodes.map(node => {
      const shell = node.getBoundingClientRect();
      const open = node.querySelector('.katex-html .mopen')!.getBoundingClientRect();
      const close = node.querySelector('.katex-html .mclose')!.getBoundingClientRect();
      const entries = [...node.querySelectorAll('[data-kp-comb-key]')].map(entry => {
        const box = entry.getBoundingClientRect(); return { left: box.left, right: box.right };
      });
      return { left: shell.left, right: shell.right, openRight: open.right, closeLeft: close.left, entries };
    }));
    expect(cells[0]!.right).toBeLessThanOrEqual(cells[1]!.left);
    for (const cell of cells) for (const entry of cell.entries) {
      expect(entry.left).toBeGreaterThanOrEqual(cell.left - 1);
      expect(entry.right).toBeLessThanOrEqual(cell.right + 1);
      expect(entry.left).toBeGreaterThanOrEqual(cell.openRight - 1);
      expect(entry.right).toBeLessThanOrEqual(cell.closeLeft + 1);
    }
    await slider.fill('0.64');
    await page.locator('.matrix-card').screenshot({ path: info.outputPath(`${input.id}-${column}.png`) });
    await page.getByRole('link', { name: String(column === 0 ? 2 : 1), exact: true }).click();
    await expect(page.locator('#comb-player')).toHaveAttribute('data-source-id', input.product.id);
  }
  expect(errors).toEqual([]);
});

test('accepted motion remains usable on phones, in both themes and reduced motion', async ({ page }) => {
  for (const theme of ['light', 'dark']) {
    await page.goto(`${route}?input=signed`);
    await expect(page.locator('#comb-player')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(value => {
      document.documentElement.dataset['matrixTheme'] = value;
      document.dispatchEvent(new Event('kp-matrix-example-config'));
    }, theme);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('slider', { name: 'Animation position' }).fill('0.64');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto(`${route}?input=zero#scaled`);
  await expect(page.locator('#comb-player')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(page.locator('#comb-player')).toHaveAttribute('data-milestone', 'sum');
  await expect(page.locator('[data-kp-comb-key="sum-0"]')).toHaveCSS('transform', 'none');
  await page.goto(`${route}?input=not-supported`);
  await expect(page.locator('#comb-player')).toHaveAttribute('data-gap', 'true');
});

test("columns and coefficients retain source identity through readable weighted-sum milestones", async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 950 }); await page.goto(route);
  const root = page.locator("#comb-player"); await expect(root).toHaveAttribute("data-ready", "true");
  const chooser = page.getByRole("combobox", { name: "Milestone" });
  const slider = page.getByRole("slider", { name: "Animation position" });
  const captures: KpVisualContactSheetItem[] = [];
  for (let i = 0; i < beats.length; i++) {
    await chooser.selectOption(String(i));
    const file = info.outputPath(`step-${i}.png`);
    const buffer = await page.locator(".matrix-card").screenshot({ path: file });
    captures.push({ id: String(i), label: await root.getAttribute("data-milestone") ?? "", progress: i / (beats.length - 1),
      viewport: { width: 1200, height: 950 }, file, dataUrl: `data:image/png;base64,${buffer.toString("base64")}` });
  }
  for (const [i, expected] of [[0, "4"], [1, "10"]] as const) {
    const native = page.locator(`[data-kp-comb-key="c-${i}-0"]`);
    await expect(native).toHaveText(expected); await expect(native).toHaveCSS("opacity", "1");
    await expect(page.locator(`[data-kp-comb-key="c-${i}-1"]`)).toHaveCSS("opacity", "0");
  }
  for (const term of combination.terms) {
    for (const [i, entry] of term.vector.entries.entries()) {
      await expect(page.locator(`[data-occurrence="column-${term.index}-${i}"]`)).toHaveAttribute("data-source-id", entry.id);
    }
    await expect(page.locator(`[data-occurrence="weight-${term.index}"]`)).toHaveAttribute("data-source-id", env.B.rows[term.index]![0]!.id);
  }
  await expect(page.locator(".comb-material [data-kp-comb-key]")).toHaveCount(0);
  // The scalar is copied once per entry; each occurrence retains its original
  // identity and hands paint back to a native product operand at the endpoint.
  await slider.fill((2.5 / (beats.length - 1)).toFixed(4));
  for (const term of combination.terms) for (const [i, pair] of term.pairs.entries()) {
    const scalarCopy = page.locator(`[data-occurrence="factor-${term.index}-${i}"]`);
    await expect(scalarCopy).toHaveAttribute("data-source-id", pair.right.id);
    await expect(scalarCopy).toHaveCSS("opacity", "1");
    const target = await page.locator(`[data-kp-comb-key="factor-${term.index}-${i}"]`).boundingBox();
    const copy = await scalarCopy.boundingBox();
    expect(Math.abs(copy!.x + copy!.width / 2 - target!.x - target!.width / 2)).toBeLessThan(1);
    expect(Math.abs(copy!.y + copy!.height / 2 - target!.y - target!.height / 2)).toBeLessThan(1);
  }
  for (const term of combination.terms) {
    const copies = await page.locator(`[data-occurrence^="factor-${term.index}-"]`).evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect(); return { top: r.top, bottom: r.bottom };
    }));
    expect(copies[0]!.bottom).toBeLessThan(copies[1]!.top);
  }
  await slider.fill((2.75 / (beats.length - 1)).toFixed(4));
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("scalar-grow-in-place.png") });
  await slider.fill((2.2 / (beats.length - 1)).toFixed(4));
  await expect(page.locator('[data-occurrence="factor-0-0"]')).toHaveCSS("opacity", "0");
  const shrink = await page.locator('[data-kp-comb-key="weight-0"]').evaluate(node => new DOMMatrix(getComputedStyle(node).transform).a);
  expect(shrink).toBeGreaterThan(.4); expect(shrink).toBeLessThan(.6);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("scalar-shrink.png") });
  await chooser.selectOption("2");
  const original = await page.locator('[data-kp-comb-key="column-0-0"]').boundingBox();
  await chooser.selectOption("3");
  const expanded = await page.locator('[data-kp-comb-key="entry-0-0"]').boundingBox();
  expect(Math.abs(original!.y - expanded!.y)).toBeLessThan(1);
  await expect(page.locator(".comb-weighted")).toHaveCSS("opacity", "0");
  await expect(page.locator(".comb-expanded [data-reveal]").first()).toHaveCSS("opacity", "1");
  for (const term of combination.terms) for (const [i, pair] of term.pairs.entries()) {
    await expect(page.locator(`[data-occurrence="factor-${term.index}-${i}"]`)).toHaveCSS("opacity", "0");
    await expect(page.locator(`[data-kp-comb-key="factor-${term.index}-${i}"]`)).toHaveText(String(numberOf(pair.right)));
  }
  for (const p of [0.1, 0.3, 0.9]) {
    await slider.fill(String(p)); await page.locator(".matrix-card").screenshot({ path: info.outputPath(`transit-${p}.png`) });
  }
  const poses = () => page.locator(".comb-paint, .comb-weighted [data-kp-comb-key], .comb-expanded [data-kp-comb-key]").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")));
  const distributionMidpoint = (2.5 / (beats.length - 1)).toFixed(4);
  await slider.fill(distributionMidpoint); const held = await poses();
  await slider.fill("1"); await slider.fill("0"); await slider.fill(distributionMidpoint); expect(await poses()).toEqual(held);
  await slider.press("Home"); await expect(root).toHaveAttribute("data-milestone", "initial");
  await page.getByRole("button", { name: "Next milestone" }).click();
  await expect(page.locator(".comb-stage")).toHaveAttribute("data-progress", String(1 / (beats.length - 1)), { timeout: 5000 });
  await slider.press("End"); await expect(root).toHaveAttribute("data-milestone", "placed");
  await page.setViewportSize({ width: 390, height: 844 }); await chooser.selectOption("5");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
  await page.emulateMedia({ colorScheme: "dark" }); await page.screenshot({ path: info.outputPath("dark.png"), fullPage: true });
  expect(errors).toEqual([]);
  const sheet = await page.context().newPage(); await sheet.setViewportSize({ width: 1500, height: 1000 });
  await sheet.setContent(buildKpVisualContactSheetHtml(captures, { title: "One product · column combinations", columns: 3, imageFit: "contain", imageHeightPx: 300 }));
  await sheet.screenshot({ path: info.outputPath("contact-sheet.png"), fullPage: true }); await sheet.close();
});

test("reduced-motion controls and deep links reach exact states", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto(route + "#weights");
  const root = page.locator("#comb-player"); await expect(root).toHaveAttribute("data-ready", "true");
  await expect(root).toHaveAttribute("data-milestone", "weights");
  await page.getByRole("button", { name: "Next step", exact: true }).click(); await expect(root).toHaveAttribute("data-milestone", "distribute");
  await page.getByRole("button", { name: "Previous milestone" }).click(); await expect(root).toHaveAttribute("data-milestone", "weights");
  await page.getByRole("slider").press("End"); await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(root).toHaveAttribute("data-milestone", "initial");
});

for (const kind of ["identity", "orthonormality"] as const) for (const column of [0, 1]) {
  test(`${kind} column ${column + 1} reuses scalar distribution and places its own result`, async ({ page }, info) => {
    await page.goto(`${route}?example=${kind}&column=${column}#weights`);
    await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
    const chooser = page.getByRole("combobox", { name: "Milestone" });
    const slider = page.getByRole("slider", { name: "Animation position" });
    for (const beat of [2, 3, 4, 6]) {
      await chooser.selectOption(String(beat));
      await page.locator(".matrix-card").screenshot({ path: info.outputPath(`transfer-${beat}.png`) });
    }
    const values = kind === "identity" ? (column === 0 ? [1, 3] : [2, 4]) : (column === 0 ? [1, 0] : [0, 1]);
    for (const [row, value] of values.entries()) {
      await expect(page.locator(`[data-kp-comb-key="c-${row}-${column}"]`)).toHaveText(String(value));
      await expect(page.locator(`[data-kp-comb-key="c-${row}-${column}"]`)).toHaveCSS("opacity", "1");
      await expect(page.locator(`[data-kp-comb-key="c-${row}-${1 - column}"]`)).toHaveCSS("opacity", "0");
    }
    if (kind === "orthonormality") await expect(page.getByRole("region", { name: "Column dot products" })).toContainText("within-tolerance");
    await slider.fill("0.46");
    const poses = () => page.locator(".comb-paint").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")));
    const held = await poses(); await slider.fill("0"); await slider.fill("0.46"); expect(await poses()).toEqual(held);
    await page.setViewportSize({ width: 390, height: 844 });
    await chooser.selectOption("3");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("transfer-phone.png"), fullPage: true });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce", forcedColors: "active" });
    await page.getByRole("button", { name: "Previous milestone" }).click();
    await expect(page.locator("#comb-player")).toHaveAttribute("data-milestone", "weights");
    await page.getByRole("button", { name: "Next step", exact: true }).click();
    await expect(page.locator("#comb-player")).toHaveAttribute("data-milestone", "distribute");
  });
}

test("one host switches every example and result column without changing its URL", async ({ page }, info) => {
  await page.goto("/experiments/matrix-examples/");
  const url = page.url();
  const menu = page.getByRole("combobox", { name: "Example", exact: true });
  const child = page.frameLocator("#example-frame");
  await expect(child.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  for (const kind of ["identity", "orthonormality", "dot", "columns"]) {
    // Switching while playing must retire the previous document and clock.
    await child.getByRole("button", { name: "Play", exact: true }).click();
    const loaded = page.waitForEvent("framenavigated", f => f.parentFrame() !== null && (kind === "dot" ? f.url().includes("matrix-column-product") : f.url().includes(`example=${kind}`)));
    await menu.selectOption(kind);
    await loaded;
    await expect(child.locator(kind === "dot" ? "#matrix-player" : "#comb-player")).toHaveAttribute("data-ready", "true");
    expect(page.url()).toBe(url);
    await expect(page.locator("iframe")).toHaveCount(1);
  }
  const changedColumn = page.waitForEvent("framenavigated", f => f.parentFrame() !== null && f.url().includes("column=1"));
  await page.getByRole("combobox", { name: "Result column" }).selectOption({ value: "1" });
  await changedColumn;
  await expect(child.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  await child.getByRole("combobox", { name: "Milestone" }).selectOption("6");
  await expect(child.locator('[data-kp-comb-key="c-1-1"]')).toHaveCSS("opacity", "1");
  await expect(child.locator('[data-kp-comb-key="c-1-1"]')).toHaveText("8");
  expect(page.url()).toBe(url);
  await page.screenshot({ path: info.outputPath("menu-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("menu-phone.png"), fullPage: true });
});

test("shared configuration reflows the held pose and follows every example", async ({ page }, info) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1500, height: 1050 });
  await page.goto("/experiments/matrix-examples/");
  await page.getByRole('combobox', { name: 'Example', exact: true }).selectOption('columns');
  const child = page.frameLocator("#example-frame");
  await expect(child.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  const slider = child.getByRole("slider", { name: "Animation position" });
  await slider.fill("0.46");
  const held = await slider.inputValue();
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  await page.getByRole("button", { name: "Roomy spacing", exact: true }).click();
  await expect(child.locator("html")).toHaveAttribute("data-matrix-layout", "side");
  await expect(slider).toHaveValue(held);
  const source = await child.locator(".comb-equation").boundingBox();
  const work = await child.locator(".comb-expanded").boundingBox();
  expect(source!.x + source!.width).toBeLessThanOrEqual(work!.x + 1);
  const poses = () => child.locator(".comb-paint").evaluateAll(nodes => nodes.map(n => n.getAttribute("style")));
  const sidePose = await poses();
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  expect(await poses()).toEqual(sidePose);
  await page.getByRole("button", { name: "Step instantly", exact: true }).click();
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.locator("#comb-player")).toHaveAttribute("data-milestone", "distribute");
  await page.screenshot({ path: info.outputPath("config-columns.png"), fullPage: true });
  for (const kind of ["identity", "orthonormality", "dot"]) {
    const loaded = page.waitForEvent("framenavigated", f => f.parentFrame() !== null && (kind === "dot" ? f.url().includes("matrix-column-product") : f.url().includes(`example=${kind}`)));
    await page.getByRole("combobox", { name: "Example", exact: true }).selectOption(kind);
    await loaded;
    await expect(child.locator(kind === "dot" ? "#matrix-player" : "#comb-player")).toHaveAttribute("data-ready", "true");
    await expect(child.locator("html")).toHaveAttribute("data-matrix-layout", "side");
    await expect(child.locator("html")).toHaveAttribute("data-matrix-spacing", "roomy");
    await child.getByRole("button", { name: "Next step", exact: true }).click();
    await child.getByRole("button", { name: "Next step", exact: true }).click();
    await page.screenshot({ path: info.outputPath(`config-${kind}.png`), fullPage: true });
  }
  await child.getByRole("slider").press("End");
  await child.getByRole("button", { name: "Replay", exact: true }).click();
  await expect(child.getByRole("slider")).toHaveValue("0");
  await page.getByRole("button", { name: "Reset settings", exact: true }).click();
  await expect(child.locator("html")).toHaveAttribute("data-matrix-layout", "stacked");
  await expect(child.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(child.getByRole("button", { name: "Next step", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
