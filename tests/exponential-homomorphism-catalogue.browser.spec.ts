import { expect, test, type Locator } from "@playwright/test";
import {
  measureVisibleKpMaterialInkGeometry,
  type KpVisibleMaterialInkGeometry
} from "./support/native-katex-material-ink-geometry.ts";

const animationId =
  "animation.algebra.exponential-homomorphism.sum-to-product";
const quotientAnimationId =
  "animation.algebra.exponential-homomorphism.difference-to-quotient";

test("exponential quotient pressure preserves exact seek rewind resize and endpoints", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${quotientAnimationId}`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${quotientAnimationId}"]`
  );
  const stage = player.locator("[data-kp-exponential-homomorphism-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expectReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-exponential-homomorphism-animation-id",
    quotientAnimationId
  );

  await seek.fill("0");
  expect(await accessibleEndpointText(stage)).toBe("e^{a-b}");
  await seek.fill("0.23");
  const middle = await movingPaintSnapshot(stage);
  expect(middle.length).toBeGreaterThan(0);
  const trackSummary = JSON.parse(await stage.getAttribute(
    "data-kp-exponential-homomorphism-track-summary"
  ) ?? "[]") as Array<{ lifecycle?: string }>;
  expect(trackSummary.some(({ lifecycle }) => lifecycle === "introduce"))
    .toBe(true);
  await seek.fill("1");
  expect(await accessibleEndpointText(stage)).toBe("\\frac{e^{a}}{e^{b}}");
  await seek.fill("0.23");
  expect(await movingPaintSnapshot(stage)).toEqual(middle);
  await seek.fill("0");
  expect(await accessibleEndpointText(stage)).toBe("e^{a-b}");

  const initialRevision = Number(await stage.getAttribute(
    "data-kp-exponential-homomorphism-measurement-revision"
  ));
  await page.setViewportSize({ width: 390, height: 760 });
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-exponential-homomorphism-measurement-revision"
  ))).toBeGreaterThan(initialRevision);
  await expectReady(stage);
  await seek.fill("1");
  expect(await accessibleEndpointText(stage)).toBe("\\frac{e^{a}}{e^{b}}");
  expect(pageErrors).toEqual([]);
});

test("exponential homomorphism preserves endpoints, seek, rewind, and resize", async ({
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
    '[data-kp-editor-animation-surface-slot="equation"]'
  );
  const stage = slot.locator("[data-kp-exponential-homomorphism-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "exponential-homomorphism"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.exponential-homomorphism.canonical-native-katex"
  );
  await expectReady(stage);
  await expect(stage.locator(
    ".kp-exponential-homomorphism-stage__endpoint"
  )).toHaveCount(2);
  await expect(stage.locator(".katex-mathml")).toHaveCount(2);

  await seek.fill("0");
  await expect(stage).toHaveAttribute(
    "data-kp-exponential-homomorphism-visual-owner",
    "source-native"
  );
  expect(await accessibleEndpointText(stage)).toBe("e^{a+b}");

  await seek.fill("0.5");
  await expect(stage).toHaveAttribute(
    "data-kp-exponential-homomorphism-progress",
    "0.5"
  );
  const middle = await movingPaintSnapshot(stage);
  expect(middle.length).toBeGreaterThan(0);

  await seek.fill("1");
  await expect(stage).toHaveAttribute(
    "data-kp-exponential-homomorphism-visual-owner",
    "target-native"
  );
  expect(await accessibleEndpointText(stage)).toBe("e^{a}e^{b}");

  await seek.fill("0.5");
  expect(await movingPaintSnapshot(stage)).toEqual(middle);
  await seek.fill("0");
  expect(await accessibleEndpointText(stage)).toBe("e^{a+b}");

  const initialMeasurementRevision = Number(await stage.getAttribute(
    "data-kp-exponential-homomorphism-measurement-revision"
  ));
  await page.setViewportSize({ width: 390, height: 760 });
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-exponential-homomorphism-measurement-revision"
  ))).toBeGreaterThan(initialMeasurementRevision);
  await expectReady(stage);
  await seek.fill("1");
  expect(await accessibleEndpointText(stage)).toBe("e^{a}e^{b}");
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);
});

