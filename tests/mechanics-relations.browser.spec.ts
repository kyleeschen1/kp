import { test, expect, type Locator } from "@playwright/test";

const route = "/experiments/mechanics-relations/";
const seek = (input: Locator, seconds: number) => input.evaluate((element: HTMLInputElement, value) => {
  element.value = String(value); element.dispatchEvent(new Event("input", { bubbles: true }));
}, seconds);
test("persistent energy derivation uses native motion and stops at each move", async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await root.locator("[data-derivation-trace]").click();
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session", { timeout: 30000 });
  const slots = () => root.locator("[data-derivation-row]").evaluateAll(rows => rows.map(row => ({ top: (row as HTMLElement).offsetTop, height: row.getBoundingClientRect().height })));
  const initialSlots = await slots();
  expect(initialSlots.reduce((sum, row) => sum + row.height, 0)).toBeLessThan(240);
  await expect(root.locator('[data-trace-role="prospective"]')).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await root.locator("[data-derivation-next]").click();
    await expect.poll(async () => {
      if (errors.length) throw new Error(errors.join("\n"));
      return root.getAttribute("data-move");
    }).toBe(String(i));
    await expect.poll(async () => {
      if (errors.length) throw new Error(errors.join("\n"));
      return Number(await root.getAttribute("data-progress"));
    }).toBeGreaterThan(.05);
    await root.locator("[data-derivation-next]").click();
    await seek(root.locator("input"), .09);
    await expect(root).toHaveAttribute("data-phase", "carry");
    await expect(root).toHaveAttribute("data-algebra-progress", "0");
    await expect(root.locator("[data-derivation-cue]")).toBeHidden();
    await expect(root.locator("[data-derivation-row]")).toHaveCount(4);
    await root.screenshot({ path: info.outputPath(`derivation-${i}-carry.png`) });
    await seek(root.locator("input"), .33);
    await expect(root).toHaveAttribute("data-phase", "orient");
    await expect(root).toHaveAttribute("data-algebra-progress", "0");
    await expect(root.locator("[data-derivation-cue]")).toBeVisible();
    await root.screenshot({ path: info.outputPath(`derivation-${i}-orient.png`) });
    const arrivedTransform = await root.locator("[data-derivation-stage]").evaluate(el => getComputedStyle(el).transform);
    await seek(root.locator("input"), .66);
    expect(await root.locator("[data-derivation-stage]").evaluate(el => getComputedStyle(el).transform)).toBe(arrivedTransform);
    expect(await slots()).toEqual(initialSlots);
    await expect(root.locator("[data-kp-editor-equation-material-layer] [data-kp-equation-material-owner-id]").first()).toBeAttached();
    await root.screenshot({ path: info.outputPath(`derivation-${i}-mid.png`) });
    await seek(root.locator("input"), 1);
    await expect(root.locator("[data-derivation-count]")).toHaveText(`${i + 1} / 3 moves`);
    expect(await root.locator("[data-derivation-replay]").evaluate(el => {
      const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return hit === el || (hit !== null && el.contains(hit));
    })).toBe(true);
    await root.locator("[data-derivation-replay]").click();
    await expect(root).toHaveAttribute("data-progress", "1", { timeout: 10000 });
    await expect(root).toHaveAttribute("data-playing", "false");
    await expect(root).toHaveAttribute("data-move", String(i));
    await root.screenshot({ path: info.outputPath(`derivation-${i}-end.png`) });
  }
  await root.locator("[data-derivation-previous]").click();
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeLessThan(.95);
  await root.locator("[data-derivation-read]").click();
  await expect(root).toHaveAttribute("data-tracing", "false");
  expect(await slots()).toEqual(initialSlots);
  expect(errors).toEqual([]);
});
test("derivation keeps narrow keyboard endpoints and complete print history", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await root.locator("[data-derivation-trace]").click();
  const next = root.locator("[data-derivation-next]");
  await expect(next).toBeEnabled();
  await next.focus();
  await next.press("Enter");
  await expect(root).toHaveAttribute("data-progress", "1");
  await expect(root).toHaveAttribute("data-move", "0");
  await root.screenshot({ path: info.outputPath("derivation-narrow-callout.png") });
  await root.locator("[data-derivation-previous]").click();
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await root.screenshot({ path: info.outputPath("derivation-narrow.png") });
  await page.emulateMedia({ media: "print" });
  for (const row of await root.locator(".energy-derivation-history li").all()) await expect(row).toBeVisible();
});
test("native reading, continuous local control, exact reverse and held prose", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(route);
  const straight = page.locator('[data-episode="straight"]'), turning = page.locator('[data-episode="turning"]');
  await straight.scrollIntoViewIfNeeded();
  await expect(straight).toHaveAttribute("data-enhanced", "true");
  const prose = await straight.locator(".physics-cue").innerText();
  await straight.locator("[data-physics-play]").click();
  await expect.poll(async () => Number(await straight.getAttribute("data-physical-time"))).toBeGreaterThan(.05);
  const time = Number(await straight.getAttribute("data-physical-time"));
  expect(time).toBeLessThan(2);
  await straight.locator("[data-physics-play]").click();
  // Compare the same rendered-text representation: KaTeX also carries hidden
  // MathML/source text, so textContent is not equivalent to innerText.
  await expect.poll(() => straight.locator(".physics-cue").innerText()).toBe(prose);
  await seek(straight.locator("input"), 1);
  const midway = await straight.locator("[data-momentum]").getAttribute("d");
  await expect(straight).toHaveAttribute("data-energy", "2");
  await seek(straight.locator("input"), 2);
  await expect(straight).toHaveAttribute("data-energy", "8");
  await seek(straight.locator("input"), 1);
  await expect(straight.locator("[data-momentum]")).toHaveAttribute("d", midway!);
  await straight.locator("input").press("ArrowLeft");
  expect(Number(await straight.getAttribute("data-physical-time"))).toBeLessThan(1);
  await turning.scrollIntoViewIfNeeded();
  await expect(turning).toHaveAttribute("data-enhanced", "true");
  const slider = turning.locator("input"), box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * .2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .7, box!.y + box!.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(Number(await turning.getAttribute("data-physical-time"))).toBeGreaterThan(.5);
  expect(Number(await turning.getAttribute("data-physical-time"))).toBeLessThan(Math.PI / 2);
  await seek(slider, Math.PI / 4);
  await expect(turning).toHaveAttribute("data-energy", "0.5");
  await expect(turning.locator("[data-physics-description]")).toContainText("(-0.71, 0.71)");
  await turning.screenshot({ path: info.outputPath("turning-intermediate.png") });
  const beforeScroll = await turning.getAttribute("data-physical-time");
  await page.mouse.wheel(0, 150);
  await expect(turning).toHaveAttribute("data-physical-time", beforeScroll!);
  await turning.locator("[data-physics-play]").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(turning).toHaveAttribute("data-playing", "false");
  await page.screenshot({ path: info.outputPath("reading-start.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("source-owned static reading needs no JavaScript", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`http://localhost:8000${route}`);
  await expect(page.locator("h1")).toContainText("momentum");
  await expect(page.locator("[data-particle]")).toHaveCount(2);
  await expect(page.locator('[data-episode="turning"] [data-kp-focus-deck-annotation="physics.momentum"]')).toContainText("(0, 1)");
  await page.goto(`http://localhost:8000${route}static.html`);
  const images = page.locator("figure img");
  await expect(images).toHaveCount(4);
  for (const img of await images.all()) await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: info.outputPath("static-reading.png"), fullPage: true });
  await context.close();
});

