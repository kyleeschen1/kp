import { test, expect } from "@playwright/test";

test("reasoning exemplar mounts canonical native ink and returns to interrupted parent position", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/reusable-reasoning/");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-kp-reasoning-status", "ready");
  const card = page.locator("[data-kp-reasoning-card]");
  await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.factored");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(card.locator(".kp-focus-deck__narrative p").first()).toHaveCSS("font-family", /^Georgia,/);
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  await slider.fill("0.37");
  const before = await card.getAttribute("data-kp-reasoning-progress");
  await page.getByRole("button", { name: "Why does this step work?" }).click();
  await expect(root).toHaveAttribute("data-kp-reasoning-view", "reason");
  await expect(slider).toHaveAttribute("max", "4");
  await expect(page.getByText("The denominator 3 is nonzero.")).toBeVisible();
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.distributed");
  await card.screenshot({ path: info.outputPath("reason-distribution.png") });
  await page.getByRole("button", { name: "Return to the argument" }).click();
  await expect(root).toHaveAttribute("data-kp-reasoning-view", "parent");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", before!);
  await card.screenshot({ path: info.outputPath("parent-return.png") });
  expect(errors).toEqual([]);
});
