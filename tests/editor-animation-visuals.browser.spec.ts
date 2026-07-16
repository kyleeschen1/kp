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
  await expect(semanticTransition)
    .toHaveAttribute("data-kp-editor-equation-motion-plan-id", /transition\.0$/);
  await expect(semanticTransition)
    .toHaveAttribute("data-kp-editor-equation-layout-plan-revision", "0");
  await expect(semanticTransition)
    .toHaveAttribute("data-kp-editor-equation-path-plan-count", /[1-9]/);
  await expect(semanticTransition)
    .toHaveAttribute("data-kp-editor-equation-semantic-next-checkpoint", /semantic-checkpoint/);
  await equationStage.evaluate((element) => {
    element.dataset["kpBrowserPersistentStageProbe"] = "mounted";
  });
  const initialMotionPlanId = await semanticTransition.getAttribute(
    "data-kp-editor-equation-motion-plan-id"
  );
  await player.locator("[data-kp-editor-animation-authoring-controls] summary").click();
  const regeneration = page.evaluate(() => new Promise((resolve) => {
    document.addEventListener("kp-editor-animation-regeneration-request", (event) => {
      resolve((event as CustomEvent).detail);
    }, { once: true });
  }));
  await player.locator('[data-kp-animation-authoring-control="path-preference"]')
    .selectOption("arc-below");
  expect(await regeneration).toMatchObject({
    kind: "editor-animation-regeneration-request",
    animationId: "animation.linear-solve.solve-x",
    authoringRevision: 1,
    presentation: { pathPreference: "arc-below" }
  });
  await expect(player).toHaveAttribute("data-kp-editor-animation-authoring-revision", "1");
  await expect(player).toHaveAttribute("data-kp-editor-animation-motion-plan-invalidated", "false");
  await expect(semanticTransition).toHaveAttribute(
    "data-kp-editor-equation-authoring-revision",
    "1"
  );
  expect(await semanticTransition.getAttribute("data-kp-editor-equation-motion-plan-id"))
    .not.toBe(initialMotionPlanId);
  await expect(equationStage).toHaveAttribute(
    "data-kp-browser-persistent-stage-probe",
    "mounted"
  );
  await expect(
    equationStage.locator(
      '[data-kp-editor-equation-source] [data-kp-motion-id*="after-subtract.lhs.plus3"]'
    )
  ).toHaveCSS("opacity", "1");
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
  await expect(player.locator("[data-kp-editor-equation-stage]"))
    .toHaveAttribute("data-kp-browser-persistent-stage-probe", "mounted");
});

