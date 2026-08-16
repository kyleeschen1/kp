import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.algebra.log-product.product-to-sum";
const multiFactorAnimationId =
  "animation.algebra.log-product.three-factors-to-sum";

test("log product mounts lazily and seeks through typed semantic tracks", async ({
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
  const stage = slot.locator("[data-kp-log-product-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(player).toBeAttached({ timeout: 15_000 });
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "log-product"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.log-product.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute("data-kp-log-product-stage", "ready");
  await expect(stage).toHaveAttribute(
    "data-kp-log-product-semantic-motion-recipe-id",
    "recipe.semantic-motion.log-product-fission.v1"
  );
  await expect(stage.locator(".kp-log-product-stage__endpoint")).toHaveCount(2);

  const tracks = JSON.parse(
    await stage.getAttribute("data-kp-log-product-track-summary") ?? "[]"
  ) as Array<{
    lifecycle: string;
    sourceEntityId?: string;
    targetEntityId?: string;
    semanticMotionUnitId?: string;
    timingGroupId?: string;
  }>;
  expect(tracks.filter(({ lifecycle }) => lifecycle === "split")).toHaveLength(0);
  for (const entityId of ["source.product.x", "source.product.y"]) {
    const matching = tracks.filter(({ sourceEntityId }) =>
      sourceEntityId === entityId
    );
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.every(({ semanticMotionUnitId, timingGroupId }) =>
      semanticMotionUnitId?.startsWith("correspondence.log-product.") &&
      timingGroupId?.startsWith("event.log-product.")
    )).toBe(true);
  }
  for (const entityId of [
    "source.log.operator",
    "source.log.open",
    "source.log.close"
  ]) {
    const matching = tracks.filter(({ sourceEntityId }) =>
      sourceEntityId === entityId
    );
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.every(({ lifecycle }) => lifecycle === "eliminate")).toBe(true);
  }
  for (const entityId of [
    "target.left.log.operator",
    "target.left.log.open",
    "target.left.log.close",
    "target.right.log.operator",
    "target.right.log.open",
    "target.right.log.close",
    "target.sum.plus"
  ]) {
    const matching = tracks.filter(({ targetEntityId }) =>
      targetEntityId === entityId
    );
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.every(({ lifecycle }) => lifecycle === "introduce")).toBe(true);
  }

  const snapshot = () => movingPaintSnapshot(stage);
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-progress",
      String(progress)
    );
  }
  await seek.fill("0.5");
  const firstHalf = await snapshot();
  await seek.fill("1");
  await seek.fill("0.5");
  expect(await snapshot()).toEqual(firstHalf);
  await seek.fill("0");
  await expect(stage).toHaveAttribute(
    "data-kp-log-product-visual-owner",
    "source-native"
  );
  await seek.fill("1");
  await expect(stage).toHaveAttribute(
    "data-kp-log-product-visual-owner",
    "target-native"
  );
  expect(pageErrors).toEqual([]);
});

test("three-factor product uses the same lazy surface and deterministic clock", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${multiFactorAnimationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${multiFactorAnimationId}"]`
  );
  const stage = player.locator("[data-kp-log-product-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "log-product"
  );
  await expect(stage).toHaveAttribute("data-kp-log-product-stage", "ready");
  await expect(stage.locator(".kp-log-product-stage__endpoint")).toHaveCount(2);
  const tracks = JSON.parse(
    await stage.getAttribute("data-kp-log-product-track-summary") ?? "[]"
  ) as Array<{ lifecycle: string; sourceEntityId?: string }>;
  for (const factor of ["x", "y", "z"] as const) {
    expect(tracks.some(({ lifecycle, sourceEntityId }) =>
      lifecycle === "persist" &&
      sourceEntityId === `source.xyz.product.${factor}`
    )).toBe(true);
  }
  for (const progress of [0, 0.35, 0.7, 1]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-progress",
      String(progress)
    );
  }
  await expect(stage).toHaveAttribute(
    "data-kp-log-product-visual-owner",
    "target-native"
  );
  expect(pageErrors).toEqual([]);
});

test("log product exposes one native equation under reduced motion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=0.5`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-product-stage]");
  await expect(stage).toHaveAttribute("data-kp-log-product-stage", "ready");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  const accessibility = await stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-log-product-stage__endpoint"
    )];
    const active = endpoints.filter((endpoint) =>
      endpoint.getAttribute("aria-hidden") === "false"
    );
    return {
      activeCount: active.length,
      activeHasMathMl: active[0]?.querySelector("math") !== null,
      inactiveAreInert: endpoints
        .filter((endpoint) => endpoint !== active[0])
        .every((endpoint) => endpoint.hasAttribute("inert")),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    };
  });
  expect(accessibility.activeCount).toBe(1);
  expect(accessibility.activeHasMathMl).toBe(true);
  expect(accessibility.inactiveAreInert).toBe(true);
  expect(accessibility.documentWidth).toBe(accessibility.viewportWidth);
});

async function movingPaintSnapshot(stage: Locator) {
  return stage.evaluate((root) =>
    [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].map((owner) => ({
      id: owner.dataset["kpEquationMaterialOwnerId"],
      left: owner.style.left,
      top: owner.style.top,
      width: owner.style.width,
      height: owner.style.height,
      opacity: owner.style.opacity,
      transform: owner.style.transform
    })).sort((left, right) => (left.id ?? "").localeCompare(right.id ?? ""))
  );
}
