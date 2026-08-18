import { expect, test } from "@playwright/test";

test("coverage route renders one compact ordered capability list", async ({
  page
}) => {
  await page.goto("/?view=coverage");

  const main = page.getByRole("main", { name: "Transformation coverage" });
  await expect(main).toBeVisible();
  await expect(main.getByRole("heading", {
    level: 3,
    name: "Transformation coverage"
  })).toBeVisible();
  await expect(main.locator("[data-kp-transformation-coverage-row]"))
    .toHaveCount(28);
  await expect(main.locator(
    '[data-kp-transformation-coverage-row="capability.equation.function-wrapping"]'
  )).toContainText("Direct");
  await expect(main.locator(
    '[data-kp-transformation-coverage-row="capability.equation.alternative-logarithm-bases"]'
  )).toContainText("7 remaining");
  await expect(main.getByRole("link", { name: "Generated wrap x with f" }))
    .toHaveAttribute(
      "href",
      "/?artifact=animation.generated.function-wrap.apply-f"
    );
  await expect(main.getByRole("button")).toHaveCount(0);
});
