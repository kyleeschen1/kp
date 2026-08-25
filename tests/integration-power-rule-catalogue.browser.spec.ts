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
    "kp.rendering.native-katex.antiderivative-power-material-transit.v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-profile-id",
    "kp.rendering.native-katex.antiderivative-template-instantiation-profile.v5"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-handoff-source",
    "instantiated-rule-rhs"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    "source-native"
  );
  await expect(stage.locator("[data-kp-editor-equation-source] .katex"))
    .toContainText("∫x2dx");

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

  await seek.fill("0.16");
  await expectTransitReady(stage);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-operator-opacity"
  ))).toBe(0);
  await expect.poll(() => renderedOpacity(operator)).toBe(0);

  await seek.fill("0.24");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    "source-native"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-application",
    "receiving-scaffold-binding"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-trace-role",
    "prospective"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-preview-presence"
  ))).toBe(1);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-scaffold-presence"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-binding-progress"
  ))).toBe(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-syntax-presence"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-syntax-resolution-progress"
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
  const grammar = stage.locator(
    '[data-kp-antiderivative-template-paint-role="grammar"]'
  );
  await expect.poll(() => grammar.count()).toBeGreaterThan(0);
  await expect(grammar.first()).toHaveAttribute(
    "data-kp-semantic-salience-level",
    "focus"
  );
  const rulePanel = stage.locator(
    "[data-kp-antiderivative-rule-template]"
  );
  const generalRule = rulePanel.locator(
    "[data-kp-antiderivative-general-rule]"
  );
  const ruleBindings = rulePanel.locator(
    "[data-kp-antiderivative-rule-bindings]"
  );
  const instantiatedRule = rulePanel.locator(
    "[data-kp-antiderivative-instantiated-rule]"
  );
  const instantiatedResult = instantiatedRule.locator(
    "[data-kp-antiderivative-template-result]"
  );
  await expect(rulePanel).toHaveCount(1);
  await expect(rulePanel).toHaveAttribute("aria-hidden", "false");
  await expect(generalRule).toHaveAttribute(
    "data-kp-antiderivative-general-rule",
    /\\int u\^n/u
  );
  await expect.poll(() => renderedOpacity(generalRule)).toBe(1);
  await expect.poll(() => renderedOpacity(ruleBindings)).toBe(0);
  await expect.poll(() => renderedOpacity(instantiatedRule)).toBe(0);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-accessible-endpoint",
    "rule-template"
  );

  await seek.fill("0.3");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-receiver-focus",
    "1.0000"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-binding-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-binding-progress"
  ))).toBeLessThan(1);
  await expect.poll(() => renderedOpacity(generalRule)).toBe(1);
  await expect.poll(() => renderedOpacity(ruleBindings)).toBe(1);
  await expect.poll(() => renderedOpacity(instantiatedRule)).toBe(0);
  await expect(rulePanel).toHaveAttribute(
    "aria-label",
    /u maps to x, and n maps to 2/u
  );

  await seek.fill("0.37");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-binding-progress",
    "1.0000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-receiver-settlement-progress",
    "0.0000"
  );
  await expect.poll(() => renderedOpacity(instantiatedRule)).toBe(1);
  await expect.poll(() => renderedOpacity(ruleBindings)).toBe(1);
  await expect(instantiatedResult).toHaveCount(1);
  await expect(instantiatedResult.locator(".frac-line")).toHaveCount(1);
  await expect(rulePanel).toHaveAttribute(
    "aria-label",
    /Instantiated power rule/u
  );

  await seek.fill("0.424");
  await expectTransitReady(stage);
  const templateFractionRect = await elementRect(
    instantiatedResult.locator(".frac-line")
  );
  const templateConstant = instantiatedResult.locator(
    '[data-kp-antiderivative-template-source-selector-id$=".expanded.constant"]'
  );
  await expect(templateConstant).toHaveCount(1);
  const templateConstantRect = await textPaintRect(templateConstant);
  const templateFractionToConstantGap =
    rectCenterX(templateConstantRect) - rectCenterX(templateFractionRect);
  expect(await effectiveOpacity(instantiatedResult.locator(".frac-line")))
    .toBeGreaterThan(0.99);

  await seek.fill("0.425");
  await expectTransitReady(stage);
  const materialFraction = stage.locator(
    '[data-kp-equation-material-fragment-role="rule:rule-length"]'
  );
  await expect(materialFraction).toHaveCount(1);
  const materialStartRect = await elementRect(materialFraction);
  expect(maxRectDelta(templateFractionRect, materialStartRect))
    .toBeLessThan(2);
  expect(await effectiveOpacity(instantiatedResult.locator(".frac-line")))
    .toBe(0);
  expect(await effectiveOpacity(materialFraction)).toBeGreaterThan(0.99);
  expect(await renderedOpacity(stage.locator(
    "[data-kp-editor-equation-source]"
  ))).toBe(0);
  const materialConstant = stage.locator(
    '[data-kp-equation-material-semantic-entity-id$=".expanded.constant"]'
  );
  await expect(materialConstant).toHaveCount(1);
  const materialConstantStartRect = await textPaintRect(materialConstant);
  expect(Math.hypot(
    rectCenterX(templateConstantRect) -
      rectCenterX(materialConstantStartRect),
    rectCenterY(templateConstantRect) -
      rectCenterY(materialConstantStartRect)
  ))
    .toBeLessThan(3);

  await seek.fill("0.44");
  await expectTransitReady(stage);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-receiver-settlement-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-receiver-settlement-progress"
  ))).toBeLessThan(1);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-rewrite-handoff-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(() => renderedOpacity(instantiatedRule)).toBe(0);
  await expect.poll(() => renderedOpacity(rulePanel)).toBe(0);
  const materialMidRect = await elementRect(materialFraction);
  const materialConstantMidRect = await textPaintRect(materialConstant);
  expect(Math.abs(rectCenterX(materialMidRect) -
    rectCenterX(materialStartRect))).toBeGreaterThan(8);
  expect(Math.abs(
    rectCenterX(materialConstantMidRect) - rectCenterX(materialMidRect) -
      templateFractionToConstantGap
  )).toBeLessThan(2);

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
  await expect.poll(() => renderedOpacity(rulePanel)).toBe(0);
  await expect(templateReceiver).toHaveAttribute("aria-hidden", "true");

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
  await expect(stage.locator("[data-kp-editor-equation-source] .katex"))
    .toContainText("2+1");
  await expect(stage.locator("[data-kp-editor-equation-source] .katex"))
    .toContainText("+C");

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

  await seek.fill("1");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-evaluation-native-settlement",
    "target"
  );
  const finalKatex = stage.locator("[data-kp-editor-equation-target] .katex");
  await expect(finalKatex).toContainText("x3");
  await expect(finalKatex).toContainText("+C");
  expect(pageErrors).toEqual([]);
});

