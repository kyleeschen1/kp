import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.equation.logarithm-change-of-base.v1";

test("change-of-base mounts one native compositor and seeks deterministically", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  );
  const stage = slot.locator("[data-kp-logarithm-change-of-base-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.logarithm-change-of-base.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-logarithm-change-of-base-stage",
    "ready"
  );
  await expect(stage.locator(
    ".kp-logarithm-change-of-base-stage__endpoint"
  )).toHaveCount(2);
  await expect(stage.locator(
    '[data-kp-semantic-entity-id="target.natural-log-quotient.division"].frac-line'
  )).toHaveCount(1);

  const summary = JSON.parse(
    await stage.getAttribute("data-kp-logarithm-change-of-base-track-summary") ??
      "[]"
  ) as Array<{
    lifecycle: string;
    sourceEntityId?: string;
    targetEntityId?: string;
    timingGroupId?: string;
    metricInterpolation?: string;
  }>;
  expect(summary.some(({ lifecycle, sourceEntityId, targetEntityId }) =>
    lifecycle === "persist" &&
    sourceEntityId === "source.log-base-two.argument-seven" &&
    targetEntityId === "target.numerator.argument-seven"
  )).toBe(true);
  expect(summary.some(({ lifecycle, sourceEntityId, targetEntityId }) =>
    lifecycle === "persist" &&
    sourceEntityId === "source.log-base-two.base" &&
    targetEntityId === "target.denominator.argument-two"
  )).toBe(true);
  expect(summary.some(({ lifecycle, targetEntityId, timingGroupId }) =>
    lifecycle === "introduce" &&
    targetEntityId === "target.natural-log-quotient.division" &&
    timingGroupId?.includes("fraction-rule") === true
  )).toBe(true);
  expect(summary.some(({ lifecycle, sourceEntityId, timingGroupId }) =>
    lifecycle === "eliminate" &&
    sourceEntityId === "source.log-base-two.operator" &&
    timingGroupId === "timing.logarithm-change-of-base.operator-handoff"
  )).toBe(true);
  await expect(stage.locator('[data-kp-semantic-entity-id$=".open"], ' +
    '[data-kp-semantic-entity-id$=".close"]')).toHaveCount(0);
  expect(summary.filter(({ lifecycle, metricInterpolation }) =>
    lifecycle === "persist" &&
    metricInterpolation === "semantic-role-change"
  )).toHaveLength(2);

  const sourceBase = stage.locator(
    '[data-kp-semantic-entity-id="source.log-base-two.base"]'
  );
  const targetArgument = stage.locator(
    '[data-kp-semantic-entity-id="target.denominator.argument-two"]'
  );
  const sourceHeight = await sourceBase.evaluate((element) =>
    element.getBoundingClientRect().height
  );
  const targetHeight = await targetArgument.evaluate((element) =>
    element.getBoundingClientRect().height
  );
  expect(targetHeight).toBeGreaterThan(sourceHeight + 1);
  const roleChangeHeights: number[] = [];
  for (const progress of [0.22, 0.5, 0.78, 0.999]) {
    await seek.fill(String(progress));
    const owner = stage.locator(
      '[data-kp-equation-material-semantic-entity-id="source.log-base-two.base"]'
    );
    await expect(owner).toHaveCount(1);
    roleChangeHeights.push(await owner.evaluate((element) =>
      element.getBoundingClientRect().height
    ));
  }
  expect(roleChangeHeights[1]!).toBeGreaterThan(roleChangeHeights[0]! + 0.25);
  expect(roleChangeHeights[1]!).toBeLessThan(roleChangeHeights[2]! - 0.25);
  expect(Math.abs(roleChangeHeights[2]! - targetHeight)).toBeLessThan(0.75);
  expect(Math.abs(roleChangeHeights[3]! - targetHeight)).toBeLessThan(0.75);
  await seek.fill("0.78");
  const settledRoleChange = stage.locator(
    '[data-kp-equation-material-semantic-entity-id="source.log-base-two.base"]'
  );
  await expect(settledRoleChange).toHaveCSS("transform", "none");

  for (const progress of [0, 0.25, 0.5, 0.75, 1, 0.625, 0]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-logarithm-change-of-base-progress",
      String(progress)
    );
    await expectExclusiveOwner(stage);
  }
  expect(pageErrors).toEqual([]);
});

test("change-of-base URL restores direct semantic playhead", async ({ page }) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.625`);
  const stage = page.locator(
    `[data-kp-editor-animation-id="${animationId}"] ` +
    "[data-kp-logarithm-change-of-base-stage]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-logarithm-change-of-base-stage",
    "ready"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-logarithm-change-of-base-progress",
    "0.625"
  );
  await expectExclusiveOwner(stage);
});

async function expectExclusiveOwner(stage: Locator): Promise<void> {
  await expect.poll(async () => stage.evaluate((root) => {
    const endpointOpacities = [...root.querySelectorAll<HTMLElement>(
      ".kp-logarithm-change-of-base-stage__endpoint"
    )].map((element) => Number(getComputedStyle(element).opacity));
    const material = root.querySelector<HTMLElement>(
      "[data-kp-editor-equation-material-layer]"
    );
    const visibleMaterial = material === null ? false :
      [...material.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].some((element) => Number(getComputedStyle(element).opacity) > 0);
    return endpointOpacities.filter((opacity) => opacity > 0).length +
      (visibleMaterial ? 1 : 0);
  })).toBe(1);
}
