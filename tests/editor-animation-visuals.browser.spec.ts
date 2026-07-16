import { expect, test } from "@playwright/test";
import { equationAnimationConformanceBaseline } from "./fixtures/equation-animation-conformance-baseline.ts";
import { kpEquationVisualMotifConformanceFixture } from "../src/rendering/equation-visual-motif-conformance.ts";

test("selected editor animation controls play, pause, seek, step, rewind, and reset", async ({
  page
}) => {
  await page.goto("/");

  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const diagnostics = page.locator("[data-kp-editor-animation-diagnostics]");

  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-surface-hydrated",
    "true"
  );
  await expect(player.locator('[data-kp-editor-animation-surface-slot="equation"]'))
    .toHaveAttribute("data-kp-editor-animation-adapter-status", "ready");
  await expect(player.locator('[data-kp-editor-animation-surface-slot="equation"]'))
    .toHaveAttribute(
      "data-kp-editor-animation-adapter-id",
      "editor-animation-surface.equation.katex"
    );
  await expect(player.locator("[data-kp-editor-equation-stage] .katex").first())
    .toBeVisible();
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-diagnostics-hydrated",
    "true"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "idle");
  await expect(player.getByRole("button", { name: "Pause animation" })).toBeDisabled();

  await player.getByRole("button", { name: "Play animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "playing");
  await expect.poll(async () => Number(await scrubber.inputValue())).toBeGreaterThan(0.03);

  await player.getByRole("button", { name: "Pause animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "paused");
  const pausedProgress = Number(await scrubber.inputValue());
  await page.waitForTimeout(80);
  expect(Number(await scrubber.inputValue())).toBeCloseTo(pausedProgress, 5);

  await scrubber.fill("0.5");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.5");
  await expect(player.locator("[data-kp-editor-animation-progress-label]")).toHaveText("50%");
  await expect(diagnostics.locator("[data-kp-editor-animation-diagnostics-progress]"))
    .toHaveText("50%");
  await expect(diagnostics).toHaveAttribute("data-kp-editor-animation-direction", "forward");
  await expect(diagnostics.locator("[data-kp-editor-animation-diagnostics-active-transformations]"))
    .toHaveText("1");
  const equationStage = player.locator("[data-kp-editor-equation-stage]");
  await expect(equationStage).toHaveAttribute(
    "data-kp-editor-equation-phase-id",
    /\.forward\.1$/
  );
  await expect(equationStage.locator("[data-kp-editor-equation-source]"))
    .toHaveCSS("opacity", "1");
  await expect(equationStage.locator("[data-kp-editor-equation-target]"))
    .toHaveCSS("opacity", "1");
  const semanticTransition = equationStage.locator(
    "[data-kp-editor-equation-transition-id]"
  );
  await expect(semanticTransition)
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  await expect(semanticTransition)
    .toHaveAttribute("data-kp-editor-equation-semantic-progress", "0.5");
  await expect(
    equationStage.locator(
      '[data-kp-editor-equation-source] [data-kp-motion-id*="after-subtract.lhs.plus3"]'
    )
  ).toHaveCSS("opacity", "0.5");
  await expect(equationStage.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-motif", "cancelation");
  await expect(equationStage.locator("[data-kp-editor-equation-motif-label]"))
    .toHaveText("cancelation");
  await expect(equationStage.locator("[data-kp-editor-equation-focus-token]"))
    .toHaveCount(2);
  const solveSequence = equationStage.locator("[data-kp-editor-solve-x-sequence]");
  await expect(solveSequence).toBeVisible();
  await expect(solveSequence.locator("[data-kp-editor-solve-x-step]"))
    .toHaveCount(4);
  await expect(solveSequence.locator('[aria-current="step"]')).toContainText("3");

  await player.getByRole("button", { name: "Step animation forward" }).click();
  expect(Number(await scrubber.inputValue())).toBeGreaterThan(0.5);

  await player.getByRole("button", { name: "Rewind animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "playing");
  await expect(diagnostics).toHaveAttribute("data-kp-editor-animation-direction", "rewind");

  await player.getByRole("button", { name: "Reset animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "forward");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "idle");
  await expect(scrubber).toHaveValue("0");
});

test("editor animation player disposes cleanly across selection and dashboard rerenders", async ({
  page
}) => {
  await page.goto("/");

  let player = page.locator("[data-kp-editor-animation-player]");
  const initialDescriptorId = await player.getAttribute(
    "data-kp-editor-animation-descriptor-id"
  );
  await player.getByRole("button", { name: "Play animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "playing");

  await page.locator('[data-action="set-editor-animation"]').selectOption({ index: 1 });
  player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "idle");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  expect(await player.getAttribute("data-kp-editor-animation-descriptor-id"))
    .not.toBe(initialDescriptorId);

  await player.getByRole("button", { name: "Play animation" }).click();
  await page.getByRole("button", { name: "Project Dashboard" }).click();
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);

  await page.getByRole("button", { name: "Back to Editor" }).click();
  player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "idle");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
});

test("every solve-x descriptor route uses the same visible shared player", async ({
  page
}) => {
  await page.goto("/");

  const descriptorIds = [
    "editor-animation.animation.linear-solve.solve-x",
    "editor-animation.sample.animation.solve-x.both-sides",
    "editor-animation.sample.animation.solve-x.cancel-additive-inverses"
  ];

  for (const descriptorId of descriptorIds) {
    await page.locator('[data-action="set-editor-animation"]').selectOption(descriptorId);
    const player = page.locator("[data-kp-editor-animation-player]");
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-descriptor-id",
      descriptorId
    );
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-id",
      "animation.linear-solve.solve-x"
    );
    await expect(player.locator("[data-kp-editor-solve-x-sequence]")).toBeVisible();

    await player.locator('[data-action="seek-editor-animation"]').fill("1");
    await expect(player.locator("[data-kp-editor-equation-target]")).toContainText("x=4");
    await expect(player.locator("[data-kp-editor-equation-target]")).toHaveCSS(
      "opacity",
      "1"
    );
  }
});

test("fraction simplification renders factor, common-factor, and simplified states", async ({
  page
}) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.fraction-simplification.basic"
  );

  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.generated.fraction-expression.two-fourths"
  );

  await scrubber.fill("0.5");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-transition-id",
      "transform.generated.fraction-expression.two-fourths.merge-common-factor"
    );
  await expect(player.locator("[data-kp-editor-equation-source] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.fraction-expression.two-fourths.factored"
    );
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.fraction-expression.two-fourths.common-factor"
    );
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-semantic-progress", "0.5");
  await expect(player.locator("[data-kp-editor-equation-source] [data-kp-motion-id]"))
    .toHaveCount(7);
  await expect(player.locator("[data-kp-editor-equation-target] .frac-line[data-kp-motion-id]"))
    .toHaveCount(2);

  await scrubber.fill("1");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-motif", "simplify-into");
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.fraction-expression.two-fourths.simplified"
    );
  await expect(player.locator("[data-kp-editor-equation-target]"))
    .toHaveCSS("opacity", "1");
});

