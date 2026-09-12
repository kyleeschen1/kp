import { expect, test, type Page } from "@playwright/test";
const route = "/experiments/mechanics-motion/";
const card = "[data-kp-focus-deck]";
async function seek(page: Page, step: number) {
  await page.locator("[data-kp-focus-deck-scrubber]").evaluate((element, value) => {
    (element as HTMLInputElement).value = String(value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, step);
  await expect(page.locator(card)).toHaveAttribute("data-motion-step", String(step));
}
test("four correspondence stops agree with the checked record", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(route);
  await expect(page.locator(card)).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  // Flow labels must not inherit the shared overlay's absolute-position anchor.
  for (const row of await page.locator(".motion-stage-heading").all()) {
    const bounds = await row.locator(".kp-focus-deck__annotation").evaluateAll(elements => elements.map(el => {
      const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    }));
    expect(bounds[0]!.right <= bounds[1]!.left || bounds[0]!.bottom <= bounds[1]!.top).toBe(true);
  }
  for (let step = 0; step < 4; step++) {
    await seek(page, step);
    await expect(page.locator("[data-motion-count]")).toHaveText(`${step + 1} / 4`);
    await page.locator(card).screenshot({ path: info.outputPath(`stop-${step}.png`) });
  }
  await seek(page, 1);
  const point = await page.locator("[data-motion-point]").getAttribute("cx");
  const graphTime = await page.locator("[data-motion-graph-point]").getAttribute("cx");
  await seek(page, 2);
  expect(await page.locator("[data-motion-point]").getAttribute("cx")).toBe(point);
  expect(await page.locator("[data-motion-graph-point]").getAttribute("cx")).not.toBe(graphTime);
  await expect(page.locator("[data-motion-stage]")).toHaveAttribute("data-motion-origin", "0");
  await seek(page, 0);
  await expect(page.locator("[data-motion-stage]")).toHaveAttribute("data-motion-time", "0");
  expect(errors).toEqual([]);
});
test("buttons and keyboard show intermediate motion; horizontal gestures can reverse", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  await page.locator("[data-kp-focus-deck-next]").click();
  await expect.poll(async () => Number(await page.locator(card).getAttribute("data-motion-step"))).toBeGreaterThan(.1);
  expect(Number(await page.locator(card).getAttribute("data-motion-step"))).toBeLessThan(1);
  await expect(page.locator(card)).toHaveAttribute("data-motion-step", "1");
  await page.locator("[data-kp-focus-deck-next]").press("ArrowLeft");
  await expect(page.locator(card)).toHaveAttribute("data-motion-step", "0");
  await seek(page, 2);
  await page.locator("[data-motion-stage]").hover();
  await page.mouse.wheel(-240, 0);
  await expect.poll(async () => Number(await page.locator(card).getAttribute("data-motion-step"))).toBeLessThan(2);
});
test("phone reading stays inside the card and reduced motion reaches exact stops", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  for (let step = 0; step < 4; step++) {
    await seek(page, step);
    expect(await page.locator(".motion-reading").evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.locator("[data-kp-focus-deck-previous]").click();
  await expect(page.locator(card)).toHaveAttribute("data-motion-step", "2");
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
});
test("whole card fits a viewport and stays stable across all beats", async ({ page }, info) => {
  for (const [width, height] of [[1280, 720], [390, 667], [320, 568]]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.goto(`${route}#motion-app`);
    await expect(page.locator(card)).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
    let firstHeight: number | undefined;
    for (let step = 0; step < 4; step++) {
      await seek(page, step);
      const box = (await page.locator(card).boundingBox())!;
      expect(box.height, `card at ${width}×${height}, stop ${step}`).toBeLessThanOrEqual(height! - 8);
      firstHeight ??= box.height;
      expect(box.height).toBeCloseTo(firstHeight, 1);
      const reading = page.locator('[data-motion-active="true"]');
      expect(await reading.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
      await expect(reading).toHaveAttribute("aria-hidden", "false");
    }
    await page.locator(card).screenshot({ path: info.outputPath(`card-${width}.png`) });
  }
});
test("enlarged text remains readable in document flow instead of clipping to a card budget", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 });
  await page.goto(route);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  for (let step = 0; step < 4; step++) {
    await seek(page, step);
    const passage = page.locator('[data-motion-active="true"]');
    expect(await passage.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-kp-focus-deck-next]')).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
