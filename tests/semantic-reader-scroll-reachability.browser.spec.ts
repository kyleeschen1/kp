import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 }
]) {
  test(`global scroll reaches both semantic endpoints at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/reader/solve-x/");
    await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", /\d+/);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "1000");
    await expect(page.locator(
      '[data-kp-reader-native="target"] ' +
      '[data-kp-reader-selector-id="equation.linear-solve.solved.rhs.4"]'
    )).toHaveCSS("opacity", "1");

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "0");
  });
}