test("exponent and radical family animations render their semantic rewrite motifs", async ({
  page
}) => {
  await page.goto("/");

  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.exponent-combine.square-as-product"
  );
  let player = page.locator("[data-kp-editor-animation-player]");
  let scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.25");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-motif", "append-after-shift");
  await scrubber.fill("0.75");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-motif", "unwrap");
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.exponent.square-as-product.expanded"
    );
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");

  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.radical-rewrite.square-root-as-power"
  );
  player = page.locator("[data-kp-editor-animation-player]");
  scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.5");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-motif", "artifact-replace");
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.radical.square-root-as-power.radical"
    );
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  await expect(player.locator("[data-kp-editor-equation-target] .hide-tail[data-kp-motion-id]"))
    .toHaveCount(1);
});

test("function-wrap family animation visibly wraps and rewinds its argument", async ({
  page
}) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.function-wrap.apply-f"
  );

  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.5");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-motif", "wrap");
  await expect(player.locator("[data-kp-editor-equation-source]"))
    .toContainText("x");
  await expect(player.locator("[data-kp-editor-equation-target]"))
    .toContainText("f(x)");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  expect(Number(await player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id*="wrapped.function"]'
  ).evaluate((element) => getComputedStyle(element).opacity))).toBeLessThan(0.05);

  await player.getByRole("button", { name: "Rewind animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
  await expect(player.locator("[data-kp-editor-equation-source]"))
    .toContainText("f(x)");
  await expect(player.locator("[data-kp-editor-equation-target]"))
    .toContainText("x");
  await player.getByRole("button", { name: "Pause animation" }).click();
});

