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
test("seven stops agree with the checked record and preserve the point during relabeling", async ({ page }, info) => {
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
  for (let step = 0; step < 7; step++) {
    await seek(page, step);
    await expect(page.locator("[data-motion-count]")).toHaveText(`${step + 1} / 7`);
    await page.screenshot({ path: info.outputPath(`stop-${step}.png`), fullPage: true });
  }
  await seek(page, 3);
  const point = await page.locator("[data-motion-point]").getAttribute("cx");
  await seek(page, 4);
  expect(await page.locator("[data-motion-point]").getAttribute("cx")).toBe(point);
  await expect(page.locator("[data-motion-stage]")).toHaveAttribute("data-motion-origin", "3");
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
  for (let step = 0; step < 7; step++) {
    await seek(page, step);
    expect(await page.locator(".motion-reading").evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.locator("[data-kp-focus-deck-previous]").click();
  await expect(page.locator(card)).toHaveAttribute("data-motion-step", "5");
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
});
