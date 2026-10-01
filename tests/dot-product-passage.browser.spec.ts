import { expect, test } from "@playwright/test";
import { passage } from "../src/experiments/dot-product-passage/source.ts";

test('beige light mode preserves focus ink and the held geometry', async ({ page }, info) => {
  await page.goto('/experiments/dot-product-passage/');
  await expect(page.locator('#dot-player')).toHaveAttribute('data-ready', 'true');
  const timeline = page.getByRole('slider', { name: 'Animation position' });
  await timeline.fill('0.125');
  const positions = () => page.locator('.dot-paint').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect(), stage = node.closest('.dot-stage')!.getBoundingClientRect();
    return { x: r.x - stage.x, y: r.y - stage.y, width: r.width, height: r.height };
  }));
  const before = await positions();
  await page.getByRole('button', { name: 'Light mode', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await expect(timeline).toHaveValue('0.125');
  expect(await positions()).toEqual(before);
  const paper = await page.locator('.matrix-card').evaluate(node => getComputedStyle(node).backgroundColor);
  await expect(page.locator('body')).toHaveCSS('background-color', paper);
  expect(paper).not.toBe('rgb(32, 34, 34)');
  for (const selector of ['[data-kp-dot-key="pair-left-1"] .dot-negative-sign', '[data-occurrence="pair-left-1"] .dot-negative-sign']) {
    await expect(page.locator(selector)).toHaveCSS('color', 'rgb(17, 17, 15)');
  }
  await page.locator('.matrix-card').screenshot({ path: info.outputPath('beige-light-mode.png') });
  await page.getByRole('button', { name: 'Light mode', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(32, 34, 34)');
  expect(await positions()).toEqual(before);
});

test('math size remeasures native and moving tokens at the held playhead', async ({ page }, info) => {
  await page.goto('/experiments/dot-product-passage/?compare=1');
  const root = page.locator('#dot-player');
  await expect(root).toHaveAttribute('data-ready', 'true');
  const size = root.getByRole('slider', { name: 'Math size' });
  const timeline = root.getByRole('slider', { name: 'Animation position' });
  await expect(size).toHaveValue('20');
  await timeline.fill('0.125');
  for (const value of ['20', '32', '26']) {
    await size.fill(value);
    await expect(timeline).toHaveValue('0.125');
    for (const selector of ['[data-kp-dot-key="left-0"] .mord', '[data-kp-dot-key="pair-left-0"] .mord', '[data-occurrence="pair-left-0"] .mord']) {
      const actual = await root.locator(selector).evaluate(node => parseFloat(getComputedStyle(node).fontSize));
      expect(actual).toBeCloseTo(Number(value), 2);
    }
    const spacings = await root.locator('.dot-inputs').evaluate(inputs => {
      const centers = (side: string) => [...inputs.querySelectorAll(`[data-kp-dot-key^="${side}-"]`)].map(node => {
        const r = node.getBoundingClientRect(); return side === 'left' ? r.x + r.width / 2 : r.y + r.height / 2;
      });
      const gaps = (values: number[]) => values.slice(1).map((v, i) => v - values[i]!);
      return { row: gaps(centers('left')), column: gaps(centers('right')) };
    });
    for (let i = 0; i < spacings.row.length; i++) expect(spacings.column[i]).toBeCloseTo(spacings.row[i]!, 2);
    const pose = () => root.locator('.dot-paint').evaluateAll(nodes => nodes.map(node => node.getAttribute('style')));
    const held = await pose();
    await timeline.fill('1'); await timeline.fill('0'); await timeline.fill('0.125');
    expect(await pose()).toEqual(held);
  }
  await expect(page.locator('#dot-player-second').getByRole('slider', { name: 'Math size' })).toHaveValue('20');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('math-size-26.png') });
});