test("distribution and factoring family animations render opposite semantic directions", async ({
  page
}) => {
  await page.goto("/");
  const cases = [
    {
      descriptorId: "editor-animation.sample.animation.distribution.expand-a-sum",
      motif: "copy-fan-out",
      sourceId: "expression.generated.distribution.expand-a-sum.factored",
      targetId: "expression.generated.distribution.expand-a-sum.expanded"
    },
    {
      descriptorId: "editor-animation.sample.animation.factoring.factor-common-a",
      motif: "merge-fan-in",
      sourceId: "expression.generated.distribution.factor-common-a.expanded",
      targetId: "expression.generated.distribution.factor-common-a.factored"
    }
  ];

  for (const item of cases) {
    await page.locator('[data-action="set-editor-animation"]').selectOption(item.descriptorId);
    const player = page.locator("[data-kp-editor-animation-player]");
    await player.locator('[data-action="seek-editor-animation"]').fill("0.5");
    await expect(player.locator("[data-kp-editor-equation-transition-id]"))
      .toHaveAttribute("data-kp-editor-equation-motif", item.motif);
    await expect(player.locator("[data-kp-editor-equation-source] [data-kp-editor-equation-object-id]"))
      .toHaveAttribute("data-kp-editor-equation-object-id", item.sourceId);
    await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
      .toHaveAttribute("data-kp-editor-equation-object-id", item.targetId);
    await expect(player.locator("[data-kp-editor-equation-transition-id]"))
      .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  }
});

