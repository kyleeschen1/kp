import { expect, test } from "@playwright/test";

test("canonical reader obeys the continuity profile instead of enabling legacy motifs", async ({ page }) => {
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=553"
  );
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-presentation-recipe",
    "continuity-v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-cancellation-recipe",
    "native-handoff-v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-zero-witness-recipe",
    "none"
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
});
