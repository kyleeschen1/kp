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
    "independent-zero-v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-successor-recipe",
    "native-handoff-v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-depth-recipe",
    "flat-v1"
  );
  await expect(stage).not.toHaveAttribute("data-kp-reader-annihilation-phase");
  await expect(stage).not.toHaveAttribute("data-kp-reader-annihilation-witness-readable");
  const witness = page.locator("[data-kp-reader-annihilation-witness]");
  await expect(witness).toHaveCSS("opacity", "0");
  const independentZero = page.locator(
    "[data-kp-reader-independent-zero-witness]"
  );
  await expect(independentZero).toHaveCSS("opacity", "0");

  const plusThree = page.locator(
    '[data-kp-reader-equation-material-fragment-id*="after-subtract.lhs.plus3"]'
  );
  const minusThree = page.locator(
    '[data-kp-reader-equation-material-fragment-id*="after-subtract.lhs.minus3"]'
  );
  await expect(plusThree).toBeVisible();
  await expect(minusThree).toBeVisible();
  const plusBounds = await plusThree.boundingBox();
  const minusBounds = await minusThree.boundingBox();
  expect(plusBounds).not.toBeNull();
  expect(minusBounds).not.toBeNull();
  const plusCenterY = plusBounds!.y + plusBounds!.height / 2;
  const minusCenterY = minusBounds!.y + minusBounds!.height / 2;
  expect(plusCenterY).toBeLessThan(minusCenterY);
  expect(minusCenterY - plusCenterY).toBeGreaterThan(12);

  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=620"
  );
  await expect(stage).toHaveAttribute("data-kp-reader-independent-zero-phase", "dwell");
  await expect(stage).toHaveAttribute("data-kp-reader-independent-zero-readable", "true");
  await expect(independentZero).toHaveCSS("opacity", "1");
  await expect(independentZero).toContainText("+0");
  await expect(witness).toHaveCSS("opacity", "0");
});