test("wrap and distribution satisfy their executable choreography contracts", async ({
  page
}) => {
  await page.goto("/");
  const picker = page.locator('[data-action="set-editor-animation"]');

  const wrapBaseline = equationAnimationConformanceBaseline(
    "animation.generated.function-wrap.apply-f"
  );
  const wrapFixture = kpEquationVisualMotifConformanceFixture(wrapBaseline.animationId);
  expect(wrapFixture.requiredTrustedMotifIds).toContain("wrap");
  expect(wrapFixture.rewindPhaseIds).toEqual([...wrapFixture.semanticPhaseIds].reverse());
  await picker.selectOption(wrapBaseline.descriptorId);
  let player = page.locator("[data-kp-editor-animation-player]");
  let scrubber = player.locator('[data-action="seek-editor-animation"]');
  const wrapTransition = player.locator("[data-kp-editor-equation-transition-id]");
  const wrapSourceValue = player.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id$=".input.value"]'
  );
  const wrapTargetArgument = player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".wrapped.argument"]'
  );
  const wrapTargetFunction = player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".wrapped.function"]'
  );
  const wrapTargetLeftParen = player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".wrapped.left-paren"]'
  );

  expect(wrapBaseline.gaps).toEqual([]);
  await expect(wrapTransition).toHaveAttribute(
    "data-kp-editor-equation-enclosure-choreography",
    "wrap"
  );

  await scrubber.fill("0");
  await expect(wrapSourceValue).toHaveCSS("opacity", "1");
  await expect(wrapTargetArgument).toHaveCSS("opacity", "0");
  await scrubber.fill("0.5");
  await expect(wrapSourceValue).toHaveCSS("opacity", "1");
  await expect(wrapTargetArgument).toHaveCSS("opacity", "0");
  await expect(wrapTransition).toHaveAttribute(
    "data-kp-editor-equation-persistent-travel-progress",
    "1"
  );
  expect(Number(await wrapTargetLeftParen.evaluate((element) => getComputedStyle(element).opacity)))
    .toBeGreaterThan(0);
  expect(Number(await wrapTargetFunction.evaluate((element) => getComputedStyle(element).opacity)))
    .toBeLessThan(0.05);
  await scrubber.fill("0.99");
  await expect(wrapSourceValue).toHaveCSS("opacity", "1");
  await expect(wrapTargetArgument).toHaveCSS("opacity", "0");
  await scrubber.fill("1");
  await expect(wrapSourceValue).toHaveCSS("opacity", "0");
  await expect(wrapTargetArgument).toHaveCSS("opacity", "1");
  await player.getByRole("button", { name: "Rewind animation" }).click();
  await scrubber.fill("0.5");
  await expect(player.locator('[data-kp-editor-equation-source] [data-kp-motion-id$=".wrapped.argument"]'))
    .toHaveCSS("opacity", "0");
  await expect(player.locator('[data-kp-editor-equation-target] [data-kp-motion-id$=".input.value"]'))
    .toHaveCSS("opacity", "1");

  const distributionBaseline = equationAnimationConformanceBaseline(
    "animation.generated.distribution.expand-a-sum"
  );
  const distributionFixture = kpEquationVisualMotifConformanceFixture(
    distributionBaseline.animationId
  );
  expect(distributionFixture.requiredTrustedMotifIds).toContain("fan-out");
  expect(distributionFixture.accessibility.find((variant) => variant.mode === "reduced-motion")?.preservesPhaseIds)
    .toEqual(distributionFixture.semanticPhaseIds);
  await picker.selectOption(distributionBaseline.descriptorId);
  player = page.locator("[data-kp-editor-animation-player]");
  scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.5");
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  const sourceFactor = transition.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.factor"]'
  );
  const targetFactors = transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$="-factor"]'
  );

  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-motif",
    distributionBaseline.observedMotif
  );
  expect(distributionBaseline.gaps).toEqual([]);
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-lineage-choreography",
    "copy-fan-out"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-lineage-path-count",
    "2"
  );
  await expect(sourceFactor).toHaveCSS("opacity", "1");
  await expect(targetFactors).toHaveCount(2);
  await expect(targetFactors.nth(0)).toHaveCSS("opacity", "1");
  await expect(targetFactors.nth(1)).toHaveCSS("opacity", "1");
  const pathIds = await targetFactors.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-kp-equation-lineage-path-id"))
  );
  expect(pathIds.every((pathId) => pathId !== null)).toBe(true);
  expect(new Set(pathIds).size).toBe(2);
  const pathVariants = await targetFactors.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-kp-equation-motion-path-variant"))
  );
  expect(new Set(pathVariants)).toEqual(new Set(["arc-above", "arc-below"]));
  expect(await targetFactors.nth(0).evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(await targetFactors.nth(1).evaluate((element) => getComputedStyle(element).transform));
  const transitProgress = Number(await transition.getAttribute(
    "data-kp-editor-equation-lineage-transit-progress"
  ));
  expect(transitProgress).toBeGreaterThan(0);
  expect(transitProgress).toBeLessThan(1);

  await scrubber.fill("0.99");
  expect(Number(await sourceFactor.evaluate((element) => getComputedStyle(element).opacity)))
    .toBeGreaterThan(0);
  await scrubber.fill("1");
  await expect(sourceFactor).toHaveCSS("opacity", "0");
  await expect(targetFactors.nth(0)).toHaveCSS("opacity", "1");
  await expect(targetFactors.nth(1)).toHaveCSS("opacity", "1");
  await player.getByRole("button", { name: "Rewind animation" }).click();
  await scrubber.fill("0.5");
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
  await expect(player.locator('[data-kp-editor-equation-target] [data-kp-motion-id$=".factored.factor"]'))
    .toHaveCSS("opacity", "1");
});