test("connector contracts at its ink center while carrier fission stays native-size", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-exponential-homomorphism-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expectReady(stage);

  const connectorEntityId =
    "occurrence.exponential.sum-to-product.ab.source.combination-connector.0";
  const sourceSamples = [];
  for (const progress of [0.14, 0.19, 0.24]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-exponential-homomorphism-progress",
      String(progress)
    );
    sourceSamples.push(
      await visibleMaterialInkGeometry(stage, [connectorEntityId])
    );
  }
  const connectorGeometries = sourceSamples.map((sample) =>
    sample[connectorEntityId]!
  );
  expect(connectorGeometries[0]!.width)
    .toBeGreaterThan(connectorGeometries[1]!.width);
  expect(connectorGeometries[1]!.width)
    .toBeGreaterThan(connectorGeometries[2]!.width);
  expectStationaryInkCenter(connectorGeometries);

  const baseEntityIds = [
    "occurrence.exponential.sum-to-product.ab.target.base.0",
    "occurrence.exponential.sum-to-product.ab.target.base.1"
  ] as const;
  const baseSamples = [];
  for (const progress of [0.18, 0.23, 0.3]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-exponential-homomorphism-progress",
      String(progress)
    );
    baseSamples.push(
      await visibleMaterialInkGeometry(stage, baseEntityIds)
    );
  }
  for (const entityId of baseEntityIds) {
    expectStableInkSize(baseSamples.map((sample) => sample[entityId]!));
  }
});

test("exponential homomorphism keeps one accessible endpoint under reduced motion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=0.5`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator(
    "[data-kp-exponential-homomorphism-stage]"
  );

  await expectReady(stage);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  const accessibility = await stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-exponential-homomorphism-stage__endpoint"
    )];
    const active = endpoints.filter((endpoint) =>
      endpoint.getAttribute("aria-hidden") === "false"
    );
    return {
      activeCount: active.length,
      activeHasMathMl: active[0]?.querySelector("math") !== null,
      inactiveAreInert: endpoints
        .filter((endpoint) => endpoint !== active[0])
        .every((endpoint) => endpoint.hasAttribute("inert"))
    };
  });
  expect(accessibility).toEqual({
    activeCount: 1,
    activeHasMathMl: true,
    inactiveAreInert: true
  });
});

async function expectReady(stage: Locator): Promise<void> {
  await expect.poll(
    () => stage.getAttribute("data-kp-exponential-homomorphism-stage"),
    { timeout: 15_000 }
  ).not.toBe("preparing");
  const state = await stage.getAttribute(
    "data-kp-exponential-homomorphism-stage"
  );
  if (state === "failed") {
    throw new Error(
      await stage.getAttribute("data-kp-exponential-homomorphism-error") ??
      "Exponential stage failed without diagnostics."
    );
  }
  expect(state).toBe("ready");
}

async function accessibleEndpointText(stage: Locator): Promise<string | null> {
  return stage.locator(
    '.kp-exponential-homomorphism-stage__endpoint[aria-hidden="false"]'
  ).getAttribute("data-kp-exponential-homomorphism-latex");
}

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

function expectStationaryInkCenter(geometries: readonly {
  left: number;
  top: number;
  width: number;
  height: number;
}[]): void {
  const centerXs = geometries.map(({ left, width }) => left + width / 2);
  const centerYs = geometries.map(({ top, height }) => top + height / 2);
  expect(Math.max(...centerXs) - Math.min(...centerXs))
    .toBeLessThanOrEqual(0.75);
  expect(Math.max(...centerYs) - Math.min(...centerYs))
    .toBeLessThanOrEqual(0.75);
}

function expectStableInkSize(geometries: readonly {
  width: number;
  height: number;
}[]): void {
  expect(Math.max(...geometries.map(({ width }) => width)) -
    Math.min(...geometries.map(({ width }) => width)))
    .toBeLessThanOrEqual(0.75);
  expect(Math.max(...geometries.map(({ height }) => height)) -
    Math.min(...geometries.map(({ height }) => height)))
    .toBeLessThanOrEqual(0.75);
}

async function visibleMaterialInkGeometry(
  stage: Locator,
  entityIds: readonly string[]
): Promise<Record<string, KpVisibleMaterialInkGeometry>> {
  return stage.evaluate(measureVisibleKpMaterialInkGeometry, entityIds);
}
