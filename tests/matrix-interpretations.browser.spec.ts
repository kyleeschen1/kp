import { expect, test } from "@playwright/test";
import { buildKpVisualContactSheetHtml, type KpVisualContactSheetItem } from "../scripts/capture-visual-contact-sheet.ts";
import { env, combination, beats, numberOf } from "../src/experiments/matrix-column-combinations/model.ts";

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