test("accessible animation presentations share semantic checkpoints and keyboard transport", async ({ page }) => {
  await page.goto("/?animation=editor-animation.animation.generated.substitute-three");
  const player = page.locator("[data-kp-editor-animation-player]");
  const presentation = player.locator("[data-kp-editor-animation-accessibility-control]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const transition = player.locator("[data-kp-editor-equation-transition-id]");

  await presentation.selectOption("reduced-motion");
  await expect(player).toHaveAttribute("data-kp-editor-animation-accessibility-mode", "reduced-motion");
  await scrubber.fill("0.58");
  await expect(transition).toHaveAttribute("data-kp-editor-equation-accessibility-mode", "reduced-motion");
  await expect(transition).not.toHaveAttribute("data-kp-editor-equation-semantic-progress", "0.58");

  await presentation.selectOption("narrated");
  await scrubber.fill("0.58");
  await expect(player.locator("[data-kp-editor-animation-narration]"))
    .not.toHaveText("Animation checkpoint");

  await presentation.selectOption("static");
  await expect(player.getByRole("button", { name: "Play animation" })).toBeDisabled();

  await presentation.selectOption("full-motion");
  await player.focus();
  await page.keyboard.press("Home");
  await expect(scrubber).toHaveValue("0");
  await page.keyboard.press("ArrowRight");
  expect(Number(await scrubber.inputValue())).toBeGreaterThan(0);
  await page.keyboard.press("End");
  await expect(scrubber).toHaveValue("1");
  await page.keyboard.press("r");
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
});

test("gestalt style switching preserves semantic progress and the mounted equation stage", async ({
  page
}) => {
  await page.goto("/");
  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const style = player.locator(
    "[data-kp-editor-animation-gestalt-style-control]"
  );
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const diagnostics = player.locator(
    "[data-kp-editor-animation-gestalt-diagnostics]"
  );

  await scrubber.fill("0.43");
  await stage.evaluate((element) => {
    element.dataset["kpGestaltPersistentStageProbe"] = "mounted";
  });
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-gestalt-selected-style",
    "kp.organic-subtle@1.0.0"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-choreography-plan-id",
    /^choreography\./
  );
  await expect(diagnostics.locator("[data-kp-editor-gestalt-envelope-phase]"))
    .toContainText(/orient|reflow|act|settle|release/);
  await expect(diagnostics.locator("[data-kp-editor-gestalt-salience]"))
    .toContainText(/nodes/);
  await expect(diagnostics.locator("[data-kp-editor-gestalt-traversal]"))
    .not.toHaveText("pending");
  await expect(diagnostics.locator("[data-kp-editor-gestalt-capabilities]"))
    .toContainText("compatible");
  const organicRealization = await stage
    .locator("[data-kp-motion-id]")
    .evaluateAll((tokens) => tokens.slice(0, 8).map((token) => ({
      translate: (token as HTMLElement).style.translate,
      scale: (token as HTMLElement).style.scale
    })));

  await style.selectOption("kp.restrained-editorial@1.0.0");
  await expect(scrubber).toHaveValue("0.43");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "paused");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-gestalt-selected-style",
    "kp.restrained-editorial@1.0.0"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-gestalt-persistent-stage-probe",
    "mounted"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-gestalt-style",
    "kp.restrained-editorial@1.0.0"
  );
  await expect(diagnostics.locator("[data-kp-editor-gestalt-selected-style]"))
    .toHaveText("kp.restrained-editorial@1.0.0");
  await expect(diagnostics.locator("[data-kp-editor-gestalt-resolved-chain]"))
    .toContainText("kp.restrained-editorial@1.0.0");
  const restrainedRealization = await stage
    .locator("[data-kp-motion-id]")
    .evaluateAll((tokens) => tokens.slice(0, 8).map((token) => ({
      translate: (token as HTMLElement).style.translate,
      scale: (token as HTMLElement).style.scale
    })));
  expect(restrainedRealization).not.toEqual(organicRealization);
});

test("elevated focus adds depth without changing token x/y motion or layout", async ({
  page
}) => {
  await page.goto("/");
  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const focusControl = player.locator(
    "[data-kp-editor-animation-focus-experiment-control]"
  );
  const stage = player.locator("[data-kp-editor-equation-stage]");

  await scrubber.fill("0.43");
  const focusToken = stage.locator(".kp-focus-group").first();
  await expect(focusToken).toBeVisible();
  const flatGeometry = await focusToken.evaluate((element) => ({
    left: (element as HTMLElement).offsetLeft,
    top: (element as HTMLElement).offsetTop,
    xYTransform: (element as HTMLElement).style.transform
  }));
  await stage.evaluate((element) => {
    element.dataset["kpFocusPersistentStageProbe"] = "mounted";
  });

  await focusControl.selectOption("elevated");
  await expect(scrubber).toHaveValue("0.43");
  await expect(stage).toHaveAttribute(
    "data-kp-focus-persistent-stage-probe",
    "mounted"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-focus-experiment",
    "elevated"
  );
  await expect(focusToken).toHaveAttribute("data-kp-focus-profile", "elevated");
  const elevatedGeometry = await focusToken.evaluate((element) => ({
    left: (element as HTMLElement).offsetLeft,
    top: (element as HTMLElement).offsetTop,
    xYTransform: (element as HTMLElement).style.transform,
    transform: getComputedStyle(element).transform
  }));
  expect(elevatedGeometry.left).toBe(flatGeometry.left);
  expect(elevatedGeometry.top).toBe(flatGeometry.top);
  expect(elevatedGeometry.xYTransform).toBe(flatGeometry.xYTransform);
  expect(elevatedGeometry.transform).not.toBe("none");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-focus-xy-invariant",
    "true"
  );
  await expect(player.locator("[data-kp-editor-focus-invariance]"))
    .toHaveText("pass · same x/y path");

  await focusControl.selectOption("no-depth");
  await expect(scrubber).toHaveValue("0.43");
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-focus-experiment",
    "no-depth"
  );
  const noDepthGeometry = await focusToken.evaluate((element) => ({
    left: (element as HTMLElement).offsetLeft,
    top: (element as HTMLElement).offsetTop,
    xYTransform: (element as HTMLElement).style.transform,
    z: (element as HTMLElement).style.getPropertyValue("--kp-focus-z"),
    scale: (element as HTMLElement).style.getPropertyValue("--kp-focus-scale")
  }));
  expect(noDepthGeometry).toMatchObject({
    left: flatGeometry.left,
    top: flatGeometry.top,
    xYTransform: flatGeometry.xYTransform,
    z: "0px",
    scale: "1"
  });
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

