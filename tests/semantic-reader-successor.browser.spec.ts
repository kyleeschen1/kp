import { expect, test } from "@playwright/test";

test("solve-x clears the focal lane before continuant reflow", async ({ page }) => {
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=833"
  );
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-continuant-recipe",
    "transit-then-reflow-v1"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-reader-equation-persistent-reflow-progress"
  ))).toBe(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-reader-equation-focal-transit-progress"
  ))).toBeGreaterThan(0);
});

test("constant inputs converge before the derived four takes ownership", async ({ page }) => {
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=933"
  );
  const owner = page.locator(
    '[data-kp-reader-equation-material-owner-id="material-owner.constants-merge"]'
  );
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "933");
  await expect(owner).toBeAttached();
  await expect(page.locator("[data-kp-reader-equation-stage]"))
    .toHaveAttribute("data-kp-reader-equation-successor-recipe", "counter-convergence-v1");
  const fragmentIds = await owner.locator(
    "[data-kp-reader-equation-material-fragment-id]"
  ).evaluateAll((elements) => elements.map(
    (element) => (element as HTMLElement).dataset["kpReaderEquationMaterialFragmentId"]
  ));
  expect(fragmentIds).toContain("anchor.equation.linear-solve.solved.rhs.4");
  const derived = owner.locator(
    '[data-kp-reader-equation-material-fragment-id="anchor.equation.linear-solve.solved.rhs.4"]'
  );
  await expect(derived).toHaveText("4");
  await expect(derived).toHaveCSS("opacity", "0");

  const sourceTransforms = await owner.locator(
    '[data-kp-reader-equation-material-fragment-id*="left-simplified.rhs"]'
  ).evaluateAll((elements) => elements.map(
    (element) => (element as HTMLElement).style.transform
  ));
  expect(sourceTransforms).toHaveLength(3);
  expect(sourceTransforms.some((transform) => !transform.includes("translate(0px, 0px)")))
    .toBe(true);

  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=967"
  );
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "967");
  await expect.poll(async () => Number(await derived.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeGreaterThan(0.5);
});
