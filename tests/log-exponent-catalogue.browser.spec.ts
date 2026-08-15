import { expect, test } from "@playwright/test";

const animationId =
  "animation.algebra.log-exponent.solve-two-power-x";

test("canonical log-exponent sequence mounts through its lazy native surface", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}`);

  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    `[data-kp-editor-animation-surface-slot="equation"]`
  );
  const stage = slot.locator("[data-kp-log-exponent-stage]");

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "algebra"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.log-exponent.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(stage.locator(".kp-log-exponent-stage__endpoint"))
    .toHaveCount(4);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  await player.locator('[data-action="seek-editor-animation"]').fill("0.16");
  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-log-exponent-operation-progress")
  )).toBeGreaterThan(0.45);
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-operation-choreography-id",
    "operation-choreography.transformation.log-exponent.apply-log-both-sides.forward"
  );
  const synchronizedOpacities = JSON.parse(
    await stage.getAttribute("data-kp-log-exponent-synchronized-opacities") ??
      "[]"
  ) as number[];
  expect(synchronizedOpacities.length).toBeGreaterThan(0);
  expect(Math.max(...synchronizedOpacities)).toBeGreaterThan(0);
  const wrapperOpacity = await stage.evaluate((root) => {
    const bySide = { left: [] as number[], right: [] as number[] };
    for (const owner of root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )) {
      const entityId =
        owner.dataset["kpEquationMaterialSemanticEntityId"] ?? "";
      if (entityId === "logged.left.log") {
        bySide.left.push(Number(getComputedStyle(owner).opacity));
      }
      if (entityId === "logged.right.log") {
        bySide.right.push(Number(getComputedStyle(owner).opacity));
      }
    }
    return bySide;
  });
  expect(wrapperOpacity.left.length).toBeGreaterThan(0);
  expect(wrapperOpacity.right.length).toBeGreaterThan(0);
  expect(Math.max(...wrapperOpacity.left)).toBeGreaterThan(0);
  expect(Math.max(...wrapperOpacity.right)).toBeGreaterThan(0);
  expect(new Set([...wrapperOpacity.left, ...wrapperOpacity.right]).size)
    .toBe(1);
  await player.locator('[data-action="seek-editor-animation"]').fill("0.872");
  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-log-exponent-operation-progress")
  )).toBeGreaterThan(0.75);
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-operation-choreography-id",
    "operation-choreography.transformation.log-exponent.divide-by-log-base.structural-entry.forward"
  );
  const structuralRule = stage.locator(
    '[data-kp-equation-material-semantic-entity-id="solved.right"]' +
    '[data-kp-equation-material-fragment-role="rule:rule-length"]'
  );
  await expect(structuralRule).toHaveCount(1);
  const ruleEntry = await structuralRule.evaluate((owner) => ({
    opacity: Number(getComputedStyle(owner).opacity),
    width: owner.getBoundingClientRect().width
  }));
  expect(ruleEntry.opacity).toBeGreaterThan(0);
  expect(ruleEntry.opacity).toBeLessThan(1);
  expect(ruleEntry.width).toBeGreaterThan(1);
  await player.locator('[data-action="seek-editor-animation"]').fill("0.95");
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-operation-id",
    "operation.log-exponent.divide-by-log-base"
  );
  await player.locator('[data-action="seek-editor-animation"]').fill("0.1");
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-operation-id",
    "operation.log-exponent.apply-log-both-sides"
  );
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  expect(pageErrors).toEqual([]);
});

test("catalogue route seeks the exact semantic sequence without replay", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.625`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-exponent-stage]");

  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-operation-id",
    "operation.log-exponent.extract-exponent"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.625"
  );
});

test("canonical checkpoint fits narrow reduced-motion viewports with one accessible equation", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=0.5`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-exponent-stage]");

  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await expect(stage.locator("[data-kp-editor-equation-material-layer]"))
    .toHaveAttribute("aria-hidden", "true");
  const accessibility = await stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-log-exponent-stage__endpoint"
    )];
    const active = endpoints.filter((endpoint) =>
      endpoint.getAttribute("aria-hidden") === "false"
    );
    const stageRect = root.getBoundingClientRect();
    return {
      activeCount: active.length,
      activeHasMathMl: active[0]?.querySelector("math") !== null,
      materialPaintIsHidden: [...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].every((owner) => Number(getComputedStyle(owner).opacity) === 0),
      inactiveAreInert: endpoints
        .filter((endpoint) => endpoint !== active[0])
        .every((endpoint) => endpoint.hasAttribute("inert")),
      stageLeft: stageRect.left,
      stageRight: stageRect.right,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    };
  });
  expect(accessibility.activeCount).toBe(1);
  expect(accessibility.activeHasMathMl).toBe(true);
  expect(accessibility.materialPaintIsHidden).toBe(true);
  expect(accessibility.inactiveAreInert).toBe(true);
  expect(accessibility.stageLeft).toBeGreaterThanOrEqual(0);
  expect(accessibility.stageRight).toBeLessThanOrEqual(
    accessibility.viewportWidth
  );
  expect(accessibility.documentWidth).toBe(accessibility.viewportWidth);
  await expect(stage.locator("[data-kp-log-exponent-status]"))
    .toHaveAttribute("aria-live", "polite");
  await expect(page.getByRole("button", { name: "Review" })).toBeVisible();
});