test("linear-rearrangement choreography reserves, cancels, derives, recognizes, and releases", async ({
  page
}) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.animation.linear-solve.solve-x"
  );

  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const materialLayer = stage.locator(
    "[data-kp-editor-equation-material-layer]"
  );
  await stage.evaluate((element) => {
    element.dataset["kpLinearRearrangementStageProbe"] = "persistent";
  });
  await materialLayer.evaluate((element) => {
    element.dataset["kpMaterialLayerProbe"] = "persistent";
  });

  await scrubber.fill("0.1");
  let transition = player.locator("[data-kp-editor-equation-transition-id]");
  const leftInverse = transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id*="after-subtract.lhs.minus3"]'
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-linear-rearrangement",
    "balanced-introduction"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "reflow"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-active-subgraph-nodes",
    /reserve-space.*move-continuants/
  );
  expect(Number(await transition.getAttribute(
    "data-kp-editor-equation-reservation-progress"
  ))).toBeLessThan(1);
  await expect(leftInverse).toHaveCSS("opacity", "0");
  await expect(materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.x"]'
  )).toHaveCSS("opacity", "1");

  await scrubber.fill("0.14");
  expect(Number(await transition.getAttribute(
    "data-kp-editor-equation-reservation-progress"
  ))).toBe(1);
  expect(Number(await materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.minus3"]'
  ).evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeGreaterThan(0);
  const xMaterialOwner = materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.x"]'
  );
  const leftInverseMaterialOwner = materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.minus3"]'
  );
  await expect(xMaterialOwner).toHaveCount(1);
  await expect(leftInverseMaterialOwner).toHaveCount(1);
  await xMaterialOwner.evaluate((element) => {
    element.dataset["kpMaterialOwnerProbe"] = "same-owner";
  });
  await leftInverseMaterialOwner.evaluate((element) => {
    element.dataset["kpMaterialOwnerProbe"] = "same-introduced-owner";
  });

  await scrubber.fill("0.5");
  transition = player.locator("[data-kp-editor-equation-transition-id]");
  const plusThree = materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.plus3"]'
  );
  const minusThree = materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.minus3"]'
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-linear-rearrangement",
    "cancel-additive-inverses"
  );
  await expect(materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.x"]'
  )).toHaveAttribute("data-kp-material-owner-probe", "same-owner");
  await expect(materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.minus3"]'
  )).toHaveAttribute(
    "data-kp-material-owner-probe",
    "same-introduced-owner"
  );
  await scrubber.fill("0.333");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-envelope-bridge-attention",
    "transfer"
  );
  expect(Number(await transition.getAttribute(
    "data-kp-editor-equation-envelope-bridge-progress"
  ))).toBeGreaterThan(0.45);
  await scrubber.fill("0.5");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-active-subgraph-nodes",
    /meet-canceling-terms.*collapse-canceling-terms/
  );
  await expect(plusThree).toHaveCSS("opacity", "1");
  await expect(minusThree).toHaveCSS("opacity", "1");
  const meeting = await Promise.all([plusThree, minusThree].map((locator) =>
    locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, width: rect.width };
    })
  ));
  expect(Math.abs(meeting[1]!.x - meeting[0]!.x)).toBeLessThan(35);
  expect(meeting.every((pose) => pose.width > 24)).toBe(true);

  await scrubber.fill("0.56");
  expect(Number(await transition.getAttribute(
    "data-kp-editor-equation-collapse-progress"
  ))).toBeGreaterThan(0);
  expect(Number(await plusThree.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeGreaterThan(0);
  expect(Number(await plusThree.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeLessThan(1);
  expect(Number(await transition.getAttribute(
    "data-kp-editor-equation-persistent-reflow-progress"
  ))).toBeGreaterThan(0);
  await expect(materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.equals"]'
  )).toHaveCSS("opacity", "1");

  await scrubber.fill("0.84");
  transition = player.locator("[data-kp-editor-equation-transition-id]");
  const seven = materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.rhs.7"]'
  );
  const inverse = materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.rhs.minus3"]'
  );
  const result = materialLayer.locator(
    '[data-kp-equation-material-owner-id="linear-solve.rhs.4"]'
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-linear-rearrangement",
    "simplify-constant-difference"
  );
  await expect(result).toHaveCSS("opacity", "0");
  await expect(seven).toHaveCSS("opacity", "1");
  await expect(inverse).toHaveCSS("opacity", "1");
  const operandArcs = await Promise.all([seven, inverse].map((locator) =>
    locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top + rect.height / 2;
    })
  ));
  expect(operandArcs[0]).toBeLessThan(operandArcs[1]!);

  await scrubber.fill("0.92");
  const resultOpacity = Number(await result.evaluate(
    (element) => getComputedStyle(element).opacity
  ));
  expect(resultOpacity).toBeGreaterThan(0);
  expect(resultOpacity).toBeLessThan(1);
  expect(Number(await seven.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeGreaterThan(0);
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-active-subgraph-nodes",
    /recognize/
  );

  await scrubber.fill("1");
  const nativeResult = transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id*="solved.rhs.4"]'
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "release"
  );
  await expect(nativeResult).toHaveCSS("opacity", "1");
  await expect(materialLayer.locator(
    "[data-kp-equation-material-owner-id]"
  )).toHaveCount(0);
  await expect(transition.locator("[data-kp-editor-linear-shared-shadow]"))
    .toHaveCount(0);
  await expect(transition.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id*="left-simplified.rhs.7"]'
  )).toHaveCSS("--kp-focus-z", "0px");
  await expect(stage).toHaveAttribute(
    "data-kp-linear-rearrangement-stage-probe",
    "persistent"
  );
  await expect(materialLayer).toHaveAttribute(
    "data-kp-material-layer-probe",
    "persistent"
  );
});

