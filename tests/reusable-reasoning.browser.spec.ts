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
  await page.locator("[data-reasoning-reading]").selectOption("compact");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", before!);
  await expect(page.getByText("The denominator 3 is nonzero.", { exact: true })).toBeVisible();
  await page.locator("[data-reasoning-reading]").selectOption("full");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", before!);
  for (const name of ["Predict", "Reconstruct"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("[data-reasoning-answer]")).toBeHidden();
    await page.locator("[data-reasoning-working]").fill("My attempt stays local.");
    await page.getByRole("button", { name: "Compare with the verified answer" }).click();
    await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.constant-quotient");
    await expect(page.locator("[data-reasoning-answer]")).toBeVisible();
    await page.getByRole("button", { name: "Return to reading", exact: true }).click();
    await expect(card).toHaveAttribute("data-kp-reasoning-progress", before!);
  }
  expect(errors).toEqual([]);
});

test("source edit reaches native ink, both readings and practice while invalid drafts retain last valid state", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/reusable-reasoning/");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-kp-reasoning-status", "ready");
  const card = page.locator("[data-kp-reasoning-card]");
  const revision = await root.getAttribute("data-kp-reasoning-revision");
  await page.getByText("Edit source JSON", { exact: true }).click();
  await page.getByRole("button", { name: "Load three-step draft", exact: true }).click();
  await expect(root).toHaveAttribute("data-kp-reasoning-revision", revision!);
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(root).not.toHaveAttribute("data-kp-reasoning-revision", revision!);
  await expect(page.locator("[data-reasoning-title]")).toHaveText("Stop before the final quotient");
  const applied = await root.getAttribute("data-kp-reasoning-revision");
  await page.locator("[data-kp-focus-deck-scrubber]").fill("1");
  await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.constant-product");
  await expect(card.locator(".katex-html:visible").filter({ hasText: "12" }).first()).toBeVisible();
  await card.screenshot({ path: info.outputPath("edited-native-endpoint.png") });
  await page.locator("[data-reasoning-reading]").selectOption("compact");
  await expect(card.locator(".kp-focus-deck__narrative")).toContainText("retain the quotient");
  await page.getByRole("button", { name: "Why does this step work?" }).click();
  await page.locator("[data-reasoning-reading]").selectOption("full");
  await expect(page.locator("[data-kp-focus-deck-scrubber]")).toHaveAttribute("max", "3");
  for (const name of ["Predict", "Reconstruct"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: "Compare with the verified answer" }).click();
    await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.constant-product");
    await expect(page.locator("[data-reasoning-answer]")).toContainText("fraction-solve.step.constant-product");
    await expect(page.locator("[data-reasoning-answer]")).not.toContainText("constant-quotient");
    await page.getByRole("button", { name: "Return to reading", exact: true }).click();
  }
  await page.locator("[data-kp-focus-deck-scrubber]").fill("1.37");
  const position = await card.getAttribute("data-kp-reasoning-progress");
  await page.locator("[data-reasoning-json]").fill("{");
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(page.locator("[data-reasoning-draft-status]")).toContainText("Last valid lesson retained");
  await expect(root).toHaveAttribute("data-kp-reasoning-revision", applied!);
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", position!);
  expect(errors).toEqual([]);
});