test("inequality family animation visibly flips its relation", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.inequality.sign-flip.basic"
  );

  const player = page.locator("[data-kp-editor-animation-player]");
  await player.locator('[data-action="seek-editor-animation"]').fill("0.5");
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-motif",
    "relation-flip"
  );
  await expect(transition.locator("[data-kp-editor-equation-motif-label]"))
    .toHaveText("relation flip");
  await expect(transition.locator("[data-kp-editor-equation-source]"))
    .toContainText("x<3");
  await expect(transition.locator("[data-kp-editor-equation-target]"))
    .toContainText("−2x>−6");
  await expect(transition)
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  await expect(
    transition.locator('[data-kp-editor-equation-source] [data-kp-motion-id*="source.relation"]')
  ).toHaveCSS("opacity", "0.5");
});

test("calculus equation families render derivative and FTC forms", async ({ page }) => {
  await page.goto("/");

  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.derivative-rules.basic"
  );
  let player = page.locator("[data-kp-editor-animation-player]");
  await player.locator('[data-action="seek-editor-animation"]').fill("0.5");
  await expect(player.locator("[data-kp-editor-equation-source] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.calculus.derivative.power-rule-x-cubed.initial"
    );
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.calculus.derivative.power-rule-x-cubed.derived"
    );

  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.integral-ftc.basic"
  );
  player = page.locator("[data-kp-editor-animation-player]");
  await player.locator('[data-action="seek-editor-animation"]').fill("1");
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
    .toHaveCount(2);
  await expect(player.locator('[data-kp-editor-equation-target] [data-kp-editor-equation-object-id="formula-ftc-derivative"]'))
    .toBeVisible();
  await expect(player.locator('[data-kp-editor-equation-target] [data-kp-editor-equation-object-id="formula-ftc-net-change"]'))
    .toBeVisible();
});

test("matrix-vector family animation visibly resolves the result vector", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.matrix-vector.basic"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  await player.locator('[data-action="seek-editor-animation"]').fill("1");
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.linear-algebra.matrix-vector.two-by-two.result"
    );
  await expect(player.locator("[data-kp-editor-equation-target]"))
    .toContainText("1315");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  await expect(player.locator("[data-kp-editor-equation-target] .mopen[data-kp-motion-id]"))
    .toHaveCount(1);
});

test("matrix-matrix family animation visibly resolves the result matrix", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.matrix-matrix.basic"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  await player.locator('[data-action="seek-editor-animation"]').fill("1");
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"))
    .toHaveAttribute(
      "data-kp-editor-equation-object-id",
      "expression.generated.linear-algebra.matrix-matrix.two-by-two.result"
    );
  await expect(player.locator("[data-kp-editor-equation-target]"))
    .toContainText("41048");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  await expect(player.locator("[data-kp-editor-equation-target] [data-kp-motion-id]"))
    .toHaveCount(6);
});

test("every pure equation descriptor renders visible KaTeX at start, midpoint, and end", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.goto("/");

  const descriptorIds = await page.locator('[data-action="set-editor-animation"] option')
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  let checked = 0;

  for (const descriptorId of descriptorIds) {
    await page.locator('[data-action="set-editor-animation"]').selectOption(descriptorId);
    const library = page.locator("[data-kp-editor-animation-library]");
    if (await library.getAttribute("data-kp-editor-animation-surface") !== "equation") {
      continue;
    }

    checked += 1;
    const player = page.locator("[data-kp-editor-animation-player]");
    const slot = player.locator('[data-kp-editor-animation-surface-slot="equation"]');
    await expect(slot, descriptorId).toHaveAttribute(
      "data-kp-editor-animation-adapter-id",
      "editor-animation-surface.equation.katex"
    );

    for (const progress of ["0", "0.5", "1"]) {
      await player.locator('[data-action="seek-editor-animation"]').fill(progress);
      await expect(player.locator("[data-kp-editor-equation-stage]"), `${descriptorId} @ ${progress}`)
        .toHaveCount(1);
      await expect(player.locator("[data-kp-editor-equation-stage] .katex").first())
        .toBeAttached();
      await expect(player.locator("[data-kp-editor-equation-unavailable]"))
        .toHaveCount(0);
    }
  }

  expect(checked).toBe(31);
});