test('focus lift cannot change scroll extents while narrow stages remain scrollable', async ({ page }) => {
  await page.goto('/experiments/dot-product-passage/');
  await expect(page.locator('#dot-player')).toHaveAttribute('data-ready', 'true');
  const timeline = page.getByRole('slider', { name: 'Animation position' });
  await page.getByRole('slider', { name: 'Lift height' }).fill('24');
  await page.getByRole('slider', { name: 'Math size' }).fill('32');
  const dimensions = () => page.locator('.matrix-scroll').evaluate(node => ({
    width: node.clientWidth, height: node.clientHeight, scrollWidth: node.scrollWidth, scrollHeight: node.scrollHeight,
  }));
  for (const width of [1200, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await timeline.fill('0');
    const initial = await dimensions();
    expect(initial.scrollHeight).toBe(initial.height);
    if (width === 390) expect(initial.scrollWidth).toBeGreaterThan(initial.width);
    else expect(initial.scrollWidth).toBe(initial.width);
    for (const p of [.01, .03, .075, .125, .18, .22, .25, 0]) {
      await timeline.fill(String(p));
      expect(await dimensions()).toEqual(initial);
      const insideStage = await page.locator('.dot-stage').evaluate(stage => {
        const bounds = stage.getBoundingClientRect();
        return [...stage.querySelectorAll('.dot-paint')].filter(node => Number(getComputedStyle(node).opacity) > 0).every(node => {
          const rect = node.getBoundingClientRect();
          return rect.top >= bounds.top && rect.bottom <= bounds.bottom && rect.left >= bounds.left && rect.right <= bounds.right;
        });
      });
      expect(insideStage).toBe(true);
    }
  }
});

test('depth controls change whole groups while preserving endpoint and reverse poses', async ({ page }, info) => {
  await page.goto('/experiments/dot-product-passage/');
  await expect(page.locator('#dot-player')).toHaveAttribute('data-ready', 'true');
  const timeline = page.getByRole('slider', { name: 'Animation position' });
  const opacity = page.getByRole('slider', { name: 'Background opacity' });
  const lift = page.getByRole('combobox', { name: 'Foreground lift' });
  await expect(opacity).toHaveValue('40'); await expect(lift).toHaveValue('on');
  await expect(page.getByRole('combobox', { name: 'Background scale' })).toHaveCount(0);
  await timeline.fill('0.125');
  await expect(page.locator('.dot-inputs')).toHaveCSS('opacity', '0.4');
  for (const bracket of await page.locator('[data-dot-vector]').all()) await expect(bracket).toHaveCSS('opacity', '1');
  for (const token of await page.locator('.dot-paint').all()) await expect(token).toHaveCSS('opacity', '1');
  await expect(page.locator('.dot-inputs')).toHaveCSS('scale', '1');
  for (const group of ['.dot-work', '.dot-material']) await expect(page.locator(group)).toHaveCSS('scale', '1.03');
  const poses = () => page.locator('.dot-stage [style]').evaluateAll(nodes => nodes.map(node => node.getAttribute('style')));
  const held = await poses();
  await expect(page.getByRole('slider', { name: 'Shadow strength' })).toHaveCount(0);
  const heightControl = page.getByRole('slider', { name: 'Lift height' });
  await expect(heightControl).toHaveValue('6');
  for (const selector of ['[data-occurrence="pair-left-1"] .dot-negative-sign', '[data-kp-dot-key="pair-left-1"] .dot-negative-sign']) {
    await expect(page.locator(selector)).toHaveCSS('text-shadow', 'none');
  }
  const y = () => page.locator('[data-occurrence="pair-left-1"]').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42);
  await heightControl.fill('0'); const baseline = await y();
  await heightControl.fill('24'); expect(baseline - await y()).toBeCloseTo(24, 4);
  await heightControl.fill('6'); expect(baseline - await y()).toBeCloseTo(6, 4);
  await timeline.fill('0.075');
  expect(await poses()).toEqual(held);
  await timeline.fill('1'); await timeline.fill('0'); await timeline.fill('0.125');
  expect(await poses()).toEqual(held);
  await page.locator('.matrix-card').screenshot({ path: info.outputPath('depth-40-fixed-background.png') });
  await opacity.fill('20'); await expect(page.locator('.dot-inputs')).toHaveCSS('opacity', '0.2');
  await lift.selectOption('off'); await expect(page.locator('.dot-material')).toHaveCSS('scale', '1');
  await expect(page.locator('.dot-inputs')).toHaveCSS('scale', '1');
  await opacity.fill('40'); await lift.selectOption('on');
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(page.locator('.dot-material')).toHaveCSS('scale', '1.03');
  await timeline.fill('0.25'); await expect(page.locator('.dot-material')).toHaveCSS('scale', '1');
  const bracket = await page.locator('[data-dot-vector="right"]').evaluate(node => {
    const style = getComputedStyle(node, '::before');
    return { width: parseFloat(style.borderLeftWidth), font: parseFloat(getComputedStyle(node).fontSize) };
  });
  expect(bracket.width / bracket.font).toBeLessThan(.09);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await timeline.fill('0.125');
  await expect(page.locator('.dot-inputs')).toHaveCSS('scale', '1');
  await expect(page.locator('.dot-material')).toHaveCSS('scale', '1');
});

test("column pivots as one axis and brackets withdraw only after pairing", async ({ page }, info) => {
  await page.goto("/experiments/dot-product-passage/");
  await expect(page.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  // Isolate the accepted path from the independently tested depth projection.
  await page.getByRole('combobox', { name: 'Foreground lift' }).selectOption('off');
  await page.getByRole('slider', { name: 'Background opacity' }).fill('100');
  await expect(page.getByRole("slider", { name: "Dim unfocused" })).toHaveCount(0);
  const timeline = page.getByRole("slider", { name: "Animation position" });
  const centers = (selector: string) => page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }));
  const source = await centers('[data-kp-dot-key^="right-"]');
  await timeline.fill("0.03");
  const lifted = await centers('[data-occurrence^="pair-right-"]');
  for (let i = 0; i < source.length; i++) {
    expect(lifted[i]!.x).toBeCloseTo(source[i]!.x, 1);
    expect(lifted[i]!.y).toBeLessThan(source[i]!.y);
    expect(source[i]!.y - lifted[i]!.y).toBeCloseTo(source[0]!.y - lifted[0]!.y, 1);
  }
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("column-lift.png") });
  for (const [progress, opacity] of [[.0374, "1"], [.25, "1"], [.34, "0"], [.25, "1"], [0, "1"]] as const) {
    await timeline.fill(String(progress));
    await expect(page.locator(".dot-inputs")).toHaveCSS("opacity", "1");
    for (const bracket of await page.locator("[data-dot-vector]").all()) await expect(bracket).toHaveCSS("opacity", opacity);
  }
  const opacity = () => page.locator('[data-dot-vector]').evaluateAll(nodes => nodes.map(node => Number(getComputedStyle(node).opacity)));
  let previous = 1;
  for (const progress of [.26, .275, .29, .31, .33]) {
    await timeline.fill(String(progress));
    const held = await opacity();
    expect(held[0]).toBeGreaterThan(0); expect(held[0]).toBeLessThan(previous);
    expect(held[1]).toBe(held[0]); previous = held[0]!;
    await timeline.fill('1'); await timeline.fill('0'); await timeline.fill(String(progress));
    expect(await opacity()).toEqual(held);
  }
  for (const progress of [.07, .12, .18, .22]) {
    await timeline.fill(String(progress));
    const [a, b, c] = await centers('[data-occurrence^="pair-right-"]');
    const dx = c!.x - a!.x, dy = c!.y - a!.y;
    expect(Math.abs(dx * (b!.y - a!.y) - dy * (b!.x - a!.x)) / Math.hypot(dx, dy)).toBeLessThan(.1);
    for (const token of await page.locator('[data-occurrence^="pair-right-"]').all()) {
      const rotation = await token.evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).b);
      expect(rotation).toBe(0);
    }
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`column-pivot-${progress}.png`) });
  }
});

