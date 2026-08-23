import { expect, test, type Locator, type Page } from "@playwright/test";

const animationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";
const applyTransitionId =
  "transform.generated.calculus.derivative.power-rule-x-cubed.apply-power-rule";
const evaluateTransitionId =
  "transform.generated.calculus.derivative.power-rule-x-cubed.evaluate-exponent-decrement";

test("derivative power rule keeps an explicit decrement and flat glyph motion", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0`);

  const player = cataloguePlayer(page);
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-id",
    animationId,
    { timeout: 30_000 }
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );

  // The server-rendered shell deliberately waits for a semantic frame before
  // replacing its stable placeholder. This reversible nudge exercises that
  // lifecycle without changing the requested source state.
  await seek.fill("0.001");
  await seek.fill("0");
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await expect(stage).toBeAttached();
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    applyTransitionId
  );
  await expect(stage.locator(
    "[data-kp-editor-equation-source] .katex"
  )).toContainText("d");

  await seek.fill("0.28");
  const sourceExponent = stage.locator(
    '[data-kp-editor-derivative-power-role="source-exponent"]'
  );
  const coefficient = stage.locator(
    '[data-kp-editor-derivative-power-role="coefficient-descendant"]'
  );
  const decrementInput = stage.locator(
    '[data-kp-editor-derivative-power-role="decrement-input-descendant"]'
  );
  await expect.poll(() => renderedOpacity(sourceExponent)).toBeLessThan(1);
  await expect.poll(() => renderedOpacity(sourceExponent)).toBeGreaterThan(0);
  await expect(coefficient).toHaveCSS("opacity", "1");
  await expect.poll(() => renderedOpacity(decrementInput)).toBeGreaterThan(0);
  await expect.poll(async () => Math.round(1_000 * (
    await renderedOpacity(sourceExponent) + await renderedOpacity(decrementInput)
  )) / 1_000).toBe(1);
  await expect(sourceExponent).toHaveAttribute(
    "data-kp-equation-motion-path-variant",
    "direct"
  );
  for (const glyph of [sourceExponent, coefficient, decrementInput]) {
    await expect.poll(() => renderedScale(glyph)).toEqual({ x: 1, y: 1 });
    await expect(glyph).toHaveCSS("text-shadow", "none");
  }

  await seek.fill("0.49");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    applyTransitionId
  );
  await expect(stage.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".decrement-operator"]'
  )).toContainText("−");
  await expect(stage.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".decrement-amount"]'
  )).toContainText("1");

  await seek.fill("0.66");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    evaluateTransitionId
  );
  const decrementOperator = activeTransition(stage).locator(
    '[data-kp-editor-derivative-decrement-role="decrement-operator"]'
  );
  const decrementAmount = activeTransition(stage).locator(
    '[data-kp-editor-derivative-decrement-role="decrement-amount"]'
  );
  const evaluatedResult = activeTransition(stage).locator(
    '[data-kp-editor-derivative-decrement-role="result"]'
  );
  await expect(decrementOperator).toContainText("−");
  await expect(decrementAmount).toContainText("1");
  await expect(decrementOperator).toHaveAttribute(
    "data-kp-editor-derivative-decrement-salience",
    "focus"
  );
  await expect(evaluatedResult).toHaveCSS("opacity", "0");
  await expect(activeTransition(stage).locator(
    "[data-kp-equation-lineage-path-id]"
  )).toHaveCount(0);

  await seek.fill("0.82");
  await expect.poll(() => renderedOpacity(decrementOperator)).toBeLessThan(1);
  await expect.poll(() => renderedOpacity(evaluatedResult)).toBeGreaterThan(0);
  for (const glyph of [decrementOperator, decrementAmount, evaluatedResult]) {
    await expect.poll(() => renderedScale(glyph)).toEqual({ x: 1, y: 1 });
    await expect(glyph).toHaveCSS("text-shadow", "none");
  }

  await seek.fill("1");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    evaluateTransitionId
  );
  const result = stage.locator("[data-kp-editor-equation-target]");
  await expect(result).toHaveCSS("opacity", "1");
  await expect(result.locator(".katex")).toContainText("3x2");

  await seek.fill("0");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    applyTransitionId
  );
  expect(pageErrors).toEqual([]);
});

test("derivative power rule restores the requested semantic transition directly", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.82`);
  const player = cataloguePlayer(page);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-id",
    animationId,
    { timeout: 30_000 }
  );
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(seek).toHaveValue("0.82");
  await expect(activeTransition(
    player.locator("[data-kp-editor-equation-stage]")
  )).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    evaluateTransitionId
  );
});

function cataloguePlayer(page: Page): Locator {
  return page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
}

function activeTransition(stage: Locator): Locator {
  return stage.locator(
    '[data-kp-editor-equation-transition-id]:not([hidden])'
  );
}

async function renderedScale(glyph: Locator): Promise<{
  readonly x: number;
  readonly y: number;
}> {
  return glyph.evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    const matrix = transform === "none"
      ? new DOMMatrix()
      : new DOMMatrix(transform);
    return {
      x: Math.round(matrix.a * 1_000) / 1_000,
      y: Math.round(matrix.d * 1_000) / 1_000
    };
  });
}

async function renderedOpacity(glyph: Locator): Promise<number> {
  return glyph.evaluate((element) => Number(getComputedStyle(element).opacity));
}
