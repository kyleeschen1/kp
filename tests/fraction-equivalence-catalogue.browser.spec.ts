import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.equation.fraction-equivalence.v1";
const compactAnimationId =
  "animation.equation.fraction-equivalence.compact.v1";

test("fraction equivalence mounts one deterministic native compositor", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0&theme=dark`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  );
  const stage = slot.locator("[data-kp-fraction-equivalence-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.fraction-equivalence.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-equivalence-stage",
    "ready"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-equivalence-presentation-mode",
    "explain-unit-factor"
  );
  await expect(stage.locator(
    ".kp-fraction-equivalence-stage__endpoint"
  )).toHaveCount(2);
  await expect(stage.locator(
    '[data-kp-semantic-entity-id="fraction-equivalence.target.division"].frac-line'
  )).toHaveCount(1);

  const summary = JSON.parse(
    await stage.getAttribute("data-kp-fraction-equivalence-track-summary") ??
      "[]"
  ) as Array<{
    lifecycle: string;
    sourceEntityId?: string;
    targetEntityId?: string;
    motionPathVariant?: string;
    timingGroupId?: string;
    motionProgressRange?: { start: number; end: number };
  }>;
  expect(summary.some(({ lifecycle, sourceEntityId, targetEntityId }) =>
    lifecycle === "persist" &&
    sourceEntityId === "fraction-equivalence.source.numerator" &&
    targetEntityId === "fraction-equivalence.target.numerator-source"
  )).toBe(true);
  expect(summary.some(({ lifecycle, sourceEntityId, targetEntityId }) =>
    lifecycle === "persist" &&
    sourceEntityId === "fraction-equivalence.source.denominator" &&
    targetEntityId === "fraction-equivalence.target.denominator-source"
  )).toBe(true);
  const factorTracks = summary.filter(({ lifecycle, sourceEntityId }) =>
    lifecycle === "persist" &&
    sourceEntityId?.startsWith(
      "presentation.fraction-equivalence.unit-factor."
    ) === true
  );
  expect(factorTracks).toHaveLength(2);
  expect(new Set(factorTracks.map(({ targetEntityId }) => targetEntityId)))
    .toEqual(new Set([
      "fraction-equivalence.target.numerator-factor",
      "fraction-equivalence.target.denominator-factor"
    ]));
  const divisionTracks = summary.filter(({ lifecycle, targetEntityId }) =>
    lifecycle === "merge" &&
    targetEntityId === "fraction-equivalence.target.division"
  );
  expect(new Set(divisionTracks.map(({ sourceEntityId }) => sourceEntityId)))
    .toEqual(new Set([
      "presentation.fraction-equivalence.unit-factor.division",
      "fraction-equivalence.source.division"
    ]));
  const joinedMaterial = summary.filter(({ lifecycle }) =>
    lifecycle === "persist" || lifecycle === "merge"
  );
  expect(new Set(joinedMaterial.map(({ timingGroupId }) => timingGroupId)))
    .toEqual(new Set(["cohort.fraction-equivalence.material-join"]));
  expect(joinedMaterial.every(({ motionProgressRange }) =>
    motionProgressRange === undefined
  )).toBe(true);

  for (const progress of [0, 0.2, 0.5, 0.8, 1, 0.65, 0]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-fraction-equivalence-progress",
      String(progress)
    );
    await expectExclusiveOwner(stage);
  }
  expect(pageErrors).toEqual([]);
});

test("compact fraction equivalence introduces one synchronized factor pair", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${compactAnimationId}&playhead=0&theme=dark`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${compactAnimationId}"]`
  );
  const stage = player.locator("[data-kp-fraction-equivalence-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-equivalence-stage",
    "ready"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-equivalence-presentation-mode",
    "compact-paired-operation"
  );
  const summary = JSON.parse(
    await stage.getAttribute("data-kp-fraction-equivalence-track-summary") ??
      "[]"
  ) as Array<{
    lifecycle: string;
    sourceEntityId?: string;
    targetEntityId?: string;
  }>;
  const introducedFactors = summary.filter(({
    lifecycle,
    sourceEntityId,
    targetEntityId
  }) =>
    lifecycle === "persist" &&
    sourceEntityId?.startsWith(
      "presentation.fraction-equivalence.paired-operation."
    ) === true && [
      "fraction-equivalence.target.numerator-factor",
      "fraction-equivalence.target.denominator-factor"
    ].includes(targetEntityId ?? "")
  );
  expect(introducedFactors).toHaveLength(2);

  for (const progress of [0, 0.35, 0.7, 1, 0.4, 0]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-fraction-equivalence-progress",
      String(progress)
    );
    await expectExclusiveOwner(stage);
  }
  expect(pageErrors).toEqual([]);
});

test("fraction-equivalence URL restores exact light-theme playhead", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.625&theme=light`);
  const stage = page.locator(
    `[data-kp-editor-animation-id="${animationId}"] ` +
    "[data-kp-fraction-equivalence-stage]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-equivalence-stage",
    "ready"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-equivalence-progress",
    "0.625"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-development-theme",
    "light"
  );
  await expectExclusiveOwner(stage);
});

async function expectExclusiveOwner(stage: Locator): Promise<void> {
  await expect.poll(async () => stage.evaluate((root) => {
    const endpointOpacities = [...root.querySelectorAll<HTMLElement>(
      ".kp-fraction-equivalence-stage__endpoint"
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