test("linear material owners survive rewind and accessibility projection", async ({
  page
}) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.animation.linear-solve.solve-x"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const xOwner = stage.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.x"]'
  );

  await scrubber.fill("0.35");
  await xOwner.evaluate((element) => {
    element.dataset["kpRewindOwnerProbe"] = "same-material";
  });
  const forwardRect = await xOwner.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y };
  });
  await player.getByRole("button", { name: "Rewind" }).click();
  await scrubber.fill("0.65");
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-semantic-progress",
    "0.35"
  );
  await expect(xOwner).toHaveAttribute(
    "data-kp-rewind-owner-probe",
    "same-material"
  );
  const rewindRect = await xOwner.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y };
  });
  expect(Math.abs(rewindRect.x - forwardRect.x)).toBeLessThan(0.75);
  expect(Math.abs(rewindRect.y - forwardRect.y)).toBeLessThan(0.75);

  await player.locator(
    "[data-kp-editor-animation-accessibility-control]"
  ).selectOption("reduced-motion");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await expect(xOwner).toHaveAttribute(
    "data-kp-rewind-owner-probe",
    "same-material"
  );
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

test("radical-succession uses independent opposite-corner tokens and native settle", async ({
  page
}) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.radical-rewrite.square-root-as-power"
  );

  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  const sourceBase = transition.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id*=".power.base"]'
  );
  const sourceNotation = transition.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id*=".power.exponent-"]'
  );
  const targetRadical = transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id*=".radical.radical-symbol"]'
  );
  await stage.evaluate((element) => {
    element.dataset["kpRadicalStageProbe"] = "persistent";
  });

  await scrubber.fill("0.1");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "orient"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-path-requirement",
    "opposite-corner"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-propagation-rule",
    "far-to-near"
  );
  await expect(
    transition.locator("[data-kp-editor-radical-shared-shadow]")
  ).toHaveCount(1);

  await scrubber.fill("0.25");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "reflow"
  );
  expect(Number(await transition.getAttribute(
    "data-kp-editor-equation-continuant-reflow-progress"
  ))).toBeGreaterThan(0);
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-source-gather-progress",
    "0"
  );
  expect(await sourceBase.getAttribute("style")).toContain("translate(");
  await expect(sourceNotation).toHaveCount(3);
  for (const token of await sourceNotation.all()) {
    await expect(token).toHaveCSS("opacity", "1");
    expect(await token.getAttribute("style")).toContain("translate(0px, 0px)");
  }
  await expect(targetRadical).toHaveCSS("opacity", "0");

  await scrubber.fill("0.55");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "act"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-representational-succession",
    "opposite-corner-seed"
  );
  expect(Number(await transition.getAttribute(
    "data-kp-editor-equation-source-gather-progress"
  ))).toBeGreaterThan(0.9);
  for (const token of await sourceNotation.all()) {
    await expect(token).toHaveCSS("opacity", "1");
    await expect(token).toHaveAttribute(
      "data-kp-equation-motion-path-variant",
      "opposite-corner"
    );
    expect(await token.getAttribute("style")).not.toContain("scale(0)");
  }
  const radicalOpacity = Number(
    await targetRadical.evaluate((element) => getComputedStyle(element).opacity)
  );
  expect(radicalOpacity).toBeGreaterThan(0.01);
  expect(radicalOpacity).toBeLessThan(1);
  await expect(
    transition.locator("[data-kp-editor-equation-source]")
  ).toHaveCSS("transform", "none");
  await expect(
    transition.locator("[data-kp-editor-equation-target]")
  ).toHaveCSS("transform", "none");
  await expect(stage).toHaveAttribute(
    "data-kp-radical-stage-probe",
    "persistent"
  );

  await scrubber.fill("1");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "release"
  );
  await expect(
    transition.locator("[data-kp-editor-radical-shared-shadow]")
  ).toHaveCount(0);
  for (const token of await sourceNotation.all()) {
    await expect(token).toHaveCSS("opacity", "0");
  }
  await expect(targetRadical).toHaveCSS("opacity", "1");
  expect(await targetRadical.getAttribute("style")).toContain(
    "translate(0px, 0px)"
  );
  expect(await targetRadical.getAttribute("style")).toContain("scale(1)");
  await expect(
    transition.locator("[data-kp-equation-motion-clone-for]")
  ).toHaveCount(0);
});

