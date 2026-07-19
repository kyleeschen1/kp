import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("generated concept route mounts, deep-links, navigates, rewinds, and disposes", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  await expect(shell).toBeVisible();
  await expect(page.getByRole("heading", { name: "Solve a linear equation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Keep both sides equal" })).toBeVisible();
  await expect(page).toHaveURL(/route=1.*checkpoint=start/);

  await page.getByRole("link", { name: "Reveal one x" }).click();
  await expect(shell).toHaveAttribute("data-kp-concept-checkpoint", "divide-two");
  await expect(page).toHaveURL(/checkpoint=divide-two/);
  await page.goBack();
  await expect(shell).toHaveAttribute("data-kp-concept-checkpoint", "start");

  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(page.locator("[data-kp-concept-room-shell]")).toHaveCount(0);
});

test("legacy root still loads through the untouched main entrypoint", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Identity Matrix" })).toBeVisible();
  await expect(page.locator("[data-kp-concept-room-shell]")).toHaveCount(0);
});