test("narrow layout and reduced-motion controls retain explicit endpoints", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const turning = page.locator('[data-episode="turning"]');
  await turning.scrollIntoViewIfNeeded();
  await turning.locator("[data-physics-play]").click();
  await expect(turning).toHaveAttribute("data-physical-time", String(Math.PI / 2));
  await expect(turning).toHaveAttribute("data-playing", "false");
  await turning.locator("[data-physics-reset]").click();
  await expect(turning).toHaveAttribute("data-physical-time", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await turning.screenshot({ path: info.outputPath("narrow-turning.png") });
});

test("the algebraic argument is navigable in both editions without playback", async ({ page }, info) => {
  for (const edition of ["", "static.html"]) {
    await page.goto(route + edition);
    await expect(page.locator("h1")).toHaveText("Force, momentum and energy: how the relationships fit together");
    for (const [label, target] of [["Inspect the substitution", "energy-from-momentum"], ["Inspect the differentiation", "force-to-energy"], ["Inspect the accumulation", "impulse-and-work"]]) {
      await page.getByRole("link", { name: label!, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${target}$`));
      await expect(page.locator(`#${target}`)).toBeAttached();
    }
    await page.getByRole("link", { name: "Back to the relationship map", exact: true }).last().click();
    await expect(page).toHaveURL(/#relationship-map$/);
  }
  await page.goto(route + "#relationship-map");
  await page.locator("#relationship-map").screenshot({ path: info.outputPath("algebraic-map.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Inspect the differentiation", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#force-to-energy").screenshot({ path: info.outputPath("algebraic-reason-narrow.png") });
});
