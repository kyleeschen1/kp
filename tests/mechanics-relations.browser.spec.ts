import { test, expect, type Locator } from "@playwright/test";

const route = "/experiments/mechanics-relations/";
const seek = (input: Locator, progress: number) => input.evaluate((element: HTMLInputElement, value) => {
  element.value = String(value); element.dispatchEvent(new Event("input", { bubbles: true }));
}, progress);
const select = (root: Locator, index: number) => root.locator('[data-derivation-select="' + index + '"]').click();
async function inspect(root: Locator) {
  return root.getByRole("slider", { name: "Selected transition progress" });
}

test("selected proof has one compact transport and a continuously available local scrubber", async ({ page }, info) => {
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await expect(root.locator("[data-derivation-hint]")).toBeVisible();
  await expect(root.getByRole("slider")).toHaveCount(0);
  await expect(root.locator("[data-derivation-cue]")).toBeHidden();
  await expect(root.locator("[data-derivation-global], [data-derivation-checkpoint], [data-derivation-pointer], [data-derivation-scrub]")).toHaveCount(0);
  await root.screenshot({ path: info.outputPath("quiet-reading.png") });
  await root.getByRole("button", { name: "Dismiss hint" }).click();
  await expect(root.locator("[data-derivation-hint]")).toBeHidden();
  await select(root, 0);
  await expect(root).toHaveAttribute("data-playing", "true");
  await expect(root.locator("[data-derivation-local]")).toBeVisible();
  await expect(root.locator("[data-derivation-previous]")).toBeDisabled();
  await expect(root.locator("[data-derivation-count]")).toHaveText("1 / 3");
  await expect(root.locator("[data-derivation-cue] [data-derivation-play]")).toHaveCount(0);
  await expect(root.locator("[data-derivation-play]")).toHaveText("Pause");
  const input = await inspect(root);
  await seek(input, .33);
  await expect(root).toHaveAttribute("data-playing", "false");
  const cue = root.locator("[data-derivation-cue]");
  await expect(cue).toHaveAttribute("aria-label", "Transition from equation 1 to 2");
  const before = await cue.boundingBox();
  await seek(input, .65);
  expect(await cue.boundingBox()).toEqual(before);
  await expect(root.locator("[data-derivation-count]")).toHaveText("1 / 3");
  await root.screenshot({ path: info.outputPath("quiet-selected-transition.png") });
  await root.getByRole("button", { name: "Close explanation" }).click();
  await expect(cue).toBeHidden();
  await expect(root.locator("[data-derivation-select='0']")).toBeFocused();
  await expect(root.getByRole("slider")).toHaveCount(0);
});

test("scope dragging previews without intermediate playback and cancels safely", async ({ page }, info) => {
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await select(root, 0);
  const input = await inspect(root);
  await seek(input, .5);
  const handle = root.getByRole("slider", { name: "Transition scope", exact: true });
  const start = await handle.boundingBox();
  const last = await root.locator("[data-derivation-row='3']").boundingBox();
  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(start!.x + start!.width / 2, last!.y, { steps: 6 });
  await expect(handle).toHaveAttribute("aria-valuenow", "3");
  await expect(root).toHaveAttribute("data-move", "0");
  await expect(root).toHaveAttribute("data-playing", "false");
  await page.mouse.up();
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-playing", "true");
  await seek(input, .33);
  const source = await root.locator("[data-derivation-row='2']").boundingBox();
  const target = await root.locator("[data-derivation-row='3']").boundingBox();
  const bracket = await root.locator("[data-derivation-scope]").boundingBox();
  expect(Math.abs(bracket!.y - source!.y - source!.height / 2)).toBeLessThan(1);
  expect(Math.abs(bracket!.y + bracket!.height - target!.y - target!.height / 2)).toBeLessThan(1);
  await root.screenshot({ path: info.outputPath("quiet-pair-scope.png") });
  const current = await handle.boundingBox();
  await page.mouse.move(current!.x + current!.width / 2, current!.y + current!.height / 2);
  await page.mouse.down();
  await page.mouse.move(current!.x + current!.width / 2, current!.y - 120);
  await handle.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await expect(root).not.toHaveAttribute("data-derivation-dragging", "true");
  await expect(handle).toHaveAttribute("aria-valuenow", "3");
  await expect(root.locator("[data-derivation-cue]")).toBeVisible();
});