test("integration Catalogue lifecycle restores, rewinds, themes, and exposes static truth", async ({
  page
}) => {
  test.setTimeout(60_000);
  await page.goto(`/?artifact=${animationId}&playhead=0.28&theme=light`);
  const player = cataloguePlayer(page);
  const seek = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await expectTransitReady(stage);
  await expect(seek).toHaveValue("0.28");
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-development-theme",
    "light"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    "source-native"
  );
  const lightTemplateRule = stage.locator(
    "[data-kp-antiderivative-general-rule]"
  );
  await expect(lightTemplateRule).toBeVisible();
  const lightTemplateColor = await lightTemplateRule.evaluate((element) =>
    getComputedStyle(element).color
  );

  await page.goto(`/?artifact=${animationId}&playhead=0.28&theme=dark`);
  const darkPlayer = cataloguePlayer(page);
  const darkStage = darkPlayer.locator("[data-kp-editor-equation-stage]");
  await expectTransitReady(darkStage);
  const darkTemplateRule = darkStage.locator(
    "[data-kp-antiderivative-general-rule]"
  );
  await expect(darkTemplateRule).toBeVisible();
  const darkTemplateColor = await darkTemplateRule.evaluate((element) =>
    getComputedStyle(element).color
  );
  expect(darkTemplateColor).not.toBe(lightTemplateColor);

  await setPresentation(darkPlayer, "reduced-motion");
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-power-accessibility-projection",
    "reduced"
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
    "7200"
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
        Number(root.dataset["kpAntiderivativeGeneralRulePresence"]) === 1
      ) marks.recognitionAt = now;
      if (
        marks.bindingAt === undefined &&
        Number(root.dataset[
          "kpAntiderivativeMetavariableBindingsPresence"
        ]) === 1
      ) marks.bindingAt = now;
      if (
        marks.instantiatedAt === undefined &&
        Number(root.dataset["kpAntiderivativeInstantiatedRulePresence"]) === 1
      ) marks.instantiatedAt = now;
      if (
        marks.handoffAt === undefined &&
        Number(root.dataset["kpAntiderivativeRewriteHandoffProgress"]) > 0.05
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

  expect(marks.bindingAt - marks.recognitionAt).toBeGreaterThan(500);
  expect(marks.instantiatedAt - marks.bindingAt).toBeGreaterThan(350);
  expect(marks.handoffAt - marks.instantiatedAt).toBeGreaterThan(250);
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

async function textPaintRect(locator: Locator): Promise<TestRect> {
  return locator.evaluate((element) => {
    const range = element.ownerDocument.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  });
}

async function effectiveOpacity(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    let opacity = 1;
    let current: Element | null = element;
    while (current !== null) {
      opacity *= Number(getComputedStyle(current).opacity);
      current = current.parentElement;
    }
    return opacity;
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

function rectCenterX(rect: TestRect): number {
  return rect.left + rect.width / 2;
}

function rectCenterY(rect: TestRect): number {
  return rect.top + rect.height / 2;
}

async function renderedOpacity(locator: Locator): Promise<number> {
  return locator.evaluate((element) => Number(getComputedStyle(element).opacity));
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
