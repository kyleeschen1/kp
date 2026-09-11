import { expect, test, type Page } from "@playwright/test";
const route = "/experiments/kinetic-figure/gradient-contour/";
const deck = "[data-kp-focus-deck-id=gradient-contour]";
async function seek(page: Page, step: number) {
  await page.locator("[data-kp-focus-deck-scrubber]").evaluate((element, position) => {
    (element as HTMLInputElement).value = String(position); element.dispatchEvent(new Event("input", { bubbles: true }));
  }, step);
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", String(step));
}
async function paint(page: Page) {
  return page.locator(".gradient-overlay").innerHTML();
}
test("primary visual checkpoint: one canonical surface, six reversible stops and coherent controls", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route); await expect(page.locator(deck)).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await expect(page.locator(".graph-webgl")).toHaveAttribute("data-kp-surface-contour-capability", "ready");
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.screenshot({ path: info.outputPath("01-surface.png"), fullPage: true });
  const samples = await page.locator(deck).evaluate(async element => {
    const states: number[] = [];
    const observer = new MutationObserver(() => states.push(Number((element as HTMLElement).dataset["gradientStep"])));
    observer.observe(element, { attributes: true, attributeFilter: ["data-gradient-step"] });
    element.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!.click();
    await new Promise(resolve => setTimeout(resolve, 2100)); observer.disconnect(); return states;
  });
  expect(samples.some(position => position > 0 && position < 1)).toBe(true);
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "1");
  await expect(page.locator("[data-gradient-count]")).toHaveText("2 / 6");
  for (const step of [1.5, 3, 4, 5]) {
    await seek(page, step);
    await expect(page.locator("[data-gradient-height]")).toHaveText("1.50");
    await page.screenshot({ path: info.outputPath(`step-${step}.png`), fullPage: true });
  }
  await expect(page.locator("[data-gradient-rate]")).toHaveText("2.83");
  const end = await paint(page); await seek(page, 2.71); await seek(page, 5); expect(await paint(page)).toEqual(end);
  await seek(page, 0);
  const slider = page.locator("[data-kp-focus-deck-scrubber]");
  await slider.focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await page.locator(deck).getAttribute("data-gradient-step"))).toBeGreaterThan(0);
  await page.keyboard.press("ArrowLeft"); await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "0");
  const viewport = page.locator("[data-kp-focus-deck-viewport]"); const box = (await viewport.boundingBox())!;
  // Mouse text selection is preserved; drag the passage's blank lower margin.
  const dragY = box.y + box.height - 20;
  await page.mouse.move(box.x + box.width * .8, dragY); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .2, dragY, { steps: 10 });
  const middle = Number(await page.locator(deck).getAttribute("data-gradient-step")); expect(middle).toBeGreaterThan(0); expect(middle).toBeLessThan(1);
  await page.mouse.up(); await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "1");
  await page.mouse.move(box.x + box.width * .25, dragY); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .85, dragY, { steps: 10 }); await page.mouse.up();
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "0");
  expect(errors).toEqual([]);
});

test("phone and reduced motion retain readable evidence and exact stopping points", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route); await expect(page.locator(deck)).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator("[data-kp-focus-deck-scrubber]").focus(); await page.keyboard.press("End");
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "5");
  await expect(page.locator("[data-gradient-count]")).toHaveText("6 / 6");
  await expect(page.locator("[data-gradient-rate]")).toHaveText("2.83");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = (await page.locator(deck).boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  const overflow = await page.locator("[data-kp-focus-deck-beat]").evaluateAll(elements => Math.max(...elements.map(e => e.scrollHeight - e.clientHeight)));
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath("phone-uphill.png"), fullPage: true });
  await page.keyboard.press("Home"); await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "0");
});

test("reference retains its own native surface, contour identity and level control", async ({ page }, info) => {
  await page.goto("/experiments/kinetic-figure/surface-contour/#beat.find-the-intersection");
  await expect(page.locator(".graph-webgl")).toHaveAttribute("data-kp-surface-contour-capability", "ready");
  await page.screenshot({ path: info.outputPath("reference-intersection.png"), fullPage: true });
  await page.goto("/experiments/kinetic-figure/surface-contour/#beat.read-the-map");
  const reference = page.locator("[data-kp-surface-contour-deck]");
  await expect(reference).toHaveAttribute("data-kp-surface-contour-active-beat", "read-the-map");
  await expect(reference.locator("[data-kp-semantic-identity='identity.calculus.surface-contour.same-level-set']")).toHaveCount(1);
  const level = reference.locator("[data-kp-surface-contour-level]"); await expect(level).toBeEnabled(); await level.fill("2.4");
  await expect(reference.locator("[data-kp-surface-contour-stage]")).toHaveAttribute("data-kp-surface-contour-current-level", "2.4000");
  await expect(page.locator(".gradient-overlay")).toHaveCount(0);
});