test("function-wrap-family animation visibly wraps and rewinds its argument", async ({
  page
}) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.function-wrap.apply-f"
  );

  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  const sourceArgument = player.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id$=".input.value"]'
  );
  const targetLeftParen = player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".wrapped.left-paren"]'
  );
  await stage.evaluate((element) => {
    element.dataset["kpFunctionWrapStageProbe"] = "persistent";
  });

  await scrubber.fill("0.1");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "orient"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-plan-id",
    /choreography\..*wrap-function/
  );
  await expect(sourceArgument).toHaveClass(/kp-focus-group/);
  await expect(sourceArgument).toHaveCSS("opacity", "1");

  await scrubber.fill("0.35");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "reflow"
  );
  await expect(sourceArgument).toHaveCSS("opacity", "1");
  await expect(targetLeftParen).toHaveCSS("opacity", "0");

  await scrubber.fill("0.5");
  await expect(transition)
    .toHaveAttribute("data-kp-editor-equation-motif", "wrap");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "act"
  );
  await expect(player.locator("[data-kp-editor-equation-source]"))
    .toContainText("x");
  await expect(player.locator("[data-kp-editor-equation-target]"))
    .toContainText("f(x)");
  await expect(player.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-semantic-motion", "active");
  expect(Number(await player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id*="wrapped.function"]'
  ).evaluate((element) => getComputedStyle(element).opacity))).toBeLessThan(0.05);
  expect(Number(await targetLeftParen.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeGreaterThan(0);
  await expect(stage).toHaveAttribute(
    "data-kp-function-wrap-stage-probe",
    "persistent"
  );

  await scrubber.fill("0.85");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "settle"
  );
  await scrubber.fill("1");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-choreography-phase",
    "release"
  );
  await expect(sourceArgument).toHaveCSS("opacity", "0");
  await expect(sourceArgument).toHaveCSS("--kp-focus-z", "0px");
  await expect(sourceArgument).toHaveCSS("--kp-focus-scale", "1");

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