test("graph animations mount the shared semantic SVG viewport", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.derivative-rules.tangent-graph"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  const slot = player.locator('[data-kp-editor-animation-surface-slot="graph"]');
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.graph.svg"
  );
  await expect(slot.locator("[data-kp-editor-graph-svg]")).toBeVisible();
  await expect(slot.locator("[data-kp-editor-graph-axis]")).toHaveCount(2);
  await player.locator('[data-action="seek-editor-animation"]').fill("0.5");
  await expect(slot.locator("[data-kp-editor-graph-svg]"))
    .toHaveAttribute("data-kp-editor-graph-progress", "0.5");
});

test("graph runtime adapters render visible geometry for each graph animation", async ({
  page
}) => {
  await page.goto("/");
  const player = page.locator("[data-kp-editor-animation-player]");
  const slot = player.locator('[data-kp-editor-animation-surface-slot="graph"]');
  const cases = [
    {
      descriptorId: "editor-animation.sample.animation.vector-add-scale.basic",
      selector: "[data-kp-editor-graph-vector]"
    },
    {
      descriptorId: "editor-animation.sample.animation.derivative-rules.tangent-graph",
      selector: "[data-kp-editor-graph-tangent]"
    },
    {
      descriptorId: "editor-animation.sample.animation.integral-ftc.area-sweep",
      selector: "[data-kp-editor-graph-area]"
    },
    {
      descriptorId: "editor-animation.sample.animation.dot-projection.basic",
      selector: "[data-kp-editor-graph-projection]",
      vertical: true
    }
  ];

  for (const graphCase of cases) {
    await page.locator('[data-action="set-editor-animation"]').selectOption(
      graphCase.descriptorId
    );
    await player.locator('[data-action="seek-editor-animation"]').fill("0.5");
    await expect(slot, graphCase.descriptorId).toHaveAttribute(
      "data-kp-editor-animation-adapter-id",
      "editor-animation-surface.graph.svg"
    );
    const geometry = slot.locator(graphCase.selector);
    await expect(geometry, graphCase.descriptorId).toBeAttached();
    if (graphCase.vertical === true) {
      await expect(geometry).toHaveAttribute("y1", /\d/);
      await expect(geometry).toHaveAttribute("y2", /\d/);
    } else {
      await expect(geometry).toBeVisible();
    }
  }
});

test("vector scaling visibly travels from its source to transformed coordinates", async ({
  page
}) => {
  await page.goto("/?animation=editor-animation.sample.animation.vector-add-scale.basic");
  const player = page.locator("[data-kp-editor-animation-player]");
  const vector = player.locator("[data-kp-editor-graph-vector]");
  await expect(player.locator("[data-kp-editor-graph-vector-source]")).toBeVisible();
  await expect(vector).toHaveAttribute("data-kp-editor-graph-vector-coordinates", "1,2");
  const startY = Number(await vector.getAttribute("y2"));

  await player.locator('[data-action="seek-editor-animation"]').fill("1");
  await expect(vector).toHaveAttribute("data-kp-editor-graph-vector-coordinates", "2,6");
  expect(Number(await vector.getAttribute("y2"))).toBeLessThan(startY);
});

