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
    .toHaveCount(38);
  await expect(main.locator("[data-kp-symbolic-mathematics-group]"))
    .toHaveCount(9);
  await expect(main.locator(
    '[data-kp-transformation-coverage-row="capability.equation.function-wrapping"]'
  )).toContainText("Direct");
  await expect(main.locator(
    '[data-kp-transformation-coverage-row="capability.equation.alternative-logarithm-bases"]'
  )).toContainText("Required evidence is present.");
  await expect(main.getByRole("link", { name: "Generated wrap x with f" }))
    .toHaveAttribute(
      "href",
      "/?artifact=animation.generated.function-wrap.apply-f"
    );
  const rootCases = main.locator(
    '[data-kp-symbolic-case-coverage="capability.equation.radical-inversion"]'
  );
  await expect(rootCases).toContainText("10 edge cases tracked");
  await rootCases.locator("summary").click();
  await expect(rootCases.locator("[data-kp-symbolic-case]"))
    .toHaveCount(10);
  await expect(rootCases).toContainText("Refuse invalid distribution over a sum");
  const search = main.getByRole("searchbox", {
    name: "Operation name, alias, or meaning"
  });
  await search.fill("remove additive zero");
  const result = main.locator(
    '[data-kp-equation-operation="kp.semantic-motion.absorb-additive-identity"]'
  );
  await expect(result).toBeVisible();
  await result.locator("summary").click();
  await expect(result).toContainText("Transform x + 0 = 4 into x = 4");
  await expect(result.locator("pre")).toContainText(
    "npm run discover:equation-operations"
  );
  await expect(main.getByRole("button")).toHaveCount(0);
});
