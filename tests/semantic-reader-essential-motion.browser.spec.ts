import { expect, test } from "@playwright/test";

test("system reduced motion retains algebraic causality without flourish", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=553"
  );
  const body = page.locator("body");
  await expect(body).toHaveAttribute("data-kp-reader-motion-preference", "system");
  await expect(body).toHaveAttribute("data-kp-reader-motion-mode", "essential");
  await expect(body).toHaveAttribute("data-kp-reader-progress", "553");

  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-annihilation-witness-readable",
    "true"
  );
  const witness = page.locator("[data-kp-reader-annihilation-witness]");
  await expect(witness).toHaveCSS("filter", "none");
  const movingFragments = page.locator(
    '[data-kp-reader-equation-material-owner-id="material-owner.left-inverses-cancel"] ' +
    "[data-kp-reader-equation-material-fragment-id]"
  );
  const transforms = await movingFragments.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLElement).style.transform)
  );
  expect(transforms).toHaveLength(2);
  expect(transforms.every((transform) => !transform.includes("translate(0px, 0px)")))
    .toBe(true);
});
