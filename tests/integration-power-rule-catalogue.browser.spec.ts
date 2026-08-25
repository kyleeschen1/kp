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
    "kp.rendering.native-katex.antiderivative-template-instantiation-profile.v1"
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

  await seek.fill("0.28");
  await expectTransitReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    "material-scene"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-application",
    "prospective-scaffold-binding"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-template-trace-role",
    "prospective"
  );
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-scaffold-presence"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-binding-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-antiderivative-template-syntax-presence"
  ))).toBe(0);
  await expect.poll(() => visibleTemplateScaffoldOwners(stage))
    .toBeGreaterThan(0);
  await expect.poll(() => visibleMaterialOwners(stage)).toBeGreaterThan(0);
  expect(await visiblePaintOwnerKinds(stage)).toEqual(["material"]);

  await seek.fill("0.43");
  await expectTransitReady(stage);
  const visibleConstant = stage.locator(
    '[data-kp-motion-id$=".expanded.constant"]'
  );
  await expect(visibleConstant).toHaveCount(1);
  await expect.poll(() => renderedOpacity(visibleConstant))
    .toBeGreaterThan(0);

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
    "material-scene"
  );
  const lightColor = await visibleMaterialColor(stage);

  await page.goto(`/?artifact=${animationId}&playhead=0.28&theme=dark`);
  const darkPlayer = cataloguePlayer(page);
  const darkStage = darkPlayer.locator("[data-kp-editor-equation-stage]");
  await expectTransitReady(darkStage);
  const darkColor = await visibleMaterialColor(darkStage);
  expect(darkColor).not.toBe(lightColor);

  await setPresentation(darkPlayer, "reduced-motion");
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-power-accessibility-projection",
    "reduced"
  );
  await expect(darkStage).toHaveAttribute(
    "data-kp-antiderivative-power-visual-owner",
    /source-native|target-native/
  );
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

async function visibleMaterialOwners(stage: Locator): Promise<number> {
  return stage.locator("[data-kp-equation-material-owner-id]")
    .evaluateAll((owners) => owners.filter((owner) => {
      const style = getComputedStyle(owner);
      return style.visibility !== "hidden" && Number(style.opacity) > 0.01;
    }).length);
}

async function visibleTemplateScaffoldOwners(stage: Locator): Promise<number> {
  return stage.locator(
    '[data-kp-equation-material-semantic-entity-id$=".expanded.exact-quotient"]'
  ).evaluateAll((owners) => owners.filter((owner) =>
    Number(getComputedStyle(owner).opacity) > 0.01 &&
    (owner as HTMLElement).dataset["kpSemanticTraceRole"] === "prospective"
  ).length);
}

async function visiblePaintOwnerKinds(stage: Locator): Promise<string[]> {
  return stage.evaluate((root) => {
    const visible = (element: HTMLElement): boolean => {
      const style = getComputedStyle(element);
      return style.visibility !== "hidden" && Number(style.opacity) > 0.01;
    };
    return [
      ...([...root.querySelectorAll<HTMLElement>(
        "[data-kp-editor-equation-source], [data-kp-editor-equation-target]"
      )].some(visible) ? ["native"] : []),
      ...([...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].some(visible) ? ["material"] : [])
    ];
  });
}

async function visibleMaterialColor(stage: Locator): Promise<string> {
  return stage.locator("[data-kp-equation-material-owner-id]")
    .evaluateAll((owners) => {
      const visible = owners.find((owner) => {
        const style = getComputedStyle(owner);
        return style.visibility !== "hidden" && Number(style.opacity) > 0.01;
      });
      if (!(visible instanceof HTMLElement)) {
        throw new Error("No visible integration material owner.");
      }
      return getComputedStyle(visible).color;
    });
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