test("the derivative tangent and contact point move together along x cubed", async ({
  page
}) => {
  await page.goto("/?animation=editor-animation.sample.animation.derivative-rules.tangent-graph");
  const player = page.locator("[data-kp-editor-animation-player]");
  const tangent = player.locator("[data-kp-editor-graph-tangent]");
  const point = player.locator("[data-kp-editor-graph-tangent-point]");
  await expect(tangent).toHaveAttribute("data-kp-editor-graph-tangent-slope", "0");
  await expect(point).toHaveAttribute("data-kp-editor-graph-tangent-x", "0");
  const startX = Number(await point.getAttribute("cx"));

  await player.locator('[data-action="seek-editor-animation"]').fill("1");
  await expect(tangent).toHaveAttribute("data-kp-editor-graph-tangent-slope", "12");
  await expect(point).toHaveAttribute("data-kp-editor-graph-tangent-x", "2");
  expect(Number(await point.getAttribute("cx"))).toBeGreaterThan(startX);
});

test("the integral area and moving upper bound visibly sweep together", async ({ page }) => {
  await page.goto("/?animation=editor-animation.sample.animation.integral-ftc.area-sweep");
  const player = page.locator("[data-kp-editor-animation-player]");
  const area = player.locator("[data-kp-editor-graph-area]");
  const bound = player.locator("[data-kp-editor-graph-area-bound]");
  await expect(area).toHaveAttribute("data-kp-editor-graph-area-value", "0");
  await expect(bound).toHaveAttribute("data-kp-editor-graph-upper-bound", "0");
  const startX = Number(await bound.getAttribute("x1"));

  await player.locator('[data-action="seek-editor-animation"]').fill("1");
  await expect(area).toHaveAttribute("data-kp-editor-graph-area-value", "9");
  await expect(bound).toHaveAttribute("data-kp-editor-graph-upper-bound", "3");
  await expect(player.locator("[data-kp-editor-graph-area-label]")).toHaveText("Area 9.00");
  expect(Number(await bound.getAttribute("x1"))).toBeGreaterThan(startX);
});

test("dot projection visibly drops the source point onto the target vector", async ({ page }) => {
  await page.goto("/?animation=editor-animation.sample.animation.dot-projection.basic");
  const player = page.locator("[data-kp-editor-animation-player]");
  const projection = player.locator("[data-kp-editor-graph-projection]");
  const point = player.locator("[data-kp-editor-graph-projection-point]");
  await expect(projection).toHaveAttribute("data-kp-editor-graph-drop-point", "3,4");
  await expect(point).toHaveAttribute("data-kp-editor-graph-dot-product", "12");
  const startY = Number(await projection.getAttribute("y2"));

  await player.locator('[data-action="seek-editor-animation"]').fill("1");
  await expect(projection).toHaveAttribute("data-kp-editor-graph-drop-point", "3,0");
  expect(Number(await projection.getAttribute("y2"))).toBeGreaterThan(startY);
});

test("graph annotations stay synchronized with the visible runtime geometry", async ({ page }) => {
  const cases = [
    ["editor-animation.sample.animation.vector-add-scale.basic", "v(t) = (1, 2)", "v(t) = (2, 6)"],
    ["editor-animation.sample.animation.derivative-rules.tangent-graph", "x = 0 · slope = 0", "x = 2 · slope = 12"],
    ["editor-animation.sample.animation.integral-ftc.area-sweep", "b = 0 · area = 0", "b = 3 · area = 9"],
    ["editor-animation.sample.animation.dot-projection.basic", "a·b = 12 · drop = (3, 4)", "a·b = 12 · drop = (3, 0)"]
  ] as const;

  for (const [descriptorId, start, end] of cases) {
    await page.goto(`/?animation=${descriptorId}`);
    const player = page.locator("[data-kp-editor-animation-player]");
    const annotation = player.locator("[data-kp-editor-graph-annotation]");
    await expect(annotation).toHaveText(start);
    await player.locator('[data-action="seek-editor-animation"]').fill("1");
    await expect(annotation).toHaveText(end);
  }
});

