import { expect, test, type Locator, type Page } from "@playwright/test";

const animationId =
  "animation.generated.calculus.integral.power-rule-quadratic";
const expandTransitionId =
  "transform.generated.calculus.integral.power-rule-quadratic.expand-integral-power-rule";
const resolveTransitionId =
  "transform.generated.calculus.integral.power-rule-quadratic.resolve-integral-power-rule";

test("integration power rule uses governed transit and two certified ink knots", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0&theme=dark`);
  const player = cataloguePlayer(page);
  const seek = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true",
    { timeout: 30_000 }
  );
  await expectTransitReady(stage);
  await expect(stage).not.toHaveAttribute(
    "data-kp-antiderivative-power-repair-gap",
    /.+/
  );
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    expandTransitionId
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-transit-mechanism-id",
    "kp.rendering.native-katex.antiderivative-rule-application.v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-profile-id",
    "kp.rendering.native-katex.antiderivative-rule-application-exemplar.v12"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-instantiated-result-owner",
    "canonical-target-native"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    "source-native"
  );
  await expect(stage.locator("[data-kp-editor-equation-source] .katex"))
    .toContainText("∫x2dx");
  await expectFractionPaint(stage, 0);
  const ruleLens = stage.locator(
    "[data-kp-antiderivative-rule-lens-control]"
  );
  const ruleLensToggle = ruleLens.locator(
    "[data-kp-antiderivative-rule-lens-toggle]"
  );
  const rulePattern = stage.locator(
    "[data-kp-antiderivative-rule-pattern-projection]"
  );
  await expect(ruleLens).toHaveCount(1);
  await expect(ruleLens).toBeVisible();
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-phase",
    "match"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-view",
    "concrete"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-override",
    "automatic"
  );
  await expect(ruleLensToggle).toHaveText("Show pattern");
  await expect(ruleLensToggle).toHaveAttribute("aria-pressed", "false");
  const initialProgress = await seek.inputValue();
  await ruleLensToggle.click();
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "paused"
  );
  await expect(seek).toHaveValue(initialProgress);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-view",
    "abstract"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-override",
    "abstract"
  );
  await expect.poll(() => renderedOpacity(rulePattern)).toBe(1);
  await expect.poll(() => renderedOpacity(
    stage.locator("[data-kp-editor-equation-source]")
  )).toBe(1);
  await expect(ruleLensToggle).toHaveText("Show instance");
  await expect(ruleLensToggle).toHaveAttribute("aria-pressed", "true");
  await ruleLensToggle.click();
  await expect(seek).toHaveValue(initialProgress);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-view",
    "concrete"
  );
  await expect.poll(() => renderedOpacity(rulePattern)).toBe(0);
  await expect.poll(() => renderedOpacity(
    stage.locator("[data-kp-editor-equation-source]")
  )).toBe(1);
  await expectFractionPaint(stage, 0);
  await player.locator('[data-action="toggle-editor-animation"]').click();
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-override",
    "automatic"
  );
  await player.locator('[data-action="toggle-editor-animation"]').click();

  await seek.fill("0.06");
  await expectTransitReady(stage);
  const operator = stage.locator(
    '[data-kp-motion-id$=".initial.operator"]'
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-operator-presentation",
    "salience-only"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-operator-salience-strength"
  ))).toBeGreaterThan(0);
  await expect(operator).toHaveAttribute(
    "data-kp-semantic-salience-level",
    "focus"
  );
  await expect(operator).toHaveCSS("outline-style", "none");
  await expect(operator).toHaveCSS("box-shadow", "none");

  await seek.fill("0.32");
  await expectTransitReady(stage);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-operator-opacity"
  ))).toBe(0);
  await expect.poll(() => renderedOpacity(operator)).toBe(0);

  const sourceBase = stage.locator(
    '[data-kp-motion-id$=".initial.base"]'
  );
  const sourceExponent = stage.locator(
    '[data-kp-motion-id$=".initial.exponent"]'
  );
  const sourceDifferentialVariable = stage.locator(
    '[data-kp-motion-id$=".initial.integration-variable"]'
  );
  const sourceBaseRect = await elementRect(sourceBase);

  await seek.fill("0.132");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    "source-native"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-application",
    "match-bind-instantiate-rewrite"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-trace-role",
    "prospective"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-match-presence"
  ))).toBe(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-binding-progress"
  ))).toBe(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-instantiation-progress"
  ))).toBe(0);
  const templateReceiver = stage.locator(
    "[data-kp-antiderivative-template-receiver]"
  );
  await expect(templateReceiver).toHaveCount(1);
  await expect(templateReceiver).toHaveAttribute(
    "data-kp-antiderivative-template-law-ref-id",
    "law.calculus.integral.power-rule"
  );
  await expect(templateReceiver).toHaveAttribute("aria-hidden", "false");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-receiver-focus",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-vacancy-count",
    "0"
  );
  const vacancies = templateReceiver.locator(
    "[data-kp-antiderivative-template-vacancy]"
  );
  await expect(vacancies).toHaveCount(0);
  const rulePanel = stage.locator(
    "[data-kp-antiderivative-rule-template]"
  );
  const sourceFrame = rulePanel.locator(
    '[data-kp-antiderivative-registration-frame="source"]'
  );
  const templateFrame = rulePanel.locator(
    '[data-kp-antiderivative-registration-frame="template"]'
  );
  const patternProjection = rulePanel.locator(
    "[data-kp-antiderivative-rule-pattern-projection]"
  );
  const patternProjectionSlot = patternProjection.locator(
    '[data-kp-antiderivative-pattern-slot="n"]'
  );
  const patternProjectionBaseSlots = patternProjection.locator(
    '[data-kp-antiderivative-pattern-slot^="u-"]'
  );
  const explanationRail = stage.locator(
    "[data-kp-antiderivative-explanation-rail]"
  );
  const ruleReference = stage.locator(
    "[data-kp-antiderivative-rule-reference]"
  );
  const bindingLedger = stage.locator(
    "[data-kp-antiderivative-binding-ledger]"
  );
  const baseBindingRow = bindingLedger.locator(
    '[data-kp-antiderivative-binding-ledger-row="u"]'
  );
  const exponentBindingRow = bindingLedger.locator(
    '[data-kp-antiderivative-binding-ledger-row="n"]'
  );
  await expect(rulePanel).toHaveCount(1);
  await expect(rulePanel).toHaveAttribute("aria-hidden", "true");
  await expect(rulePanel).toHaveAttribute(
    "data-kp-antiderivative-rule-pattern",
    String.raw`\int u^n\,du`
  );
  await expect(rulePanel).toHaveAttribute(
    "data-kp-antiderivative-rule-replacement-template",
    String.raw`\frac{u^{n+1}}{n+1}+C`
  );
  await expect(rulePanel).toHaveAttribute(
    "data-kp-antiderivative-rule-authority-pattern",
    String.raw`\int u^n\,du`
  );
  await expect(sourceFrame).toHaveCount(0);
  await expect(templateFrame).toHaveCount(0);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-registration-frame-count",
    "0"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-schema-projection",
    "motion-passage"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-skeletonization",
    "optional-rule-lens"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-skeletonization-registration-count",
    "5"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-skeletonization-registration-error"
  ))).toBeLessThan(0.5);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-skeleton-base-progress",
    "0.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-skeleton-exponent-progress",
    "0.0000"
  );
  await expect.poll(() => renderedOpacity(sourceBase)).toBe(1);
  await expect.poll(() => renderedOpacity(sourceDifferentialVariable)).toBe(1);
  await expect.poll(() => renderedOpacity(sourceExponent)).toBe(1);
  await expect.poll(() => renderedOpacity(patternProjectionSlot)).toBe(0);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-primary-representation-count",
    "1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-preview-presence",
    "1.0000"
  );
  await expect.poll(() => renderedOpacity(patternProjection)).toBe(0);
  await expect.poll(() => renderedOpacity(
    stage.locator("[data-kp-editor-equation-target]")
  )).toBe(0);
  await expect(stage.locator("[data-kp-editor-equation-source] .katex"))
    .toContainText("∫x2dx");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-accessible-endpoint",
    "source"
  );
  await expect.poll(() => renderedOpacity(
    stage.locator("[data-kp-editor-equation-source]")
  )).toBeGreaterThan(0);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-fixed-syntax-owner",
    "source-native"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-passage-layout",
    "split"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-reference-presence",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-binding-ledger-presence",
    "0.0000"
  );
  await expect(ruleReference).toContainText("∫undu=");
  await expect(ruleReference.locator(
    '[data-kp-antiderivative-contextual-fraction="rule-reference"]'
  )).toHaveCount(1);
  await expect(bindingLedger).toHaveCount(1);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-explanation-beat",
    "recognize-rule"
  );
  await expect(explanationRail).toContainText(
    "The rule applies when the integrand is a power"
  );
  await expect(explanationRail).toHaveAttribute(
    "data-kp-antiderivative-explanation-grounding",
    "law.calculus.integral.power-rule"
  );
  await expect(explanationRail).toHaveAttribute("role", "note");
  await expect(explanationRail).toHaveAttribute("aria-live", "off");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-depth-lens",
    "schema-projection"
  );
  await expectIntegralPlanePaint(stage, 1);
  await expectFractionPaint(stage, 0);

  await seek.fill("0.203");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-preview-presence",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-fixed-syntax-owner",
    "source-native"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-explanation-beat",
    "match-structure"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-skeleton-base-progress",
    "0.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-skeleton-exponent-progress",
    "0.0000"
  );
  await expect.poll(() => renderedOpacity(sourceBase)).toBe(1);
  await expect.poll(() => renderedOpacity(sourceDifferentialVariable)).toBe(1);
  await expect.poll(() => renderedOpacity(sourceExponent)).toBe(1);
  await expect.poll(() => renderedOpacity(patternProjectionSlot)).toBe(0);
  await expect.poll(() => patternProjectionBaseSlots.evaluateAll((elements) =>
    elements.map((element) => Number(getComputedStyle(element).opacity))
  )).toEqual([0, 0]);
  await expect.poll(() => renderedOpacity(
    stage.locator("[data-kp-editor-equation-source]")
  )).toBe(1);
  await expectIntegralPlanePaint(stage, 1);
  await expectFractionPaint(stage, 0);

  await seek.fill("0.259");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-preview-presence",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-pattern-projection-presence",
    "1.0000"
  );
  await expect.poll(() => renderedOpacity(patternProjection)).toBe(0);
  await expect(patternProjection).toContainText("∫undu");
  await expect(patternProjectionSlot).toHaveCount(1);
  await expect(patternProjectionBaseSlots).toHaveCount(2);
  await expect(patternProjection).toHaveAttribute(
    "data-kp-semantic-salience-level",
    "context"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-skeleton-base-progress",
    "0.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-skeleton-exponent-progress",
    "0.0000"
  );
  await expect.poll(() => renderedOpacity(sourceBase)).toBe(1);
  await expect.poll(() => renderedOpacity(sourceDifferentialVariable)).toBe(1);
  await expect.poll(() => renderedOpacity(sourceExponent)).toBe(1);
  await expect.poll(() => renderedOpacity(patternProjectionSlot)).toBe(0);
  const projectedFixedSyntax = patternProjection.locator(
    "[data-kp-antiderivative-pattern-fixed]"
  );
  await expect(projectedFixedSyntax).toHaveCount(2);
  await expect.poll(() => projectedFixedSyntax.evaluateAll((elements) =>
    elements.map((element) => Number(getComputedStyle(element).opacity))
  )).toEqual([0, 0]);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-fixed-syntax-owner",
    "source-native"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-depth-lens",
    "schema-projection"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-schema-plane-presence",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-correspondence-plane-presence",
    "1.0000"
  );
  await expect(explanationRail).toContainText("u↦x");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-binding-ledger-presence",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-binding-u-state",
    "focus"
  );
  await expect.poll(() => renderedOpacity(baseBindingRow)).toBe(1);
  await expect.poll(() => renderedOpacity(exponentBindingRow)).toBe(0);
  await expectIntegralPlanePaint(stage, 1);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-match-presence"
  ))).toBe(1);
  const [sourceClip, patternClip] = await Promise.all([
    stage.locator("[data-kp-editor-equation-source]").evaluate((element) =>
      getComputedStyle(element).clipPath
    ),
    patternProjection.evaluate((element) =>
      getComputedStyle(element).clipPath
    )
  ]);
  expect(sourceClip).toBe("none");
  expect(patternClip).toBe("none");
  expect(maxRectDelta(sourceBaseRect, await elementRect(sourceBase)))
    .toBeLessThan(0.5);
  await expectFractionPaint(stage, 0);

  await seek.fill("0.337");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-receiver-focus",
    "1.0000"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-binding-progress"
  ))).toBe(1);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-instantiation-progress"
  ))).toBe(0);
  await expect(rulePanel).toHaveAttribute(
    "aria-label",
    /n maps to 2/u
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-explanation-beat",
    "bind-metavariables"
  );
  await expect(explanationRail).toContainText("The exponent is");
  await expect(explanationRail).toContainText("n↦2");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-binding-n-state",
    "focus"
  );
  await expect.poll(() => renderedOpacity(baseBindingRow)).toBe(1);
  await expect.poll(() => renderedOpacity(exponentBindingRow)).toBe(1);
  expect(maxRectDelta(sourceBaseRect, await elementRect(sourceBase)))
    .toBeLessThan(0.5);
  await expectFractionPaint(stage, 0);

  await seek.fill("0.353");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-primary-representation",
    "source"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-primary-representation-count",
    "1"
  );
  await expect.poll(() => renderedOpacity(patternProjection)).toBe(0);
  await expect.poll(() => renderedOpacity(
    stage.locator("[data-kp-editor-equation-source]")
  )).toBe(1);
  await expect.poll(() => renderedOpacity(
    stage.locator("[data-kp-editor-equation-target]")
  )).toBe(0);
  await expectFractionPaint(stage, 0);

  await seek.fill("0.39");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-binding-progress",
    "1.0000"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-template-reveal-progress"
  ))).toBeGreaterThan(0);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-receiver-settlement-progress",
    "0.0000"
  );
  const instantiatedResult = stage.locator(
    "[data-kp-editor-equation-target]"
  );
  await expect(instantiatedResult).toHaveAttribute(
    "data-kp-semantic-trace-role",
    "prospective"
  );
  await expect.poll(() => renderedOpacity(instantiatedResult))
    .toBeGreaterThan(0.6);
  const instantiatedFraction = instantiatedResult.locator(
    '[data-kp-antiderivative-instantiated-fraction-owner="canonical-target-native"]'
  );
  await expect(instantiatedFraction).toHaveCount(1);
  await expect(stage.locator(
    "[data-kp-equation-material-fragment-role=\"rule:rule-length\"]"
  )).toHaveCount(0);
  await expect(instantiatedResult).toHaveAttribute(
    "data-kp-antiderivative-prospective-placement",
    "center"
  );
  const templateSlots = instantiatedResult.locator(
    '[data-kp-antiderivative-rule-template-slot="n"]'
  );
  await expect(templateSlots).toHaveCount(2);
  const templateBaseSlot = instantiatedResult.locator(
    '[data-kp-antiderivative-rule-template-slot="u"]'
  );
  await expect(templateBaseSlot).toHaveCount(1);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-instantiation-progress",
    "0.0000"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-template-slot-presence"
  ))).toBeGreaterThan(0);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-instantiation-base-progress",
    "0.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-instantiation-exponent-progress",
    "0.0000"
  );
  await expect.poll(() => renderedPseudoOpacity(
    templateBaseSlot,
    "::after"
  )).toBe(1);
  await expect.poll(() => templateSlots.evaluateAll((elements) =>
    elements.map((element) =>
      Number(getComputedStyle(element, "::after").opacity)
    )
  )).toEqual([1, 1]);
  await expect.poll(() => renderedOpacity(
    templateBaseSlot.locator(":scope > *").first()
  )).toBe(0);
  const boundTargetPaint = instantiatedResult.locator(
    '[data-kp-antiderivative-template-paint-role="binding"]'
  );
  await expect.poll(() => boundTargetPaint.count()).toBeGreaterThanOrEqual(3);
  await expect(rulePanel).toHaveAttribute(
    "aria-label",
    /Prospective power-rule template/u
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-explanation-beat",
    "instantiate-template"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-prospective-plane-depth"
  ))).toBeGreaterThan(0);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-passage-layout",
    "split"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-primary-representation",
    "replacement-template"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-binding-relation-count",
    "0"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-binding-relation-presence",
    "0.0000"
  );
  await expect.poll(() => renderedOpacity(patternProjection)).toBe(0);
  expect(maxRectDelta(sourceBaseRect, await elementRect(sourceBase)))
    .toBeLessThan(0.5);
  await expectFractionPaint(stage, 1);

  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-phase",
    "replacement"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-view",
    "abstract"
  );
  await expect(ruleLensToggle).toHaveText("Show bound form");
  const templateProgress = await seek.inputValue();
  await ruleLensToggle.click();
  await expect(seek).toHaveValue(templateProgress);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-view",
    "concrete"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-primary-representation",
    "instantiated-rewrite"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-template-slot-presence",
    "0.0000"
  );
  await expect(ruleLensToggle).toHaveText("Show template");
  await expect(rulePanel).toHaveAttribute("aria-hidden", "true");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-accessible-endpoint",
    "target"
  );
  await expectFractionPaint(stage, 1);
  await ruleLensToggle.click();
  await expect(seek).toHaveValue(templateProgress);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-view",
    "abstract"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-template-slot-presence",
    "1.0000"
  );
  await player.locator('[data-action="toggle-editor-animation"]').click();
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-lens-override",
    "automatic"
  );
  await player.locator('[data-action="toggle-editor-animation"]').click();

  await seek.fill("0.425");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-explanation-beat",
    "propagate-binding"
  );
  await expect(explanationRail).toContainText(
    "supplies both exponent occurrences"
  );
  await expect(explanationRail).toHaveAttribute(
    "data-kp-antiderivative-explanation-grounding",
    "binding.n.fan-out"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-binding-relation-presence",
    "0.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-instantiation-base-progress",
    "1.0000"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-instantiation-exponent-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-instantiation-exponent-progress"
  ))).toBeLessThan(1);
  const propagatedExponentPaint = await Promise.all([
    templateSlots.evaluateAll((elements) => elements.map((element) =>
      Number(getComputedStyle(element, "::after").opacity)
    )),
    templateSlots.evaluateAll((elements) => elements.map((element) => {
      const child = element.firstElementChild;
      return child instanceof HTMLElement
        ? Number(getComputedStyle(child).opacity)
        : 0;
    }))
  ]);
  expect(propagatedExponentPaint[0]).toHaveLength(2);
  expect(propagatedExponentPaint[1]).toHaveLength(2);
  expect(propagatedExponentPaint[0][0]).toBe(
    propagatedExponentPaint[0][1]
  );
  expect(propagatedExponentPaint[1][0]).toBe(
    propagatedExponentPaint[1][1]
  );
  await expect.poll(() => renderedOpacity(
    templateBaseSlot.locator(":scope > *").first()
  )).toBe(1);
  await expectFractionPaint(stage, 1);

  await seek.fill("0.447");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-instantiation-progress",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-template-slot-presence",
    "0.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-instantiation-base-progress",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-instantiation-exponent-progress",
    "1.0000"
  );
  await expect.poll(() => renderedPseudoOpacity(
    templateBaseSlot,
    "::after"
  )).toBe(0);
  await expect.poll(() => templateSlots.evaluateAll((elements) =>
    elements.map((element) =>
      Number(getComputedStyle(element, "::after").opacity)
    )
  )).toEqual([0, 0]);
  await expect.poll(() => renderedOpacity(
    templateSlots.first().locator(":scope > *").first()
  ))
    .toBe(1);
  await expect(rulePanel).toHaveAttribute(
    "aria-label",
    /Instantiated power-rule result/u
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-preview-presence",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-primary-representation",
    "instantiated-rewrite"
  );
  const instantiatedFractionRect = await elementRect(instantiatedFraction);
  await expectFractionPaint(stage, 1);

  await seek.fill("0.471");
  await expectTransitReady(stage);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-receiver-settlement-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-receiver-settlement-progress"
  ))).toBeLessThan(1);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-rewrite-commit-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(() => renderedOpacity(rulePanel)).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-preview-withdrawal-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rule-reference-presence"
  ))).toBeGreaterThan(0);
  const movingFractionRect = await elementRect(instantiatedFraction);
  expect(Math.abs(movingFractionRect.top - instantiatedFractionRect.top))
    .toBeLessThan(0.5);
  await expect(instantiatedFraction).toHaveCount(1);
  await expect(stage.locator(
    '[data-kp-antiderivative-instantiated-fraction-owner="canonical-target-native"]'
  )).toHaveCount(1);
  await expectFractionPaint(stage, 1);

  await seek.fill("0.49");
  await expectTransitReady(stage);
  const visibleConstant = stage.locator(
    '[data-kp-motion-id$=".expanded.constant"]'
  );
  await expect(visibleConstant).toHaveCount(1);
  await expect.poll(() => renderedOpacity(visibleConstant))
    .toBeGreaterThan(0);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-binding-progress",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-receiver-focus",
    "0.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-receiver-settlement-progress",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    "target-native"
  );
  const settledFractionRect = await elementRect(instantiatedFraction);
  expect(Math.abs(settledFractionRect.top - movingFractionRect.top))
    .toBeLessThan(0.5);
  const movingFractionCenter = movingFractionRect.left +
    movingFractionRect.width / 2;
  const settledFractionCenter = settledFractionRect.left +
    settledFractionRect.width / 2;
  // As contextual support withdraws, the live expression recenters without
  // changing the native fraction's vertical geometry or paint ownership.
  expect(settledFractionCenter).toBeGreaterThan(movingFractionCenter);
  expect(settledFractionCenter - movingFractionCenter).toBeLessThan(140);
  expect(Math.abs(settledFractionRect.width - movingFractionRect.width))
    .toBeLessThan(4);
  await expect(stage.locator(
    "[data-kp-equation-material-fragment-role=\"rule:rule-length\"]"
  )).toHaveCount(0);
  await expect.poll(() => renderedOpacity(rulePanel)).toBe(0);
  await expect(templateReceiver).toHaveAttribute("aria-hidden", "true");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-passage-layout",
    "centered"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-rule-reference-presence",
    "0.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-binding-relation-presence",
    "0.0000"
  );
  await expectFractionPaint(stage, 1);

  await seek.fill("0.5");
  await expect(activeTransition(stage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    resolveTransitionId
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-evaluation-mount",
    "native-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-evaluation-native-settlement",
    "source"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-evaluation-fraction-owner",
    "source-native"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-explanation-beat",
    "reduce-arithmetic"
  );
  await expect(explanationRail).toContainText(
    "Evaluate each remaining sum with ordinary arithmetic"
  );
  await expect(stage.locator("[data-kp-editor-equation-source] .katex"))
    .toContainText("2+1");
  await expect(stage.locator("[data-kp-editor-equation-source] .katex"))
    .toContainText("+C");
  await expectFractionPaint(stage, 1);

  await seek.fill("0.75");
  await expect(stage.locator(
    '[data-kp-equation-material-fragment-role^="successor-source:"]'
  )).toHaveCount(6);
  await expect(stage.locator(
    '[data-kp-equation-material-fragment-role="successor-target:successor-target"]'
  )).toHaveCount(2);
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-realized-primitive-id",
    "kp.rendering.native-katex.primitive.ink-knot.v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-cohort-count",
    "2"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-evaluation-fraction-owner",
    "material"
  );
  await expectFractionPaint(stage, 1);

  await seek.fill("1");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-evaluation-native-settlement",
    "target"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-evaluation-fraction-owner",
    "target-native"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-explanation-beat",
    "final-result"
  );
  const finalKatex = stage.locator("[data-kp-editor-equation-target] .katex");
  await expect(finalKatex).toContainText("x3");
  await expect(finalKatex).toContainText("+C");
  await expectFractionPaint(stage, 1);
  expect(pageErrors).toEqual([]);
});

test("integration Catalogue lifecycle restores, rewinds, themes, and exposes static truth", async ({
  page
}) => {
  test.setTimeout(60_000);
  await page.goto(`/?artifact=${animationId}&playhead=0.39&theme=light`);
  const player = cataloguePlayer(page);
  const seek = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await expectTransitReady(stage);
  await expect(seek).toHaveValue("0.39");
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-development-theme",
    "light"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    "rule-application-native"
  );
  const lightExplanation = stage.locator(
    "[data-kp-antiderivative-explanation-rail]"
  );
  await expect(lightExplanation).toBeVisible();
  const lightTemplateColor = await lightExplanation.evaluate((element) =>
    getComputedStyle(element).color
  );

  await page.goto(`/?artifact=${animationId}&playhead=0.39&theme=dark`);
  const darkPlayer = cataloguePlayer(page);
  const darkStage = darkPlayer.locator("[data-kp-editor-equation-stage]");
  await expectTransitReady(darkStage);
  const darkExplanation = darkStage.locator(
    "[data-kp-antiderivative-explanation-rail]"
  );
  await expect(darkExplanation).toBeVisible();
  const darkTemplateColor = await darkExplanation.evaluate((element) =>
    getComputedStyle(element).color
  );
  expect(darkTemplateColor).not.toBe(lightTemplateColor);

  await setPresentation(darkPlayer, "reduced-motion");
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-power-accessibility-projection",
    "reduced"
  );
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-depth-lens",
    "reduced"
  );
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-binding-relation-presence",
    "0.0000"
  );
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    /source-native|target-native/
  );
  await expect(darkStage.locator(
    "[data-kp-antiderivative-template-vacancy]"
  )).toHaveCount(0);
  await setPresentation(darkPlayer, "static");
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-power-accessibility-projection",
    "no-depth"
  );
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-depth-lens",
    "no-depth"
  );
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-binding-relation-presence",
    "0.0000"
  );
  const accessibleEndpoint = await darkStage.getAttribute(
    "data-kp-antiderivative-power-accessible-endpoint"
  );
  expect(accessibleEndpoint).toMatch(/source|target/);
  await expect(darkStage.locator(
    `[data-kp-editor-equation-${accessibleEndpoint}]`
  )).toHaveAttribute("aria-hidden", "false");

  await setPresentation(darkPlayer, "full-motion");
  await darkPlayer.focus();
  await page.keyboard.press("r");
  await darkPlayer.locator('[data-action="toggle-editor-animation"]').click();
  await expect(darkPlayer).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await darkPlayer.locator('[data-action="seek-editor-animation"]').fill(
    "0.72"
  );
  await expectTransitReady(darkStage);
  await expect(activeTransition(darkStage)).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    expandTransitionId
  );
  await expect(darkStage).not.toHaveAttribute(
    "data-kp-antiderivative-power-repair-gap",
    /.+/
  );
});

test("ordinary playback gives recognition binding and instantiation readable dwell", async ({
  page
}) => {
  test.setTimeout(30_000);
  await page.goto(`/?artifact=${animationId}&playhead=0&theme=dark`);
  const player = cataloguePlayer(page);
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await expectTransitReady(stage);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-duration-ms",
    "14800"
  );
  const dwell = stage.evaluate((root) => new Promise<{
    recognitionAt: number;
    bindingAt: number;
    instantiatedAt: number;
    handoffAt: number;
  }>((resolve, reject) => {
    const marks: Partial<Record<
      "recognitionAt" | "bindingAt" | "instantiatedAt" | "handoffAt",
      number
    >> = {};
    const startedAt = performance.now();
    const observe = (): void => {
      const now = performance.now();
      if (
        marks.recognitionAt === undefined &&
        Number(root.dataset["kpAntiderivativeRuleMatchPresence"]) === 1
      ) marks.recognitionAt = now;
      if (
        marks.bindingAt === undefined &&
        Number(root.dataset[
          "kpAntiderivativeMetavariableBindingsPresence"
        ]) === 1
      ) marks.bindingAt = now;
      if (
        marks.instantiatedAt === undefined &&
        Number(root.dataset["kpAntiderivativeInstantiatedResultPresence"]) === 1
      ) marks.instantiatedAt = now;
      if (
        marks.handoffAt === undefined &&
        Number(root.dataset["kpAntiderivativeRuleRewriteCommitProgress"]) > 0.05
      ) marks.handoffAt = now;
      if (
        marks.recognitionAt !== undefined &&
        marks.bindingAt !== undefined &&
        marks.instantiatedAt !== undefined &&
        marks.handoffAt !== undefined
      ) {
        observer.disconnect();
        resolve(marks as {
          recognitionAt: number;
          bindingAt: number;
          instantiatedAt: number;
          handoffAt: number;
        });
      } else if (now - startedAt > 8_000) {
        observer.disconnect();
        reject(new Error("Timed out observing the rule-template dwell beats."));
      }
    };
    const observer = new MutationObserver(observe);
    observer.observe(root, { attributes: true });
    observe();
  }));
  await player.locator('[data-action="toggle-editor-animation"]').click();
  const marks = await dwell;

  expect(marks.bindingAt - marks.recognitionAt).toBeGreaterThan(900);
  expect(marks.instantiatedAt - marks.bindingAt).toBeGreaterThan(1_300);
  expect(marks.handoffAt - marks.instantiatedAt).toBeGreaterThan(350);
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

interface TestRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

async function elementRect(locator: Locator): Promise<TestRect> {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  });
}

function maxRectDelta(left: TestRect, right: TestRect): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

async function renderedOpacity(locator: Locator): Promise<number> {
  return locator.evaluate((element) => Number(getComputedStyle(element).opacity));
}

async function renderedPseudoOpacity(
  locator: Locator,
  pseudo: "::after"
): Promise<number> {
  return locator.evaluate(
    (element, pseudoElement) =>
      Number(getComputedStyle(element, pseudoElement).opacity),
    pseudo
  );
}

async function expectFractionPaint(
  stage: Locator,
  expectedVisibleRuleCount: number
): Promise<void> {
  const audit = await stage.evaluate((root) => {
    const isRealized = (element: HTMLElement): boolean => {
      let opacity = 1;
      for (
        let current: HTMLElement | null = element;
        current !== null;
        current = current.parentElement
      ) {
        const style = getComputedStyle(current);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.contentVisibility === "hidden"
        ) return false;
        opacity *= Number(style.opacity);
        if (current === root) break;
      }
      return opacity > 0.01 && element.getClientRects().length > 0;
    };
    const allRules = [...root.querySelectorAll<HTMLElement>(".frac-line")]
      .filter(isRealized);
    // A quiet rule-reference fraction may coexist spatially with the lesson
    // subject. The continuity law counts only the live rewrite workspace; the
    // contextual reference is separately marked and never owns animation.
    const rules = allRules.filter((rule) =>
      !rule.hasAttribute("data-kp-antiderivative-contextual-fraction")
    );
    const replicaEffects = allRules.flatMap((rule) => {
      const effects: string[] = [];
      for (
        let current: HTMLElement | null = rule;
        current !== null;
        current = current.parentElement
      ) {
        const style = getComputedStyle(current);
        if (style.filter.includes("drop-shadow")) {
          effects.push(`drop-shadow:${current.className}`);
        }
        if (current === rule && style.boxShadow !== "none") {
          effects.push(`box-shadow:${current.className}`);
        }
        if (current === root) break;
      }
      return effects;
    });
    return {
      visibleRuleCount: rules.length,
      replicaEffects
    };
  });
  expect(audit.visibleRuleCount).toBe(expectedVisibleRuleCount);
  expect(audit.replicaEffects).toEqual([]);
}

async function expectIntegralPlanePaint(
  stage: Locator,
  expectedVisibleIntegralCount: number
): Promise<void> {
  const visibleIntegralCount = await stage.evaluate((root) => {
    const realized = (element: HTMLElement): boolean => {
      let opacity = 1;
      for (
        let current: HTMLElement | null = element;
        current !== null;
        current = current.parentElement
      ) {
        const style = getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }
        opacity *= Number(style.opacity);
        if (current === root) break;
      }
      return opacity > 0.01;
    };
    const candidates = [
      root.querySelector<HTMLElement>(
        '[data-kp-motion-id$=".initial.operator"]'
      ),
      root.querySelector<HTMLElement>(
        '[data-kp-antiderivative-pattern-fixed="operator"]'
      )
    ].filter((candidate): candidate is HTMLElement => candidate !== null);
    return candidates.filter(realized).length;
  });
  expect(visibleIntegralCount).toBe(expectedVisibleIntegralCount);
}

async function expectTransitReady(stage: Locator): Promise<void> {
  await expect.poll(async () => {
    const status = await stage.getAttribute(
      "data-kp-antiderivative-power-transit"
    );
    if (status === "repair-gap") {
      throw new Error(
        await stage.getAttribute(
          "data-kp-antiderivative-power-repair-gap-reason"
        ) ?? "Integration transit reported an untyped repair gap."
      );
    }
    return status;
  }, { timeout: 30_000 }).toBe("ready");
}

async function setPresentation(
  player: Locator,
  mode: "full-motion" | "reduced-motion" | "static"
): Promise<void> {
  await player.evaluate(async (element, requestedMode) => {
    const controllerPath = "/src/editor/animation-player-controller.ts";
    const playerElement = element as HTMLElement;
    playerElement.dataset["kpEditorAnimationAccessibilityMode"] = requestedMode;
    const controller = await import(controllerPath) as typeof import(
      "../src/editor/animation-player-controller.ts"
    );
    controller.dispatchKpEditorAnimationPlaybackAction(playerElement, {
      type: "resample"
    });
  }, mode);
}
