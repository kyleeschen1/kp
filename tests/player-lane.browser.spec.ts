import { test, expect } from "@playwright/test";

const url = process.env["KP_PLAYER_LAB_URL"] ?? "http://127.0.0.1:8013/";
test("two hosts retain independent playback, resize, and release resources on repeated remount", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  const article = page.locator("#article .kp-saddle-player");
  const compact = page.locator("#compact .kp-saddle-player");
  await expect(article).toHaveAttribute("data-renderer", "ready");
  await expect(compact).toHaveAttribute("data-renderer", "ready");
  await expect(article).toHaveAttribute("data-denominator", "4");
  await expect(compact).toHaveAttribute("data-denominator", "8");
  await page.getByRole("slider", { name: "article animation progress" }).fill("0.5");
  await expect(article).toHaveAttribute("data-denominator", "6");
  await expect(compact).toHaveAttribute("data-denominator", "8");
  await page.locator('[data-for="compact"]').getByRole("button", { name: "Reverse" }).click();
  await expect.poll(async () => Number(await compact.getAttribute("data-progress"))).toBeLessThan(1);
  await page.locator('[data-for="compact"]').getByRole("button", { name: "Pause", exact: true }).click();
  await expect(compact).toHaveAttribute("data-playback", "paused");
  await expect(article).toHaveAttribute("data-denominator", "6");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator("#article canvas").evaluate(canvas =>
    canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.width <= 780)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (let iteration = 0; iteration < 3; iteration++) {
    await page.getByRole("button", { name: "Remount both players" }).click();
    await expect(article).toHaveAttribute("data-renderer", "ready");
    await expect(compact).toHaveAttribute("data-renderer", "ready");
    await expect(page.locator(".kp-saddle-player canvas")).toHaveCount(2);
  }
  expect(errors).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("two-hosts.png"), fullPage: true });
});

test("a lost graphics context preserves mathematical text and explicit remount recovers", async ({ page }) => {
  await page.goto(url);
  const article = page.locator("#article .kp-saddle-player");
  await expect(article).toHaveAttribute("data-renderer", "ready");
  await page.locator("#article canvas").evaluate(canvas => {
    if (canvas instanceof HTMLCanvasElement) canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(article).toHaveAttribute("data-renderer", "unavailable");
  await expect(article).toContainText("z = (x² − y²) / 4");
  await expect(article).toContainText("Remount to retry");
  await page.getByRole("button", { name: "Remount both players" }).click();
  await expect(article).toHaveAttribute("data-renderer", "ready");
  await expect(page.locator("#compact .kp-saddle-player")).toHaveAttribute("data-renderer", "ready");
});

test("unavailable WebGL exposes the reason and native equation without pretending a render succeeded", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
        return kind === "webgl2" ? null : Reflect.apply(original, this, [kind, ...args]);
      }
    });
  });
  await page.goto(url);
  await expect(page.locator("#article .kp-saddle-player")).toHaveAttribute("data-renderer", "unavailable");
  await expect(page.locator("#article")).toContainText("WebGL 2 is unavailable");
  await expect(page.locator("#article")).toContainText("z = (x² − y²) / 4");
});
