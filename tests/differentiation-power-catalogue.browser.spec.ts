import { expect, test, type Locator, type Page } from "@playwright/test";

const animationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";
const applyTransitionId =
  "transform.generated.calculus.derivative.power-rule-x-cubed.apply-power-rule";
const evaluateTransitionId =
  "transform.generated.calculus.derivative.power-rule-x-cubed.evaluate-exponent-decrement";

test("derivative power rule delegates decrement evaluation to certified ink", async ({
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

  const sourceExponent = stage.locator(
    '[data-kp-editor-derivative-power-role="source-exponent"]'
  );
  const coefficient = stage.locator(
    '[data-kp-editor-derivative-power-role="coefficient-descendant"]'
  );
  const decrementInput = stage.locator(
    '[data-kp-editor-derivative-power-role="decrement-input-descendant"]'
  );
  const operator = stage.locator(
    '[data-kp-editor-derivative-power-role="derivative-operator"]'
  ).first();
  const operatorApplication = stage.locator(
    "[data-kp-derivative-operator-application]"
  );
  const sourceBase = stage.locator(
    '[data-kp-editor-derivative-power-role="source-operand-base"]'
  );
  const applicationTrace = stage.locator(
    "[data-kp-editor-derivative-application-trace]"
  );

  await seek.fill("0.07");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-operator-scope-presentation",
    "outline"
  );
  await expect(operatorApplication).toHaveCount(1);
  await expect(applicationTrace).toHaveCount(1);
  await expect(applicationTrace).toHaveAttribute(
    "data-kp-editor-derivative-application-trace-role",
    "operator-application-scope"
  );
  await expect(applicationTrace).toHaveCSS("border-style", "solid");
  await expect.poll(() => renderedOpacity(applicationTrace)).toBeGreaterThan(0);
  await expect.poll(() => renderedTranslationX(operator)).toBe(0);
  await expect.poll(() => renderedTranslationX(sourceBase)).toBe(0);
  await expect(coefficient).toHaveCSS("opacity", "0");
  const traceContainsOperand = await applicationTrace.evaluate((trace) => {
    const traceRect = trace.getBoundingClientRect();
    const transition = trace.closest<HTMLElement>(
      "[data-kp-editor-equation-transition-id]"
    )!;
    const operandRects = [
      transition.querySelector<HTMLElement>(
        '[data-kp-editor-derivative-power-role="source-operand-base"]'
      )!.getBoundingClientRect(),
      transition.querySelector<HTMLElement>(
        '[data-kp-editor-derivative-power-role="source-exponent"]'
      )!.getBoundingClientRect()
    ];
    return operandRects.every((rect) =>
      traceRect.left <= rect.left && traceRect.top <= rect.top &&
      traceRect.right >= rect.right && traceRect.bottom >= rect.bottom
    );
  });
  expect(traceContainsOperand).toBe(true);
  await expect(stage.locator(
    "[data-kp-editor-derivative-power-role].kp-focus-group"
  )).toHaveCount(0);

  await seek.fill("0.15");
  await expect.poll(() => renderedTranslationX(operator)).toBe(0);
  await expect.poll(() => renderedOpacity(operatorApplication)).toBe(0);
  await expect(applicationTrace).toHaveCount(1);
  await expect.poll(() => renderedOpacity(applicationTrace)).toBe(1);
  await expect.poll(() => renderedTranslationX(sourceBase)).toBe(0);
  await expect(coefficient).toHaveCSS("opacity", "0");

  await seek.fill("0.18");
  await expect.poll(() => renderedTranslationX(operator)).toBe(0);
  await expect.poll(() => renderedTranslationX(sourceBase)).not.toBe(0);
  await expect.poll(() => renderedOpacity(operatorApplication)).toBe(0);
  await expect.poll(() => renderedOpacity(coefficient)).toBeGreaterThan(0);

  await seek.fill("0.3");
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
  await expect(applicationTrace).toHaveCount(0);

  await seek.fill("0.66");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    evaluateTransitionId
  );
  const decrementOperator = activeTransition(stage).locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id$=".decrement-operator"]'
  );
  const decrementAmount = activeTransition(stage).locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id$=".decrement-amount"]'
  );
  const evaluatedResult = activeTransition(stage).locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".exponent"]'
  );
  await expect(decrementOperator).toContainText("−");
  await expect(decrementAmount).toContainText("1");
  await expect(activeTransition(stage)).not.toHaveAttribute(
    "data-kp-editor-equation-derivative-decrement-choreography",
    /.+/
  );
  await expect(activeTransition(stage).locator(
    "[data-kp-motion-id].kp-focus-group"
  )).toHaveCount(0);
  for (const glyph of [decrementOperator, decrementAmount]) {
    await expect(glyph).toHaveCSS("outline-style", "none");
    await expect(glyph).toHaveCSS("box-shadow", "none");
  }
  await expect(evaluatedResult).toHaveCSS("opacity", "0");
  const evaluatedSourceMaterial = stage.locator(
    '[data-kp-equation-material-fragment-role^="successor-source:"]'
  );
  await expect(evaluatedSourceMaterial).toHaveCount(3);
  await expect.poll(() => evaluatedSourceMaterial.evaluateAll((owners) =>
    owners.every((owner) =>
      owner.getAttribute("data-kp-certified-evaluation-salience-role") ===
        "source-cohort" &&
      owner.getAttribute("data-kp-semantic-salience-level") === "focus"
    )
  )).toBe(true);
  await expect.poll(async () => evaluatedSourceMaterial.evaluateAll((owners) =>
    owners.filter((owner) => Number(getComputedStyle(owner).opacity) > 0).length
  )).toBeGreaterThan(0);
  await expect(activeTransition(stage).locator(
    "[data-kp-equation-lineage-path-id]"
  )).toHaveCount(0);

  await seek.fill("0.82");
  await expect.poll(() => renderedOpacity(decrementOperator)).toBeLessThan(1);
  const evaluatedMaterial = stage.locator(
    '[data-kp-equation-material-fragment-role="successor-target:successor-target"]'
  );
  await expect(evaluatedMaterial).toHaveCount(1);
  await expect.poll(() => renderedOpacity(evaluatedMaterial)).toBeGreaterThan(0);
  await expect(evaluatedMaterial).toHaveAttribute(
    "data-kp-certified-evaluation-salience-role",
    "target-cohort"
  );
  await expect(evaluatedMaterial).toHaveAttribute(
    "data-kp-semantic-salience-level",
    "focus"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-certified-evaluation-mount",
    "native-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-family",
    "contributor-fusion"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-family-profile-id",
    "kp.evaluation-family.contributor-fusion.v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-renderer-profile-id",
    "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-realized-primitive-id",
    "kp.rendering.native-katex.primitive.ink-knot.v1"
  );
  // Native tokens are retired while the material cohort owns paint; their
  // hidden semantic transforms are not a second visible choreography.
  for (const glyph of [decrementOperator, decrementAmount, evaluatedResult]) {
    await expect(glyph).toHaveAttribute(
      "data-kp-equation-material-native-hidden",
      "true"
    );
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
  await expect(stage).toHaveAttribute(
    "data-kp-certified-evaluation-salience-phase",
    "settled"
  );
  await expect(stage.locator(
    '[data-kp-equation-material-fragment-role="successor-target:successor-target"]'
  )).toHaveAttribute("data-kp-semantic-salience-level", "normal");

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

test("certified decrement lifecycle is seek and direction independent", async ({
  page
}) => {
  test.setTimeout(60_000);
  await page.goto(`/?artifact=${animationId}&playhead=0.75`);
  const player = cataloguePlayer(page);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true",
    { timeout: 30_000 }
  );
  const seek = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    evaluateTransitionId
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-legibility-state",
    "kernel"
  );
  const forward = await evaluationLifecycleSnapshot(stage);

  await seek.fill("0.9");
  await seek.fill("0.75");
  expect(await evaluationLifecycleSnapshot(stage)).toEqual(forward);

  await player.focus();
  await page.keyboard.press("r");
  await player.locator(
    '[data-action="toggle-editor-animation"]'
  ).click();
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await seek.fill("0.25");
  expect(await evaluationLifecycleSnapshot(stage)).toEqual(forward);

  await page.goto(`/?artifact=${animationId}&playhead=0.5`);
  const replayPlayer = cataloguePlayer(page);
  const replayStage = replayPlayer.locator(
    "[data-kp-editor-equation-stage]"
  );
  await expect(activeTransition(replayStage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    evaluateTransitionId,
    { timeout: 30_000 }
  );
  await expect(replayStage).toHaveAttribute(
    "data-kp-certified-evaluation-native-settlement",
    "source"
  );
  expect(await evaluationPaintOwners(replayStage)).toEqual(["native-source"]);

  const replayToggle = replayPlayer.locator(
    '[data-action="toggle-editor-animation"]'
  );
  await replayToggle.click();
  await expect(replayPlayer).toHaveAttribute(
    "data-kp-editor-animation-status",
    "complete",
    { timeout: 12_000 }
  );
  await expect(replayStage).toHaveAttribute(
    "data-kp-certified-evaluation-native-settlement",
    "target"
  );
  expect(await evaluationPaintOwners(replayStage)).toEqual(["native-target"]);

  await replayToggle.click();
  await expect(replayPlayer).toHaveAttribute(
    "data-kp-editor-animation-status",
    "complete",
    { timeout: 12_000 }
  );
  await expect(replayStage).toHaveAttribute(
    "data-kp-certified-evaluation-native-settlement",
    "target"
  );
  expect(await evaluationPaintOwners(replayStage)).toEqual(["native-target"]);

  await page.goto(`/?artifact=${animationId}&playhead=0.75`);
  const restoredStage = cataloguePlayer(page).locator(
    "[data-kp-editor-equation-stage]"
  );
  await expect(activeTransition(restoredStage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    evaluateTransitionId,
    { timeout: 30_000 }
  );
  expect(await evaluationLifecycleSnapshot(restoredStage)).toEqual(forward);
});

test("certified decrement preserves superscript geometry and one paint owner", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.5`);
  const player = cataloguePlayer(page);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true",
    { timeout: 30_000 }
  );
  const seek = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    evaluateTransitionId
  );
  await expect(stage).toHaveAttribute(
    "data-kp-certified-evaluation-native-settlement",
    "source"
  );

  const geometryResiduals = await stage.evaluate((root) => {
    const stageRect = root.getBoundingClientRect();
    return [...root.querySelectorAll<HTMLElement>(
      '[data-kp-equation-material-fragment-role^="successor-source:"]'
    )].map((owner) => {
      const entityId = owner.dataset["kpEquationMaterialSemanticEntityId"]!;
      const token = [...root.querySelectorAll<HTMLElement>(
        "[data-kp-motion-id]"
      )].find((candidate) =>
        candidate.dataset["kpMotionId"]?.endsWith(entityId) === true
      )!;
      const rect = token.getBoundingClientRect();
      return {
        left: Math.abs(Number.parseFloat(owner.style.left) -
          (rect.left - stageRect.left)),
        top: Math.abs(Number.parseFloat(owner.style.top) -
          (rect.top - stageRect.top)),
        width: Math.abs(Number.parseFloat(owner.style.width) - rect.width),
        height: Math.abs(Number.parseFloat(owner.style.height) - rect.height)
      };
    });
  });
  expect(geometryResiduals).toHaveLength(3);
  geometryResiduals.forEach((residual) => {
    expect(Math.max(
      residual.left,
      residual.top,
      residual.width,
      residual.height
    )).toBeLessThanOrEqual(0.75);
  });
  expect(await evaluationPaintOwners(stage)).toEqual(["native-source"]);

  for (const playhead of [0.59, 0.69, 0.75, 0.77, 0.79, 0.85, 0.99]) {
    await seek.fill(String(playhead));
    await expect.poll(() => evaluationPaintOwners(stage)).toHaveLength(1);
    expect(await evaluationPaintOwners(stage)).toEqual([
      playhead <= 0.75 ? "material-source" : "material-target"
    ]);
  }

  await seek.fill("1");
  await expect(stage).toHaveAttribute(
    "data-kp-certified-evaluation-native-settlement",
    "target"
  );
  expect(await evaluationPaintOwners(stage)).toEqual(["native-target"]);
});

function cataloguePlayer(page: Page): Locator {
  return page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
}

async function evaluationPaintOwners(stage: Locator): Promise<string[]> {
  return stage.evaluate((root) => {
    const visible = (element: HTMLElement): boolean => {
      const style = getComputedStyle(element);
      return style.visibility !== "hidden" && Number(style.opacity) > 0.01;
    };
    const material = (
      side: "source" | "target"
    ): boolean => [...root.querySelectorAll<HTMLElement>(
      `[data-kp-equation-material-fragment-role^="successor-${side}:"]`
    )].some(visible);
    const native = (
      side: "source" | "target"
    ): boolean => [...root.querySelectorAll<HTMLElement>(
      `[data-kp-editor-equation-${side}] [data-kp-motion-id]`
    )].filter((token) =>
      token.dataset["kpMotionId"]?.endsWith(".exponent") === true ||
      token.dataset["kpMotionId"]?.endsWith(".decrement-operator") === true ||
      token.dataset["kpMotionId"]?.endsWith(".decrement-amount") === true
    ).some(visible);
    return [
      ...(native("source") ? ["native-source"] : []),
      ...(material("source") ? ["material-source"] : []),
      ...(material("target") ? ["material-target"] : []),
      ...(native("target") ? ["native-target"] : [])
    ];
  });
}

async function evaluationLifecycleSnapshot(stage: Locator) {
  return stage.evaluate((root) => ({
    transitionId: root.querySelector<HTMLElement>(
      "[data-kp-editor-equation-transition-id]:not([hidden])"
    )?.dataset["kpEditorEquationTransitionId"],
    localProgress: root.dataset["kpEditorEquationLocalProgress"],
    family: root.dataset["kpOperationEvaluationFamily"],
    familyProfile: root.dataset["kpOperationEvaluationFamilyProfileId"],
    rendererProfile:
      root.dataset["kpOperationEvaluationRendererProfileId"],
    primitive: root.dataset["kpOperationEvaluationRealizedPrimitiveId"],
    legibility: root.dataset["kpOperationEvaluationLegibilityState"],
    settlement: root.dataset["kpCertifiedEvaluationNativeSettlement"],
    saliencePhase: root.dataset["kpCertifiedEvaluationSaliencePhase"],
    owners: [...root.querySelectorAll<HTMLElement>(
      '[data-kp-equation-material-fragment-role^="successor-"]'
    )].map((owner) => ({
      role: owner.dataset["kpEquationMaterialFragmentRole"],
      semanticEntityId:
        owner.dataset["kpEquationMaterialSemanticEntityId"],
      opacity: owner.style.opacity,
      visibility: owner.style.visibility,
      transform: owner.style.transform,
      filter: owner.style.filter
    }))
  }));
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

async function renderedTranslationX(glyph: Locator): Promise<number> {
  return glyph.evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    const matrix = transform === "none"
      ? new DOMMatrix()
      : new DOMMatrix(transform);
    return Math.round(matrix.e * 1_000) / 1_000;
  });
}