test("two players share a renderer while retaining independent state and identity", async ({ page }, info) => {
  await page.goto("/experiments/dot-product-passage/?compare=1");
  const first = page.locator("#dot-player"), second = page.locator("#dot-player-second");
  for (const root of [first, second]) await expect(root).toHaveAttribute("data-ready", "true");
  await expect(page.locator("iframe, .dot-shadow, .dot-plane, [data-glow]")).toHaveCount(0);
  const ids = await page.locator("[id]").evaluateAll(nodes => nodes.map(n => n.id));
  expect(new Set(ids).size).toBe(ids.length);
  const secondInitial = await second.locator(".dot-stage").innerHTML();
  await first.getByRole("combobox", { name: "Milestone" }).selectOption("4");
  await expect(first.locator('[data-kp-dot-key="sum"]')).toHaveText("−3");
  expect(await second.locator(".dot-stage").innerHTML()).toBe(secondInitial);
  await second.getByRole("combobox", { name: "Milestone" }).selectOption("4");
  await expect(second.locator('[data-kp-dot-key="sum"]')).toHaveText("−36");
  const firstIds = await first.locator("[data-source-id]").evaluateAll(nodes => nodes.map(n => n.getAttribute("data-source-id")));
  const secondIds = await second.locator("[data-source-id]").evaluateAll(nodes => nodes.map(n => n.getAttribute("data-source-id")));
  expect(firstIds.some(id => secondIds.includes(id))).toBe(false);
  await first.getByRole("slider", { name: "Animation position" }).fill("0");
  await second.getByRole("slider", { name: "Animation position" }).fill("0.0001");
  for (const side of ["left", "right"]) for (let i = 0; i < 3; i++) {
    const source = await second.locator(`[data-kp-dot-key="${side}-${i}"]`).boundingBox();
    const copy = await second.locator(`[data-occurrence="pair-${side}-${i}"] > span`).boundingBox();
    for (const key of ["x", "y", "width", "height"] as const) expect(Math.abs(copy![key] - source![key])).toBeLessThan(.1);
  }
  await second.getByRole("combobox", { name: "Milestone" }).selectOption("1");
  await first.getByRole("button", { name: "Play", exact: true }).click();
  await expect(first.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(second.getByRole("slider", { name: "Animation position" })).toHaveValue("0.25");
  await first.getByRole("button", { name: "Pause", exact: true }).click();
  expect(new URL(page.url()).hash).toBe("");
  await first.getByRole("combobox", { name: "Milestone" }).selectOption("1");
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(32, 34, 34)");
  await page.screenshot({ path: info.outputPath("two-players.png"), fullPage: true });
});

test("a player can be disposed and remounted without retaining a clock or handlers", async ({ page }) => {
  await page.goto("/experiments/dot-product-passage/");
  await expect(page.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  const result = await page.evaluate(async () => {
    const playerModule = "/src/experiments/dot-product-passage/player.ts";
    const sourceModule = "/src/experiments/dot-product-passage/source.ts";
    const { mountDotPlayer } = await import(/* @vite-ignore */ playerModule);
    const { comparisonPassage } = await import(/* @vite-ignore */ sourceModule);
    const root = document.createElement("div"); root.id = "lifecycle-player"; document.body.append(root);
    const dispose = await mountDotPlayer(root, comparisonPassage);
    let duplicateRejected = false;
    try { await mountDotPlayer(root, comparisonPassage); } catch { duplicateRejected = true; }
    root.querySelector<HTMLButtonElement>("[data-play]")!.click();
    dispose(); dispose();
    const held = root.innerHTML;
    root.querySelector<HTMLButtonElement>("[data-next]")!.click();
    document.dispatchEvent(new Event("kp-matrix-example-config"));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const unchanged = root.innerHTML === held;
    const nextDispose = await mountDotPlayer(root, comparisonPassage);
    const ready = root.dataset["ready"];
    const progress = root.querySelector<HTMLInputElement>("[data-scrub]")!.value;
    nextDispose(); root.remove();
    return { duplicateRejected, unchanged, ready, progress };
  });
  expect(result).toEqual({ duplicateRejected: true, unchanged: true, ready: "true", progress: "0" });
});

test("departure preserves every source token's glyph geometry", async ({ page }) => {
  await page.goto("/experiments/dot-product-passage/");
  await expect(page.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  const timeline = page.getByRole("slider", { name: "Animation position" });
  for (const progress of ["0.0001", "0.2", "0.0001"]) {
    await timeline.fill(progress);
    if (progress === "0.2") continue;
    for (const side of ["left", "right"]) for (let i = 0; i < 3; i++) {
      const source = await page.locator(`[data-kp-dot-key="${side}-${i}"]`).boundingBox();
      const copy = await page.locator(`[data-occurrence="pair-${side}-${i}"] > span`).boundingBox();
      for (const key of ["x", "y", "width", "height"] as const) {
        expect(Math.abs(copy![key] - source![key]), `${side}-${i} ${key}`).toBeLessThan(.1);
      }
    }
  }
  // The same token box must also settle exactly onto its destination, including
  // signed entries, immediately before native ownership resumes.
  for (const progress of ["0.2499"]) {
    await timeline.fill(progress);
    for (const side of ["left", "right"]) for (let i = 0; i < 3; i++) {
      const target = await page.locator(`[data-kp-dot-key="pair-${side}-${i}"]`).boundingBox();
      const copy = await page.locator(`[data-occurrence="pair-${side}-${i}"] > span`).boundingBox();
      for (const key of ["x", "y", "width", "height"] as const) {
        expect(Math.abs(copy![key] - target![key]), `${side}-${i} landed ${key}`).toBeLessThan(.1);
      }
    }
    for (const syntax of await page.locator('[data-kp-dot-key^="syntax-"]').all()) await expect(syntax).toHaveCSS("opacity", "0");
  }
  await expect(page.locator(".dot-plane, .dot-shadow, [data-glow]")).toHaveCount(0);
});

test("signed dot passage preserves references through pairing, products and sum", async ({ page }, info) => {
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto("/experiments/dot-product-passage/");
  const root = page.locator("#dot-player"); await expect(root).toHaveAttribute("data-ready", "true");
  await page.getByRole('combobox', { name: 'Foreground lift' }).selectOption('off');
  await page.getByRole('slider', { name: 'Background opacity' }).fill('100');
  await expect(page.locator("[data-dot-focused]")).toHaveCount(0);
  // Short font delimiters and tall SVG delimiters must not own competing paint.
  const brackets = await page.locator(".dot-inputs [data-dot-vector]").evaluateAll(nodes => nodes.flatMap(node =>
    ["::before", "::after"].map(pseudo => {
      const style = getComputedStyle(node, pseudo);
      return { horizontal: style.borderTopWidth, vertical: pseudo === "::before" ? style.borderLeftWidth : style.borderRightWidth, color: style.borderTopColor };
    })));
  expect(brackets).toHaveLength(4);
  const contextInk = await page.locator(".dot-inputs").evaluate(node => getComputedStyle(node).color);
  for (const bracket of brackets) {
    expect(bracket.color).toBe(contextInk);
    expect(bracket).toEqual(brackets[0]);
    expect(bracket.horizontal).toBe(bracket.vertical);
    expect(parseFloat(bracket.vertical)).toBeGreaterThan(0);
  }
  await page.locator(".dot-inputs").evaluate(node => { (node as HTMLElement).style.color = "rgb(100, 110, 120)"; });
  for (const vector of await page.locator("[data-dot-vector]").all()) {
    expect(await vector.evaluate(node => getComputedStyle(node, "::before").borderLeftColor)).toBe("rgb(100, 110, 120)");
  }
  await page.locator(".dot-inputs").evaluate(node => { (node as HTMLElement).style.color = ""; });
  for (const delimiter of await page.locator(".dot-inputs :is(.mopen, .mclose)").all()) await expect(delimiter).toHaveCSS("visibility", "hidden");
  await expect(page.locator('[data-kp-dot-key="left-0"] .mord')).toHaveCSS("font-weight", "400");
  for (const selector of ['[data-kp-dot-key="left-0"] .mord', '[data-kp-dot-key="pair-left-0"] .mord', '[data-occurrence="pair-left-0"] .mord']) {
    await expect(page.locator(selector)).toHaveCSS('-webkit-font-smoothing', 'antialiased');
  }
  const elementSize = await page.locator('[data-kp-dot-key="left-0"]').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
  const expressionSize = await page.locator('[data-kp-dot-key="pair-left-0"]').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
  expect(elementSize).toBe(expressionSize);
  const negative = page.locator('[data-kp-dot-key="pair-left-1"] .dot-negative-sign');
  await expect(negative).toHaveCSS("font-weight", "400");
  const tokenInk = await page.locator('[data-kp-dot-key="pair-left-1"]').evaluate(node => getComputedStyle(node).color);
  await expect(negative).toHaveCSS("color", tokenInk);
  const signStroke = await negative.evaluate(node => getComputedStyle(node).webkitTextStrokeWidth);
  expect(parseFloat(signStroke)).toBeGreaterThan(0);
  await expect(page.locator('[data-occurrence="pair-left-1"] .dot-negative-sign')).toHaveCSS('-webkit-text-stroke-width', signStroke);
  const signRatio = await negative.evaluate(node => {
    const digit = node.nextElementSibling!;
    return node.getBoundingClientRect().width / digit.getBoundingClientRect().width;
  });
  expect(signRatio).toBeLessThan(1);
  expect(signRatio).toBeGreaterThan(.6);
  for (const vector of await page.locator(".dot-inputs [data-dot-vector]").all()) {
    const offset = await vector.evaluate(node => {
      const outer = node.getBoundingClientRect();
      const entries = [...node.querySelectorAll("[data-kp-dot-key]")].map(entry => entry.getBoundingClientRect());
      const left = getComputedStyle(node, "::before"), right = getComputedStyle(node, "::after");
      return {
        x: (outer.left + parseFloat(left.left) + outer.right - parseFloat(right.right)) / 2 - (Math.min(...entries.map(r => r.left)) + Math.max(...entries.map(r => r.right))) / 2,
        y: (outer.top + parseFloat(left.top) + outer.bottom - parseFloat(left.bottom)) / 2 - (Math.min(...entries.map(r => r.top)) + Math.max(...entries.map(r => r.bottom))) / 2,
      };
    });
    expect(Math.abs(offset.x)).toBeLessThan(.5);
    expect(Math.abs(offset.y)).toBeLessThan(.5);
  }
  await expect(page.locator('[data-kp-dot-key="syntax-multiply-0"]')).toHaveCSS("font-weight", "400");
  await expect(page.locator(".dot-products .dot-plus .katex").first()).toHaveCSS("font-weight", "400");
  const inputBounds = async (side: string) => page.locator(`[data-kp-dot-key^="${side}-"]`).evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }));
  // Orientation is a plane-local invariant, independent of the camera angle.
  await page.locator(".dot-stage").evaluate(node => { (node as HTMLElement).style.transform = "none"; });
  const row = await inputBounds("left"), localColumn = await inputBounds("right");
  expect(Math.max(...row.map(r => r.y)) - Math.min(...row.map(r => r.y))).toBeLessThan(1);
  expect(Math.max(...localColumn.map(r => r.x)) - Math.min(...localColumn.map(r => r.x))).toBeLessThan(1);
  await page.locator(".dot-stage").evaluate(node => { (node as HTMLElement).style.transform = ""; });
  const column = await inputBounds("right");
  expect(column[0]!.y).toBeLessThan(column[1]!.y); expect(column[1]!.y).toBeLessThan(column[2]!.y);
  await expect(page.locator('[data-kp-dot-key="left-1"]')).toHaveText("−1");
  await expect(page.locator('[data-kp-dot-key="right-2"]')).toHaveText("−2");
  const chooser = page.getByRole("combobox", { name: "Milestone" });
  const originalSize = await page.locator('[data-kp-dot-key="right-0"]').boundingBox();
  const slider = page.getByRole("slider", { name: "Animation position" });
  await slider.fill("0");
  await slider.fill("0.06");
  const nativeInk = await page.locator('[data-kp-dot-key="pair-left-0"]').evaluate(node => getComputedStyle(node).color);
  expect(nativeInk).toBe("rgb(255, 250, 240)");
  await expect(page.locator('[data-occurrence="pair-left-0"] .mord')).toHaveCSS("-webkit-text-stroke-color", nativeInk);
  await expect(page.locator('[data-occurrence="pair-left-1"] .dot-negative-sign')).toHaveCSS("color", nativeInk);
  for (const copy of await page.locator(".dot-paint").all()) await expect(copy).toHaveCSS("color", nativeInk);
  await expect(page.locator('[data-occurrence="pair-left-0"] .mord')).toHaveCSS("font-weight", "400");
  const fontsSession = await page.context().newCDPSession(page);
  await fontsSession.send("DOM.enable");
  await fontsSession.send("CSS.enable");
  const fontDocument = await fontsSession.send("DOM.getDocument");
  for (const selector of ['[data-kp-dot-key="left-0"] .mord', '[data-occurrence="pair-left-0"] .mord', '[data-kp-dot-key="syntax-multiply-0"] .mbin', '.dot-products .dot-plus .mord']) {
    await expect(page.locator(selector).first()).toHaveCSS("-webkit-text-stroke-width", "0px");
    const { nodeId } = await fontsSession.send("DOM.querySelector", { nodeId: fontDocument.root.nodeId, selector });
    const { fonts } = await fontsSession.send("CSS.getPlatformFontsForNode", { nodeId });
    expect(fonts.length, selector).toBeGreaterThan(0);
    for (const font of fonts) expect(font.postScriptName, `${selector}: ${JSON.stringify(fonts)}`).not.toContain("Bold");
  }
  await fontsSession.detach();
  const lifted = await page.locator('[data-occurrence="pair-right-0"]').boundingBox();
  expect(lifted!.y + lifted!.height / 2).toBeLessThan(column[0]!.y);
  // Brackets stay at their source while entries depart; no corner docking.
  for (const side of ["left", "right"]) await expect(page.locator(`[data-dot-vector="${side}"]`)).toHaveCSS("transform", "none");
  await expect(page.locator('[data-occurrence="pair-right-0"]')).toHaveCSS("text-shadow", "none");
  await expect(page.locator('[data-occurrence="pair-left-0"]')).toHaveCSS("text-shadow", "none");
  const tiltY = (selector: string) => page.locator(selector).evaluate(node =>
    new DOMMatrixReadOnly(getComputedStyle(node).transform).m13);
  expect(await tiltY(".dot-stage")).toBe(0);
  expect(await tiltY('[data-occurrence="pair-right-0"]')).toBe(0);
  const liftedSize = await page.locator('[data-occurrence="pair-right-0"] > span').boundingBox();
  expect(liftedSize!.width).toBeCloseTo(originalSize!.width, 1);
  expect(liftedSize!.height).toBeCloseTo(originalSize!.height, 1);
  await expect(page.locator(".dot-inputs")).toHaveCSS("opacity", "1");
  expect(await tiltY('[data-occurrence="pair-left-0"]')).toBe(0);
  const bracketScale = await page.locator('[data-dot-vector="right"] .mopen').evaluate(node => {
    const m = new DOMMatrixReadOnly(getComputedStyle(node).transform); return { x: m.a, y: m.d };
  });
  expect(bracketScale.x).toBeGreaterThan(0);
  expect(bracketScale.x).toBe(1); expect(bracketScale.y).toBe(1);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("lift-and-turn.png") });
  const fading = Number(await page.locator('[data-dot-vector="right"]').evaluate(node => getComputedStyle(node).opacity));
  expect(fading).toBe(1);
  await slider.fill("0.2");
  for (const bracket of await page.locator('[data-dot-vector]').all()) {
    const later = Number(await bracket.evaluate(node => getComputedStyle(node).opacity));
    expect(later).toBe(1);
  }
  for (const copy of await page.locator(".dot-paint").all()) await expect(copy).toHaveCSS("opacity", "1");
  await slider.fill("0.2499");
  for (const pair of passage.dot.pairs) {
    const copy = await page.locator(`[data-occurrence="pair-left-${pair.index}"]`).boundingBox();
    const target = await page.locator(`[data-kp-dot-key="pair-left-${pair.index}"]`).boundingBox();
    expect(copy!.x + copy!.width / 2).toBeCloseTo(target!.x + target!.width / 2, 1);
    expect(copy!.y + copy!.height / 2).toBeCloseTo(target!.y + target!.height / 2, 1);
  }
  const columnTop = await page.locator('[data-occurrence="pair-right-0"]').boundingBox();
  const columnBottom = await page.locator('[data-occurrence="pair-right-2"]').boundingBox();
  expect(Math.abs(columnBottom!.y - columnTop!.y)).toBeLessThan(1);
  for (const i of [0, 1, 2, 3, 4]) {
    await chooser.selectOption(String(i));
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`step-${i}.png`) });
  }
  // Addition is introduced only after multiplication, then remains for summation.
  for (const progress of [.25, .3, .4, .5, .65, .75]) {
    await slider.fill(String(progress));
    const visiblePluses = await page.locator(".dot-plus").evaluateAll(nodes => nodes.filter(node => {
      const parent = node.parentElement!;
      return getComputedStyle(parent).opacity === "1" && getComputedStyle(node).opacity === "1" && node.getBoundingClientRect().width > 0;
    }).map(node => node.textContent));
    expect(visiblePluses).toHaveLength(progress <= .5 ? 0 : 2);
    expect(visiblePluses.every(text => text?.includes("+"))).toBe(true);
  }
  await chooser.selectOption("1");
  for (const progress of [.25, .5, .75, 1]) {
    await slider.fill(String(progress));
    const key = progress === .25 ? "pair-left-0" : progress === 1 ? "sum" : "product-0";
    await expect(page.locator(`[data-kp-dot-key="${key}"]`)).toHaveCSS("color", "rgb(255, 250, 240)");
    for (const syntax of await page.locator('[data-kp-dot-key^="syntax-multiply-"]').all()) await expect(syntax).toHaveCSS("color", "rgb(255, 250, 240)");
    for (const delimiter of await page.locator('[data-kp-dot-key^="syntax-open-"], [data-kp-dot-key^="syntax-close-"]').all()) await expect(delimiter).toHaveCSS("color", "rgb(255, 250, 240)");
  }
  await slider.fill("0");
  await expect(page.locator("[data-dot-focused]")).toHaveCount(0);
  await expect(page.locator('[data-kp-dot-key="left-0"]')).toHaveCSS("color", "rgb(208, 208, 203)");
  expect(await page.locator(".dot-inputs").evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m11)).toBe(1);
  await chooser.selectOption("1");
  const settledScale = await page.locator('[data-occurrence="pair-right-0"]').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m11);
  expect(settledScale).toBe(1);
  await expect(page.locator('[data-trace-role="source-trace"]')).toHaveCount(0);
  for (const source of await page.locator(".dot-inputs [data-kp-dot-key]").all()) await expect(source).toHaveCSS("opacity", "0");
  for (const copy of await page.locator(".dot-paint").all()) await expect(copy).toHaveCSS("text-shadow", "none");
  expect(await tiltY('[data-occurrence="pair-right-0"]')).toBe(0);
  for (const operator of await page.locator('[data-kp-dot-key^="syntax-"]').all()) await expect(operator).toHaveCSS("opacity", "0");
  await slider.fill("0.31");
  for (const operator of await page.locator('[data-kp-dot-key^="syntax-"]').all()) await expect(operator).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-kp-dot-key="syntax-multiply-0"]')).toHaveText("⋅");
  await expect(page.locator('[data-kp-dot-key^="syntax-open-"]')).toHaveCount(3);
  await expect(page.locator('[data-kp-dot-key^="syntax-close-"]')).toHaveCount(3);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("multiply-hold.png") });
  const notation = await page.locator(".dot-stage").evaluate(stage => {
    const read = (selector: string) => getComputedStyle(stage.querySelector(selector)!);
    const work = stage.querySelector<HTMLElement>(".dot-work")!;
    return { entry: read('[data-kp-dot-key="left-0"]').fontSize,
      paired: read('[data-kp-dot-key="pair-left-0"]').fontSize,
      ink: read('[data-kp-dot-key="pair-left-0"]').color,
      syntax: ['[data-kp-dot-key="syntax-open-0"]', '[data-kp-dot-key="syntax-close-0"]',
        '[data-kp-dot-key="syntax-multiply-0"]', '.dot-plus'].map(s => read(s).color),
      offsetX: work.offsetLeft + work.offsetWidth / 2 - stage.clientWidth / 2,
      depth: new DOMMatrixReadOnly(getComputedStyle(work).transform).m43 };
  });
  expect(notation.entry).toBe(notation.paired);
  expect(notation.syntax.slice(0, 2)).toEqual([notation.ink, notation.ink]);
  expect(notation.syntax.slice(2)).toEqual([notation.ink, notation.ink]);
  // Check centering in scene coordinates, before the shared camera projection.
  expect(Math.abs(notation.offsetX)).toBeLessThan(1);
  expect(notation.depth).toBe(0);
  // Parentheses shrink after the contents; seeking backward restores that ordering.
  const delayedPose = async () => page.locator('[data-kp-dot-key="syntax-open-0"], [data-kp-dot-key="pair-left-0"]').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { scale: new DOMMatrixReadOnly(style.transform).a, opacity: style.opacity };
  }));
  await slider.fill("0.4106");
  const delayed = await delayedPose();
  expect(delayed[0]!.scale).toBeGreaterThan(delayed[1]!.scale);
  expect(delayed[0]!.scale).toBe(1);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("enclosure-delay.png") });
  await slider.fill("0.4269");
  await expect(page.locator('[data-kp-dot-key="pair-left-0"]')).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-kp-dot-key="syntax-open-0"]')).toHaveCSS("opacity", "1");
  const popPose = await page.locator('[data-kp-dot-key="syntax-open-0"]').evaluate(node => {
    const m = new DOMMatrixReadOnly(getComputedStyle(node).transform); return { x: m.a, y: m.d };
  });
  expect(popPose.y).toBeLessThan(popPose.x);
  expect(popPose.x).toBeLessThan(1);
  const resultWidth = () => page.locator('[data-kp-dot-key="product-0"]').evaluate(node => node.getBoundingClientRect().width);
  const kernelWidth = await resultWidth();
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("parenthesis-pop.png") });
  await slider.fill("0.4383");
  expect(await resultWidth()).toBeCloseTo(kernelWidth, 2);
  await slider.fill("0.4594");
  await expect(page.locator('[data-kp-dot-key="syntax-open-0"]')).toHaveCSS("opacity", "0");
  expect(await resultWidth()).toBeGreaterThan(kernelWidth);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("result-after-pop.png") });
  await slider.fill("1"); await slider.fill("0.4106");
  expect(await delayedPose()).toEqual(delayed);
  const gap = await page.locator(".dot-pairs").evaluate(node => parseFloat(getComputedStyle(node).gap));
  expect(gap).toBeLessThan(8);
  await chooser.selectOption("3");
  // Fusion retains nonzero ink through the handoff, rather than a blank
  // shrink-to-zero interval. Each multiplication remains its own cohort.
  for (const local of [.48, .51, .53, .58]) {
    for (const phase of [1, 3]) {
      const phaseLocal = phase === 1 ? .35 + .65 * local : local;
      await slider.fill(String(Number(((phase + phaseLocal) / 4).toFixed(4))));
      const cohorts = phase === 1 ? passage.dot.pairs.map(pair =>
        [`pair-left-${pair.index}`, `pair-right-${pair.index}`, `syntax-multiply-${pair.index}`, `product-${pair.index}`])
        : [[...passage.dot.pairs.map(pair => `product-${pair.index}`), "sum"]];
      for (const keys of cohorts) {
        const visible = await page.locator(keys.map(key => `[data-kp-dot-key="${key}"]`).join(",")).evaluateAll(nodes => nodes.filter(node => {
          const bounds = node.getBoundingClientRect();
          return getComputedStyle(node).opacity === "1" && bounds.width > 1 && bounds.height > 1;
        }).length);
        expect(visible).toBeGreaterThan(0);
      }
      await page.locator(".matrix-card").screenshot({ path: info.outputPath(`fusion-${phase}-${local}.png`) });
    }
  }
  await chooser.selectOption("4");
  await expect(page.locator('[data-kp-dot-key="sum"]')).toHaveText("−3");
  await expect(page.locator(".dot-sum")).toHaveCSS("opacity", "1");
  for (const pair of passage.dot.pairs) {
    await expect(page.locator(`[data-kp-dot-key="product-${pair.index}"]`)).toHaveAttribute("data-source-id", pair.product.id);
    for (const side of ["left", "right"] as const) {
      await expect(page.locator(`[data-occurrence="pair-${side}-${pair.index}"]`)).toHaveAttribute("data-source-id", pair[side].id);
    }
  }
  await expect(page.locator(".dot-material [data-kp-dot-key]")).toHaveCount(0);
  for (const p of [.03, .08, .14, .18, .25, .29, .43, .57, .78, .94]) {
    await slider.fill(String(p));
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`transit-${p}.png`) });
    // Preserve spacing in scene coordinates. Rotated screen-space rectangles
    // include empty corner wedges; their contact is not a glyph collision.
    await page.locator(".dot-stage").evaluate(node => { (node as HTMLElement).style.transform = "none"; });
    const moving = await page.locator(".dot-paint").evaluateAll(nodes => nodes.filter(n => getComputedStyle(n).opacity === "1").map(n => {
      // Native glyph rectangles still include font whitespace; contacts are
      // diagnostics during transit, not a raster-level collision proof.
      const glyphs = [...n.querySelectorAll(".mord")].map(g => g.getBoundingClientRect());
      if (glyphs.length === 0) throw new Error("Missing native scalar glyph boxes");
      return { left: Math.min(...glyphs.map(r => r.left)), right: Math.max(...glyphs.map(r => r.right)),
        top: Math.min(...glyphs.map(r => r.top)), bottom: Math.max(...glyphs.map(r => r.bottom)) };
    }));
    await page.locator(".dot-stage").evaluate(node => { (node as HTMLElement).style.transform = ""; });
    const contacts = [];
    for (const box of moving) {
      expect(Object.values(box).every(Number.isFinite)).toBe(true);
      expect(box.right).toBeGreaterThan(box.left); expect(box.bottom).toBeGreaterThan(box.top);
    }
    for (let i = 0; i < moving.length; i++) for (let j = i + 1; j < moving.length; j++) {
      const a = moving[i]!, b = moving[j]!;
      if (!(a.right <= b.left + .5 || b.right <= a.left + .5 || a.bottom <= b.top + .5 || b.bottom <= a.top + .5)) contacts.push({ p, i, j, a, b });
    }
    if (contacts.length) await info.attach(`transit-contacts-${p}`, { body: JSON.stringify(contacts), contentType: "application/json" });
    const poses = () => page.locator(".dot-stage [style]").evaluateAll(nodes => nodes.map(n => n.getAttribute("style")));
    const held = await poses(); await slider.fill("0"); await slider.fill("1"); await slider.fill(String(p));
    expect(await poses()).toEqual(held);
  }
  await chooser.selectOption("0");
  await page.getByRole("button", { name: "Next milestone" }).click();
  await expect(page.locator(".dot-stage")).toHaveAttribute("data-progress", "0.25");
  await expect(page.locator('.dot-paint').first()).toHaveCSS("opacity", "0");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
});

