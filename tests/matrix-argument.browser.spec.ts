import { test, expect, type Page } from "@playwright/test";

const url = "/experiments/matrix-column-combinations/?argument=1";
const panel = (page: Page, id: string) => page.locator(`[data-inspection="${id}"]`);
const trigger = (page: Page, id: string) => page.locator(`[data-inspect="${id}"]`);
async function open(page: Page, id: string) {
  await trigger(page, id).click(); await expect(panel(page, id)).toHaveAttribute("data-ready", "true");
}
async function seek(page: Page, id: string, value: number) {
  await panel(page, id).locator("[data-scrub]").evaluate((node, value) => {
    const input = node as HTMLInputElement; input.value = String(value); input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

test("the complete argument precedes optional, lazily mounted native inspections", async ({ page }, info) => {
  const requests: string[] = []; page.on("request", request => requests.push(request.url()));
  await page.goto(url); await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("[data-argument-section]")).toHaveCount(4);
  await expect(page.getByText("You can recover a relation, but not a unique input", { exact: true })).toBeVisible();
  await expect(page.locator("[data-argument-section] > .kp-article-math math")).toHaveCount(9);
  expect(requests.some(url => /\/(comparison-player|comparison-view|player|presentation)\.ts/.test(url))).toBe(false);
  await expect(page.locator(".comb-material, .comparison-material")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("argument.png"), fullPage: true });
  await open(page, "lost-change");
  await expect(panel(page, "lost-change").locator(".comparison-copy")).toHaveCount(14);
  await seek(page, "lost-change", .637);
  await expect(panel(page, "lost-change")).toHaveAttribute("data-progress", "0.637");
  expect(page.url()).toContain("?argument=1"); expect(new URL(page.url()).hash).toBe("");
  await panel(page, "lost-change").screenshot({ path: info.outputPath("inspection.png") });
  await panel(page, "lost-change").getByRole("button", { name: "Return to the argument" }).click();
  await expect(trigger(page, "lost-change")).toBeFocused();
  await expect(page.locator(".comparison-copy")).toHaveCount(0);
  await open(page, "lost-change");
  await expect(panel(page, "lost-change")).toHaveAttribute("data-progress", "0.637");
});

test("switching inspections releases the previous player and restores exact independent positions", async ({ page }) => {
  await page.goto(url); await open(page, "column-weights");
  await seek(page, "column-weights", .436);
  await open(page, "lost-change"); await seek(page, "lost-change", .73);
  await expect(panel(page, "column-weights")).toBeHidden();
  await expect(page.locator(".comb-material")).toHaveCount(0);
  await open(page, "surviving-change"); await seek(page, "surviving-change", 1);
  await expect(page.locator(".comparison-stage")).toHaveCount(1);
  await expect(panel(page, "surviving-change")).toHaveAttribute("data-step", "output-change");
  await open(page, "lost-change"); await expect(panel(page, "lost-change")).toHaveAttribute("data-progress", "0.73");
  await open(page, "column-weights"); await expect(panel(page, "column-weights").locator("[data-scrub]")).toHaveValue("0.436");
  await panel(page, "column-weights").locator("[data-scrub]").focus(); await page.keyboard.press("Escape");
  await expect(trigger(page, "column-weights")).toBeFocused();
  await expect(page.locator(".comb-material, .comparison-material")).toHaveCount(0);
});

test("closing or switching during loading cannot install a stale inspection", async ({ page }) => {
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/comparison-player.ts*", async route => { await gate; await route.continue(); });
  await page.goto(url); await trigger(page, "lost-change").click();
  await expect(panel(page, "lost-change")).toHaveAttribute("aria-busy", "true");
  await panel(page, "lost-change").getByRole("button", { name: "Return to the argument" }).click();
  await open(page, "column-weights");
  release();
  await page.waitForResponse(response => response.url().includes("/comparison-player.ts"));
  await expect(panel(page, "lost-change")).toBeHidden();
  await expect(page.locator(".comparison-stage")).toHaveCount(0);
  await expect(panel(page, "column-weights")).toHaveAttribute("data-ready", "true");
});

test("phone reading, reduced motion and return anchoring retain the claim", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url + "#same-output");
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const button = trigger(page, "lost-change"); await button.scrollIntoViewIfNeeded();
  const before = (await button.boundingBox())!.y;
  await open(page, "lost-change");
  await panel(page, "lost-change").getByRole("button", { name: "Next", exact: true }).click();
  await expect(panel(page, "lost-change")).toHaveAttribute("data-progress", "0.2");
  await page.screenshot({ path: info.outputPath("phone-inspection.png"), fullPage: true });
  await panel(page, "lost-change").getByRole("button", { name: "Return to the argument" }).click();
  expect(Math.abs((await button.boundingBox())!.y - before)).toBeLessThan(2);
  await expect(button).toBeFocused();
  expect(new URL(page.url()).hash).toBe("#same-output");
  await open(page, "lost-change");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await expect(page.locator(".comparison-copy")).toHaveCount(0);
});
