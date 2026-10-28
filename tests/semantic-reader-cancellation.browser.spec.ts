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
  const fitSurface = page.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );
  await expect(fitSurface).toHaveAttribute(
    "data-kp-reader-canonical-equation-presentation-mode",
    "verified-motion"
  );
  const inversePaint = fitSurface.locator([
    '[data-kp-native-katex-scene-owner]' +
      '[data-kp-equation-material-semantic-entity-id=' +
      '"equation.linear-solve.after-subtract.lhs.plus3"]',
    '[data-kp-native-katex-scene-owner]' +
      '[data-kp-equation-material-semantic-entity-id=' +
      '"equation.linear-solve.after-subtract.lhs.minus3"]'
  ].join(","));
  expect(await inversePaint.count()).toBeGreaterThanOrEqual(2);
  const cohortIds = await inversePaint.evaluateAll((owners) =>
    [...new Set(owners.map((owner) =>
      (owner as HTMLElement).dataset[
        "kpEquationMaterialVerifiedOperationCohortId"
      ]
    ))]
  );
  expect(cohortIds).toHaveLength(1);
  expect(cohortIds[0]).toMatch(/^operation-presentation\./);
  const centers = await inversePaint.evaluateAll((owners) => owners.map(
    (owner) => {
      const rect = owner.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  ));
  // The verified route may go above/below or around the sides. An absolute
  // vertical spread at one sample incorrectly mandates one aesthetic path.
  await page.locator('[data-kp-reader-attention-scrubber]').evaluate(node => {
    if (!(node instanceof HTMLInputElement)) throw new Error('Expected semantic scrubber');
    node.value = '450'; node.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('body')).toHaveAttribute('data-kp-reader-progress', '450');
  const earlier = await inversePaint.evaluateAll(owners => owners.map(owner => {
    const rect = owner.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }));
  expect(earlier).toHaveLength(centers.length);
  expect(earlier.every((point, index) => Math.hypot(point.x - centers[index]!.x, point.y - centers[index]!.y) > 1)).toBe(true);

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
