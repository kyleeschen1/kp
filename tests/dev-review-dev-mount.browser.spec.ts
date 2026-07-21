import { expect, test } from "@playwright/test";

test("reader mounts the review shell by default in Vite development", async ({ page }) => {
  await page.goto("/reader/solve-x/");
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  const host = page.locator("[data-kp-dev-review-shell]");
  await expect(host.locator("button.launcher")).toBeVisible();
  await host.locator("button.launcher").click();
  await expect(host.locator("textarea")).toBeEnabled();
  await expect(host.locator(".meta")).not.toContainText("State unavailable");
  await expect(host.locator(".route")).toHaveText("/reader/solve-x/");
});
