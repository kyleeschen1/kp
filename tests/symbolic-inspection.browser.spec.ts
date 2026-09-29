import { expect, test } from "@playwright/test";

const route = "/experiments/authoring-distribution-focus-card/";
test("inspection is opt-in and preserves canonical seek and reverse", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto(route);
  const card = page.locator('[data-kp-authoring-distribution-card="ready"]');
  await expect(card).toBeVisible();
  expect(requests.some(url => url.includes("inspection-bridge"))).toBe(false);
  await expect(page.locator("[data-kp-symbolic-inspection]")).toHaveCount(0);
  await page.goto(route + "?inspection=true");
  await expect(page.locator('[data-kp-symbolic-inspection="ready"]')).toBeVisible();
  await expect(card).toBeVisible();
  for (const progress of [0, .5, 1, .5, 0]) {
    await card.locator("[data-kp-focus-deck-scrubber]").fill(String(progress));
    await expect(card).toHaveAttribute("data-kp-distribution-progress", String(progress));
    await expect(card.locator("[data-kp-reader-canonical-paint-owner]")).toHaveAttribute("data-kp-reader-canonical-paint-owner", "true");
  }
});
