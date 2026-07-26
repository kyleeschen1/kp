import { expect, test } from "@playwright/test";

test("canonical reader selects counter-orbit cancellation without enabling legacy motifs", async ({ page }) => {
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=500"
  );
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-presentation-recipe",
    "continuity-v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-cancellation-recipe",
    "counter-orbit-v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-zero-witness-recipe",
    "none"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-successor-recipe",
    "counter-convergence-v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-depth-recipe",
    "semantic-depth-v1"
  );
  await expect(stage).not.toHaveAttribute("data-kp-reader-annihilation-phase");
  await expect(stage).not.toHaveAttribute("data-kp-reader-annihilation-witness-readable");
  const witness = page.locator("[data-kp-reader-annihilation-witness]");
  await expect(witness).toHaveCSS("opacity", "0");
  const independentZero = page.locator(
    "[data-kp-reader-independent-zero-witness]"
  );
  await expect(independentZero).toHaveCSS("opacity", "0");
  const guidedPaint = page.locator(
    '[data-kp-native-katex-scene-owner][data-kp-reader-motion-guided="true"]'
  );
  expect(await guidedPaint.count()).toBeGreaterThanOrEqual(4);
  const centers = await guidedPaint.evaluateAll((owners) => owners.map(
    (owner) => {
      const rect = owner.getBoundingClientRect();
      return rect.top + rect.height / 2;
    }
  ));
  expect(Math.max(...centers) - Math.min(...centers)).toBeGreaterThan(12);

  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=620"
  );
  expect(
    await stage.getAttribute("data-kp-reader-independent-zero-phase")
  ).toBeNull();
  expect(
    await stage.getAttribute("data-kp-reader-independent-zero-readable")
  ).toBeNull();
  await expect(independentZero).toHaveCSS("opacity", "0");
  await expect(witness).toHaveCSS("opacity", "0");
});