test("dot-product traversal follows semantic indices and preserves accumulated products", async ({
  page
}) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.animation.generated.linear-algebra.dot-product.three-vector"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await stage.evaluate((element) => {
    element.dataset["kpDotProductStageProbe"] = "persistent";
  });

  await scrubber.fill("0.18");
  let transition = player.locator("[data-kp-editor-equation-transition-id]");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-motif",
    "dot-product-accumulate"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-traversal-order",
    "0 1 2"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-active-contribution-indices",
    "0"
  );
  const contribution0 = transition.locator(
    '[data-kp-editor-dot-product-contribution="0"]'
  );
  expect(Number(await contribution0.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeGreaterThan(0);
  await expect(transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id*="result.scalar"]'
  )).toHaveCSS("opacity", "0");

  await scrubber.fill("0.25");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-active-contribution-indices",
    "0 1"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-accumulated-through-index",
    "0"
  );
  await expect(transition.locator(
    "[data-kp-editor-dot-product-accumulation]"
  )).toContainText("4");

  await scrubber.fill("0.33");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-active-contribution-indices",
    "1 2"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-accumulated-through-index",
    "1"
  );
  await expect(transition.locator(
    "[data-kp-editor-dot-product-accumulation]"
  )).toContainText("4+10=14");
  await expect(contribution0).toHaveAttribute(
    "data-kp-editor-dot-product-contribution-status",
    "accumulated"
  );
  expect(Number(await contribution0.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeGreaterThan(0);

  await scrubber.fill("0.42");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-active-contribution-indices",
    "2"
  );
  await expect(transition.locator(
    "[data-kp-editor-dot-product-accumulation]"
  )).toContainText("4+10+18=32");
  const contributionOpacities = await transition.locator(
    "[data-kp-editor-dot-product-contribution]"
  ).evaluateAll((elements) =>
    elements.map((element) => Number(getComputedStyle(element).opacity))
  );
  expect(contributionOpacities[0]).toBeGreaterThan(0);
  expect(contributionOpacities[1]).toBeGreaterThan(0);
  expect(contributionOpacities[2]).toBe(1);
  await expect(player.locator("[data-kp-editor-animation-narration]"))
    .toContainText("Pair 3");

  await scrubber.fill("0.85");
  const sourceOpacity = Number(await transition.locator(
    "[data-kp-editor-equation-source] [data-kp-motion-id]"
  ).first().evaluate((element) => getComputedStyle(element).opacity));
  const targetOpacity = Number(await transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id*="result.scalar"]'
  ).evaluate((element) => getComputedStyle(element).opacity));
  expect(sourceOpacity).toBeGreaterThan(0);
  expect(sourceOpacity).toBeLessThan(1);
  expect(targetOpacity).toBeGreaterThan(0);
  expect(targetOpacity).toBeLessThan(1);
  await expect(player.locator("[data-kp-editor-animation-narration]"))
    .toContainText("accumulate to 32");

  await scrubber.fill("1");
  await expect(transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id*="result.scalar"]'
  )).toHaveCSS("opacity", "1");
  await expect(transition.locator(
    "[data-kp-editor-equation-source] [data-kp-motion-id]"
  ).first()).toHaveCSS("opacity", "0");
  await expect(transition.locator(
    "[data-kp-editor-dot-product-shared-shadow]"
  )).toHaveCount(0);
  await expect(transition.locator(
    "[data-kp-editor-dot-product-contribution]"
  ).first()).toHaveCSS("opacity", "0");
  await expect(stage).toHaveAttribute(
    "data-kp-dot-product-stage-probe",
    "persistent"
  );
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

  expect(checked).toBe(32);
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

test("generated substitution transmits a persistent value along semantic paths", async ({ page }) => {
  await page.goto("/?animation=editor-animation.animation.generated.substitute-three");
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.generated.substitute-three"
  );
  await player.locator('[data-action="seek-editor-animation"]').fill("0.58");
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  await expect(transition).toHaveAttribute("data-kp-editor-equation-motif", "substitute");
  await expect(transition.locator("[data-kp-editor-equation-source]")).toContainText("3⇒x+2");
  await expect(transition.locator("[data-kp-editor-equation-target]")).toContainText("3⇒3+2");
  await expect(transition.locator('[data-kp-equation-lineage-path-id]')).toHaveCount(2);
  await expect(transition.locator('[data-kp-equation-motion-path-variant="arc-above"]')).toHaveCount(1);
  await expect(transition.locator('[data-kp-equation-motion-path-variant="arc-below"]')).toHaveCount(1);
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