test("menu configuration, native endpoints and reduced motion work for the passage", async ({ page }, info) => {
  await page.goto("/experiments/matrix-examples/");
  await page.getByRole("combobox", { name: "Example", exact: true }).selectOption("dot-passage");
  const child = page.frameLocator("#example-frame");
  await expect(child.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Step instantly", exact: true }).click();
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.locator("#dot-player")).toHaveAttribute("data-milestone", "pairs");
  await child.getByRole("slider", { name: "Animation position" }).fill("0.57");
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  await expect(child.getByRole("slider", { name: "Animation position" })).toHaveValue("0.57");
  await expect(child.locator('[data-trace-role="source-trace"]')).toHaveCount(0);
  for (const source of await child.locator(".dot-inputs [data-kp-dot-key]").all()) await expect(source).toHaveCSS("opacity", "0");
  await expect(child.locator('.dot-material [data-trace-role]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("side-layout.png"), fullPage: true });
  await child.getByRole("slider", { name: "Animation position" }).fill("0.2");
  const stageBounds = await child.locator(".dot-stage").boundingBox();
  for (const copy of await child.locator(".dot-paint").all()) {
    const bounds = await copy.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(stageBounds!.y);
  }
  await page.screenshot({ path: info.outputPath("side-tilt.png"), fullPage: true });
  await child.getByRole("slider", { name: "Animation position" }).press("End");
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.getByRole("slider", { name: "Animation position" })).toHaveValue("0");
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.getByRole("button", { name: "Reset settings", exact: true }).click();
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.locator("#dot-player")).toHaveAttribute("data-milestone", "pairs");
  await expect(child.locator("body")).toHaveCSS("background-color", "rgb(32, 34, 34)");
  await expect(child.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.screenshot({ path: info.outputPath("dark-theme.png"), fullPage: true });
  await child.getByRole("slider", { name: "Animation position" }).fill("0.06");
  const darkInk = await child.locator('[data-kp-dot-key="pair-left-0"]').evaluate(node => getComputedStyle(node).color);
  for (const copy of await child.locator(".dot-paint").all()) await expect(copy).toHaveCSS("color", darkInk);
  for (const copy of await child.locator(".dot-paint").all()) await expect(copy).toHaveCSS("text-shadow", "none");
});