test("local playback preserves native phases, replay endpoints and rapid selection", async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  const slots = () => root.locator("[data-derivation-row]").evaluateAll(rows => rows.map(row => ({ top: (row as HTMLElement).offsetTop, height: row.getBoundingClientRect().height })));
  const initial = await slots();
  for (let i = 0; i < 3; i++) {
    if (i === 0) await select(root, i);
    else await root.getByRole("button", { name: "Next transition", exact: true }).click();
    await expect(root).toHaveAttribute("data-move", String(i));
    await expect(root.locator("[data-derivation-count]")).toHaveText(`${i + 1} / 3`);
    await expect(root).toHaveAttribute("data-playing", "true");
    await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeGreaterThan(0);
    expect(Number(await root.getAttribute("data-progress"))).toBeLessThan(.9);
    await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
    const input = await inspect(root);
    await seek(input, .09);
    await expect(root).toHaveAttribute("data-phase", "carry");
    await expect(root).toHaveAttribute("data-algebra-progress", "0");
    await seek(input, .33);
    await expect(root).toHaveAttribute("data-phase", "orient");
    const pose = await root.locator("[data-derivation-stage]").evaluate(el => getComputedStyle(el).transform);
    await seek(input, .66);
    expect(await root.locator("[data-derivation-stage]").evaluate(el => getComputedStyle(el).transform)).toBe(pose);
    await expect(root.locator("[data-kp-editor-equation-material-layer] [data-kp-equation-material-owner-id]").first()).toBeAttached();
    expect(await slots()).toEqual(initial);
    await root.screenshot({ path: info.outputPath("quiet-motion-" + i + ".png") });
    await seek(input, 1);
    await expect(root.locator("[data-derivation-play]")).toHaveText("Replay");
    await root.locator("[data-derivation-play]").click();
    await expect(root).toHaveAttribute("data-progress", "1", { timeout: 10000 });
    await expect(root).toHaveAttribute("data-playing", "false");
    await expect(root.locator("[data-derivation-count]")).toHaveText(`${i + 1} / 3`);
    for (const value of [.8, .2, 0, 1]) {
      await seek(input, value);
      await expect(root).toHaveAttribute("data-progress", String(value));
    }
  }
  await expect(root.locator("[data-derivation-next]")).toBeDisabled();
  await root.getByRole("button", { name: "Previous transition", exact: true }).click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root.locator("[data-derivation-count]")).toHaveText("2 / 3");
  await expect(root).toHaveAttribute("data-playing", "true");
  expect(Number(await root.getAttribute("data-progress"))).toBeLessThan(.9);
  await root.evaluate(el => {
    for (const i of [0, 2, 1, 2, 0]) el.querySelector<HTMLButtonElement>('[data-derivation-select="' + i + '"]')!.click();
  });
  await expect(root).toHaveAttribute("data-move", "0");
  expect(await slots()).toEqual(initial);
  expect(errors).toEqual([]);
});

test("adjacent selections preserve native handoff without an origin flash", async ({ page }) => {
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await select(root, 0);
  const input = await inspect(root);
  for (const next of [1, 2]) {
    await seek(input, 1);
    const result = await root.evaluate((el, index) => new Promise<{ originFlash: boolean; shift: number; settled: boolean }>(resolve => {
      const old = el.querySelector<HTMLElement>('[data-derivation-stage] [data-derivation-target] [data-kp-semantic-entity-id$=".prefix"]')!.getBoundingClientRect();
      const top = el.querySelector("[data-derivation-stage]")!.getBoundingClientRect().top;
      let originFlash = false;
      const observer = new MutationObserver(() => {
        const current = el.querySelector("[data-derivation-stage]")!;
        originFlash ||= current.getBoundingClientRect().top < top - .5;
        if (el.getAttribute("data-move") === String(index)) {
          const fresh = current.querySelector('[data-derivation-source] [data-kp-semantic-entity-id$=".prefix"]')!.getBoundingClientRect();
          observer.disconnect(); clearTimeout(timeout);
          resolve({ originFlash, shift: Math.max(Math.abs(fresh.x - old.x), Math.abs(fresh.y - old.y)), settled: true });
        }
      });
      observer.observe(el, { subtree: true, attributes: true, childList: true });
      const timeout = setTimeout(() => { observer.disconnect(); resolve({ originFlash, shift: 999, settled: false }); }, 10000);
      el.querySelector<HTMLButtonElement>('[data-derivation-select="' + index + '"]')!.click();
    }), next);
    expect(result.settled).toBe(true);
    expect(result.originFlash).toBe(false);
    expect(result.shift).toBeLessThan(.5);
  }
});

test("narrow keyboard selection, reduced motion, scrolling and print retain the argument", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await select(root, 0);
  await expect(root).toHaveAttribute("data-progress", "1");
  const handle = root.getByRole("slider", { name: "Transition scope", exact: true });
  await handle.focus(); await handle.press("End");
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", "1");
  await root.screenshot({ path: info.outputPath("quiet-narrow.png") });
  const input = await inspect(root);
  await input.press("Home"); await expect(root).toHaveAttribute("data-progress", "0");
  await input.press("End"); await expect(root).toHaveAttribute("data-progress", "1");
  await page.mouse.wheel(0, 100);
  await expect(root).toHaveAttribute("data-progress", "1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ media: "print" });
  for (const row of await root.locator("[data-derivation-row]").all()) await expect(row).toBeVisible();
  await expect(root.locator("[data-derivation-notes]")).toBeVisible();
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
