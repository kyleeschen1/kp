import { expect, test, type Locator } from "@playwright/test";
import {
  measureVisibleKpMaterialInkGeometry
} from "./support/native-katex-material-ink-geometry.ts";

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
    visualEntityId?: string;
    visualKey?: string;
    semanticMotionUnitId?: string;
    timingGroupId?: string;
    motionAxisConstraint?: string;
    motionPathVariant?: string;
  }>;
  const derivedOperatorTracks = tracks.filter(({ targetEntityId, visualKey }) =>
    targetEntityId?.endsWith(".log.operator") === true &&
    visualKey === "glyph:ln"
  );
  expect(derivedOperatorTracks).toHaveLength(2);
  expect(derivedOperatorTracks.every(({ motionAxisConstraint, motionPathVariant }) =>
    motionAxisConstraint === undefined && motionPathVariant === undefined
  )).toBe(true);
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

test("binary handoff contracts operators through its match-dissolve", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-product-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect.poll(
    () => stage.getAttribute("data-kp-log-product-stage"),
    { timeout: 15_000 }
  )
    .not.toBe("preparing");
  if (await stage.getAttribute("data-kp-log-product-stage") === "failed") {
    throw new Error(
      await stage.getAttribute("data-kp-log-product-error") ??
      "Log-product stage failed without diagnostics."
    );
  }
  await expect(stage).toHaveAttribute("data-kp-log-product-stage", "ready");

  const at = async (progress: number, entityIds: readonly string[]) => {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-progress",
      String(progress)
    );
    return visibleMaterialGeometry(stage, entityIds);
  };
  const operatorIds = [
    "target.left.log.operator",
    "target.right.log.operator"
  ] as const;
  const sourceOperatorStart = await at(0.18, ["source.log.operator"]);
  const sourceOperatorMidpoint = await at(0.23, ["source.log.operator"]);
  const sourceOperatorPoint = await at(0.28, ["source.log.operator"]);
  const sourceSamples = [
    sourceOperatorStart,
    sourceOperatorMidpoint,
    sourceOperatorPoint
  ].map((geometry) => geometry["source.log.operator"]!);
  const sourceCenterXs = sourceSamples.map(
    ({ left, width }) => left + width / 2
  );
  const sourceCenterYs = sourceSamples.map(
    ({ top, height }) => top + height / 2
  );
  expect(sourceSamples[0]!.width).toBeGreaterThan(sourceSamples[1]!.width);
  expect(sourceSamples[1]!.width).toBeGreaterThan(sourceSamples[2]!.width);
  expect(Math.max(...sourceCenterXs) - Math.min(...sourceCenterXs))
    .toBeLessThanOrEqual(1.25);
  expect(Math.max(...sourceCenterYs) - Math.min(...sourceCenterYs))
    .toBeLessThanOrEqual(1.25);
  await seek.fill("0.48");
  await expect(stage).toHaveAttribute("data-kp-log-product-progress", "0.48");
  expect(await visibleMaterialCount(stage, [
    "source.log.operator",
    ...operatorIds
  ])).toBe(0);
  const operatorEntry = await at(0.55, operatorIds);
  const operatorMidpoint = await at(0.6, operatorIds);
  const operatorSettlement = await at(0.64, operatorIds);
  for (const entityId of operatorIds) {
    const samples = [operatorEntry, operatorMidpoint, operatorSettlement]
      .map((geometry) => geometry[entityId]!);
    const centerXs = samples.map(({ left, width }) => left + width / 2);
    const centerYs = samples.map(({ top, height }) => top + height / 2);
    expect(Math.max(...centerXs) - Math.min(...centerXs))
      .toBeLessThanOrEqual(1.25);
    expect(Math.max(...centerYs) - Math.min(...centerYs))
      .toBeLessThanOrEqual(1.25);
    expect(samples[0]!.width).toBeLessThan(samples[1]!.width);
    expect(samples[1]!.width).toBeLessThan(samples[2]!.width);
    expect(samples[2]!.width).toBeGreaterThan(samples[0]!.width * 3);
  }
  await seekAndWait(stage, seek, 0.5);
  expect(await visibleMaterialCount(stage, ["target.sum.plus"])).toBe(0);
  await seekAndWait(stage, seek, 0.58);
  expect(await visibleMaterialCount(stage, ["target.sum.plus"])).toBe(1);
  const connectorEntry = await at(0.55, ["target.sum.plus"]);
  const connectorMidpoint = await at(0.6, ["target.sum.plus"]);
  const connectorSettlement = await at(0.64, ["target.sum.plus"]);
  const connectorSamples = [
    connectorEntry,
    connectorMidpoint,
    connectorSettlement
  ].map((geometry) => geometry["target.sum.plus"]!);
  const connectorCenterXs = connectorSamples.map(
    ({ left, width }) => left + width / 2
  );
  const connectorCenterYs = connectorSamples.map(
    ({ top, height }) => top + height / 2
  );
  expect(Math.max(...connectorCenterXs) - Math.min(...connectorCenterXs))
    .toBeLessThanOrEqual(1.25);
  expect(Math.max(...connectorCenterYs) - Math.min(...connectorCenterYs))
    .toBeLessThanOrEqual(1.25);
  expect(connectorSamples[0]!.width).toBeLessThan(connectorSamples[1]!.width);
  expect(connectorSamples[1]!.width).toBeLessThan(connectorSamples[2]!.width);
  expect(connectorSamples[2]!.width)
    .toBeGreaterThan(connectorSamples[0]!.width * 3);

  const enclosureIds = [
    "target.left.log.open",
    "target.left.log.close",
    "target.right.log.open",
    "target.right.log.close"
  ] as const;
  const enclosureEntry = await at(0.48, enclosureIds);
  const enclosureMidpoint = await at(0.56, enclosureIds);
  const enclosureSettlement = await at(0.64, enclosureIds);
  for (const prefix of ["target.left.log", "target.right.log"]) {
    const leading = [enclosureEntry, enclosureMidpoint, enclosureSettlement]
      .map((geometry) => geometry[`${prefix}.open`]!);
    const trailing = [enclosureEntry, enclosureMidpoint, enclosureSettlement]
      .map((geometry) => geometry[`${prefix}.close`]!);
    expect(leading[0]!.left).toBeLessThan(leading[1]!.left);
    expect(leading[1]!.left).toBeLessThan(leading[2]!.left);
    expect(trailing[0]!.left).toBeGreaterThan(trailing[1]!.left);
    expect(trailing[1]!.left).toBeGreaterThan(trailing[2]!.left);
    expect(leading[2]!.left - leading[0]!.left)
      .toBeGreaterThan(leading[2]!.height * 0.25);
    expect(leading[2]!.left - leading[0]!.left)
      .toBeLessThan(leading[2]!.height * 0.7);
    expect(trailing[0]!.left - trailing[2]!.left)
      .toBeGreaterThan(trailing[2]!.height * 0.25);
    expect(trailing[0]!.left - trailing[2]!.left)
      .toBeLessThan(trailing[2]!.height * 0.7);
  }
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
  ) as Array<{
    lifecycle: string;
    sourceEntityId?: string;
    targetEntityId?: string;
    visualKey?: string;
    motionAxisConstraint?: string;
    motionPathVariant?: string;
  }>;
  for (const factor of ["x", "y", "z"] as const) {
    expect(tracks.some(({ lifecycle, sourceEntityId }) =>
      lifecycle === "persist" &&
      sourceEntityId === `source.xyz.product.${factor}`
    )).toBe(true);
  }
  const derivedOperators = tracks.filter(({ targetEntityId, visualKey }) =>
    targetEntityId?.endsWith(".log.operator") === true &&
    visualKey === "glyph:ln"
  );
  expect(derivedOperators).toHaveLength(3);
  expect(derivedOperators.every(({ motionAxisConstraint, motionPathVariant }) =>
    motionAxisConstraint === undefined && motionPathVariant === undefined
  )).toBe(true);
  expect(tracks.filter(({ lifecycle }) => lifecycle === "split")).toHaveLength(0);
  for (const entityId of [
    "source.xyz.log.operator",
    "source.xyz.log.open",
    "source.xyz.log.close"
  ]) {
    const matching = tracks.filter(({ sourceEntityId }) =>
      sourceEntityId === entityId
    );
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.every(({ lifecycle }) => lifecycle === "eliminate")).toBe(true);
  }
  for (const entityId of [
    "target.xyz.term-1.log.operator",
    "target.xyz.term-2.log.operator",
    "target.xyz.term-3.log.operator",
    "target.xyz.sum.plus.0",
    "target.xyz.sum.plus.1"
  ]) {
    const matching = tracks.filter(({ targetEntityId }) => targetEntityId === entityId);
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.every(({ lifecycle }) => lifecycle === "introduce")).toBe(true);
  }
  const at = async (progress: number, entityIds: readonly string[]) => {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-progress",
      String(progress)
    );
    return visibleMaterialGeometry(stage, entityIds);
  };
  const multiFactorOperatorIds = [
    "target.xyz.term-1.log.operator",
    "target.xyz.term-2.log.operator",
    "target.xyz.term-3.log.operator"
  ] as const;
  const multiFactorConnectorIds = [
    "target.xyz.sum.plus.0",
    "target.xyz.sum.plus.1"
  ] as const;
  await seekAndWait(stage, seek, 0.5);
  expect(await visibleMaterialCount(stage, multiFactorConnectorIds)).toBe(0);
  await seekAndWait(stage, seek, 0.58);
  expect(await visibleMaterialCount(stage, multiFactorConnectorIds)).toBe(2);
  await seekAndWait(stage, seek, 0.5);
  expect(await visibleMaterialCount(stage, multiFactorOperatorIds)).toBe(0);
  await seekAndWait(stage, seek, 0.58);
  expect(await visibleMaterialCount(stage, multiFactorOperatorIds)).toBe(3);
  const operatorEntry = await at(0.55, multiFactorOperatorIds);
  const operatorMidpoint = await at(0.6, multiFactorOperatorIds);
  const operatorSettlement = await at(0.64, multiFactorOperatorIds);
  for (const entityId of multiFactorOperatorIds) {
    const widths = [operatorEntry, operatorMidpoint, operatorSettlement]
      .map((geometry) => geometry[entityId]!.width);
    expect(widths[0]).toBeLessThan(widths[1]!);
    expect(widths[1]).toBeLessThan(widths[2]!);
    expect(widths[2]).toBeGreaterThan(widths[0]! * 3);
  }
  const connectorEntry = await at(0.55, multiFactorConnectorIds);
  const connectorMidpoint = await at(0.6, multiFactorConnectorIds);
  const connectorSettlement = await at(0.64, multiFactorConnectorIds);
  for (const entityId of multiFactorConnectorIds) {
    const samples = [connectorEntry, connectorMidpoint, connectorSettlement]
      .map((geometry) => geometry[entityId]!);
    const centerXs = samples.map(({ left, width }) => left + width / 2);
    const centerYs = samples.map(({ top, height }) => top + height / 2);
    expect(Math.max(...centerXs) - Math.min(...centerXs))
      .toBeLessThanOrEqual(1.25);
    expect(Math.max(...centerYs) - Math.min(...centerYs))
      .toBeLessThanOrEqual(1.25);
    expect(samples[0]!.width).toBeLessThan(samples[1]!.width);
    expect(samples[1]!.width).toBeLessThan(samples[2]!.width);
    expect(samples[2]!.width).toBeGreaterThan(samples[0]!.width * 3);
  }
  const enclosureIds = [
    "target.xyz.term-1.log.open",
    "target.xyz.term-1.log.close",
    "target.xyz.term-2.log.open",
    "target.xyz.term-2.log.close",
    "target.xyz.term-3.log.open",
    "target.xyz.term-3.log.close"
  ] as const;
  const enclosureEntry = await at(0.48, enclosureIds);
  const enclosureSettlement = await at(0.64, enclosureIds);
  for (const prefix of [
    "target.xyz.term-1.log",
    "target.xyz.term-2.log",
    "target.xyz.term-3.log"
  ] as const) {
    const leadingEntry = enclosureEntry[`${prefix}.open`]!;
    const leadingSettlement = enclosureSettlement[`${prefix}.open`]!;
    const trailingEntry = enclosureEntry[`${prefix}.close`]!;
    const trailingSettlement = enclosureSettlement[`${prefix}.close`]!;
    expect(leadingEntry.left).toBeLessThan(leadingSettlement.left);
    expect(trailingEntry.left).toBeGreaterThan(trailingSettlement.left);
    expect(leadingSettlement.left - leadingEntry.left)
      .toBeGreaterThan(leadingSettlement.height * 0.25);
    expect(leadingSettlement.left - leadingEntry.left)
      .toBeLessThan(leadingSettlement.height * 0.7);
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

async function visibleMaterialCount(
  stage: Locator,
  entityIds: readonly string[]
): Promise<number> {
  return stage.evaluate((root, expectedEntityIds) =>
    expectedEntityIds.flatMap((entityId) =>
      [...root.querySelectorAll<HTMLElement>(
        `[data-kp-equation-material-semantic-entity-id="${CSS.escape(entityId)}"]`
      )]
    ).filter((owner) => Number(getComputedStyle(owner).opacity) > 0.01).length,
  entityIds);
}

async function seekAndWait(
  stage: Locator,
  seek: Locator,
  progress: number
): Promise<void> {
  await seek.fill(String(progress));
  await expect(stage).toHaveAttribute(
    "data-kp-log-product-progress",
    String(progress)
  );
}

async function visibleMaterialGeometry(
  stage: Locator,
  entityIds: readonly string[]
): Promise<Record<string, { left: number; top: number; width: number; height: number }>> {
  return stage.evaluate(measureVisibleKpMaterialInkGeometry, entityIds);
}
