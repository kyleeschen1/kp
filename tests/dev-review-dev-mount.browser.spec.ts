import { expect, test } from "@playwright/test";

test("reader mounts the review shell by default in Vite development", async ({ page }) => {
  await page.goto("/reader/solve-x/");
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  const host = page.locator("[data-kp-dev-review-shell]");
  await expect(host.locator("button.launcher")).toBeVisible();
  await host.locator("button.launcher").click();
  await expect(host.locator("textarea")).toBeEnabled();
  await expect(host).toHaveCSS("z-index", "2147483000");
  await expect(host.locator("[role=dialog]")).toHaveCSS("pointer-events", "auto");
  await expect(host.locator("textarea")).toHaveCSS("background-color", "rgb(255, 253, 247)");
  await host.locator("textarea").focus();
  await expect(host.locator("textarea")).toHaveCSS("outline-width", "3px");
  await expect(host.locator("textarea")).toHaveCSS("outline-color", "rgb(31, 99, 113)");
  await expect(host.locator(".meta")).not.toContainText("State unavailable");
  await expect(host.locator(".meta")).toContainText("Type to capture this moment");
  await expect(host.locator(".route")).toBeEmpty();

  // Opening the tool is intentionally capture-free; first input establishes
  // the immutable moment so idle review UI never freezes stale reader state.
  await host.locator("textarea").fill("Check this moment");
  await expect(host.locator(".meta")).toContainText("Locked");
  await expect(host.locator(".route")).toHaveText("/reader/solve-x/");
});