test("migrated equation families keep semantic token motion active forward and backward", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const descriptorIds = [
    "editor-animation.animation.linear-solve.solve-x",
    "editor-animation.sample.animation.fraction-simplification.basic",
    "editor-animation.sample.animation.exponent-combine.square-as-product",
    "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    "editor-animation.sample.animation.function-wrap.apply-f",
    "editor-animation.sample.animation.distribution.expand-a-sum",
    "editor-animation.sample.animation.factoring.factor-common-a",
    "editor-animation.sample.animation.inequality.sign-flip.basic",
    "editor-animation.sample.animation.matrix-vector.basic",
    "editor-animation.sample.animation.matrix-matrix.basic"
  ];

  for (const descriptorId of descriptorIds) {
    await page.locator('[data-action="set-editor-animation"]').selectOption(descriptorId);
    const player = page.locator("[data-kp-editor-animation-player]");
    const scrubber = player.locator('[data-action="seek-editor-animation"]');
    await scrubber.fill("0.43");
    let transition = player.locator("[data-kp-editor-equation-transition-id]");
    await expect(transition).toHaveAttribute(
      "data-kp-editor-equation-semantic-status",
      "ready"
    );
    await expect(transition).toHaveAttribute(
      "data-kp-editor-equation-semantic-motion",
      "active"
    );
    expect(await transition.locator("[data-kp-motion-id]").count()).toBeGreaterThan(1);

    await player.getByRole("button", { name: "Rewind animation" }).click();
    await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
    await player.getByRole("button", { name: "Pause animation" }).click();
    await scrubber.fill("0.43");
    transition = player.locator("[data-kp-editor-equation-transition-id]");
    await expect(transition).toHaveAttribute(
      "data-kp-editor-equation-semantic-motion",
      "active"
    );
    await expect(transition).toHaveAttribute(
      "data-kp-editor-equation-semantic-progress",
      /^(?!0$|1$)\d*\.?\d+$/
    );
  }
});

test("accepted LLM draft renders as semantic token motion in the editor", async ({ page }) => {
  await page.goto("/?animation=editor-animation.animation.generated.add-zero");
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.generated.add-zero"
  );
  await player.locator('[data-action="seek-editor-animation"]').fill("0.43");
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-semantic-motion",
    "active"
  );
  await expect(transition.locator("[data-kp-motion-id]")).toHaveCount(7);
  await expect(transition.locator("[data-kp-editor-equation-source]")).toContainText("x+0=4");
  await expect(transition.locator("[data-kp-editor-equation-target]")).toContainText("x=4");
});

test("generated semantic diagram renders incremental SVG lifecycles on the shared player", async ({
  page
}) => {
  await page.goto("/?animation=editor-animation.animation.generated.pipeline-diagram");
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.generated.pipeline-diagram"
  );
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.5");
  const diagram = player.locator("[data-kp-editor-diagram-svg]");
  await expect(diagram).toBeVisible();
  await expect(diagram).toHaveAttribute("data-kp-editor-diagram-progress", "0.5");
  await expect(diagram.locator('[data-kp-diagram-node="after.transform"]')).toHaveAttribute(
    "data-kp-diagram-opacity",
    "0.5"
  );
  await expect(diagram.locator('[data-kp-diagram-edge="before.direct"]')).toHaveAttribute(
    "data-kp-diagram-relation",
    "fan-out"
  );
  await expect(diagram.locator('[data-kp-diagram-edge="after.into-transform"]')).toHaveAttribute(
    "data-kp-diagram-opacity",
    "0.5"
  );

  await player.getByRole("button", { name: "Rewind animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
  await player.getByRole("button", { name: "Pause animation" }).click();
  await scrubber.fill("0.75");
  await expect(player.locator("[data-kp-editor-diagram-svg]")).toHaveAttribute(
    "data-kp-editor-diagram-progress",
    "0.25"
  );
});
