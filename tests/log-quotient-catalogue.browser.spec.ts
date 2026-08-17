import { expect, test, type Locator } from "@playwright/test";

const animationId =
  "animation.algebra.log-quotient.difference-to-quotient";

test("visible play control drives continuous log quotient motion", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);

  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-quotient-stage]");
  const play = player.getByRole("button", { name: "Play animation" });

  await expectLogQuotientReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-log-quotient-fraction-treatment",
    "compact-native"
  );
  await expect(play).toBeVisible();
  await play.click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "playing");
  await expect(player.getByRole("button", { name: "Pause animation" }))
    .toBeVisible();

  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-log-quotient-progress")
  )).toBeGreaterThan(0.08);
  const firstProgress = Number(
    await stage.getAttribute("data-kp-log-quotient-progress")
  );
  const firstPaint = await movingPaintSnapshot(stage);
  expect(firstPaint.length).toBeGreaterThan(0);

  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-log-quotient-progress")
  )).toBeGreaterThan(firstProgress + 0.05);
  expect(await movingPaintSnapshot(stage)).not.toEqual(firstPaint);
});

test("log quotient mounts lazily and seeks through one native paint owner", async ({
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
  const stage = slot.locator("[data-kp-log-quotient-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(player).toHaveAttribute("data-kp-editor-animation-pack-id", "algebra");
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.log-quotient.canonical-native-katex"
  );
  await expectLogQuotientReady(stage);
  await expect(stage.locator(".kp-log-quotient-stage__endpoint")).toHaveCount(2);
  await expect(stage.locator(
    '[data-kp-semantic-entity-id="target.quotient.bar"].frac-line'
  )).toHaveCount(1);
  await expect(stage.locator(
    '[data-kp-semantic-entity-id="source.subtract"].frac-line'
  )).toHaveCount(0);

  const trackSummary = JSON.parse(
    await stage.getAttribute("data-kp-log-quotient-track-summary") ?? "[]"
  ) as Array<{
    lifecycle?: string;
    sourceAtomId?: string;
    targetAtomId?: string;
    sourceEntityId?: string;
    targetEntityId?: string;
    motionPathVariant?: string;
    motionAxisConstraint?: string;
  }>;
  expect(trackSummary.length).toBeGreaterThan(0);
  expect(trackSummary.some(({ sourceAtomId, targetAtomId }) =>
    sourceAtomId !== undefined && targetAtomId !== undefined
  )).toBe(true);
  const operatorFusion = trackSummary.filter(({ lifecycle, targetEntityId }) =>
    lifecycle === "merge" && targetEntityId === "target.log.operator"
  );
  expect(operatorFusion.map(({ sourceEntityId }) => sourceEntityId).sort()).toEqual([
    "source.left.log.operator",
    "source.right.log.operator"
  ]);
  expect(operatorFusion.every(({ motionPathVariant, motionAxisConstraint }) =>
    motionPathVariant === undefined && motionAxisConstraint === undefined
  )).toBe(true);
  expect(trackSummary.find(({ sourceEntityId }) =>
    sourceEntityId === "source.left.argument.x"
  )?.motionPathVariant).toBe("arc-above");
  expect(trackSummary.find(({ sourceEntityId }) =>
    sourceEntityId === "source.right.argument.y"
  )?.motionPathVariant).toBe("arc-below");

  for (const progress of [0, 0.25, 0.5, 0.75, 0.875, 1]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-log-quotient-progress",
      String(progress)
    );
    const ownership = await stage.evaluate((root) => {
      const endpointOpacities = [...root.querySelectorAll<HTMLElement>(
        ".kp-log-quotient-stage__endpoint"
      )].map((element) => Number(getComputedStyle(element).opacity));
      const material = root.querySelector<HTMLElement>(
        "[data-kp-editor-equation-material-layer]"
      );
      const materialVisible = material === null
        ? 0
        : [...material.querySelectorAll<HTMLElement>(
            "[data-kp-equation-material-owner-id]"
          )].some((element) => Number(getComputedStyle(element).opacity) > 0)
          ? 1
          : 0;
      return {
        visualOwner: root.dataset["kpLogQuotientVisualOwner"],
        visibleOwnerCount:
          endpointOpacities.filter((opacity) => opacity > 0).length +
          materialVisible
      };
    });
    expect(ownership.visibleOwnerCount).toBe(1);
  }

  const materialSnapshot = () => stage.evaluate((root) =>
    [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].map((owner) => ({
      id: owner.dataset["kpEquationMaterialOwnerId"],
      entityId: owner.dataset["kpEquationMaterialSemanticEntityId"],
      left: owner.style.left,
      top: owner.style.top,
      width: owner.style.width,
      height: owner.style.height,
      opacity: owner.style.opacity,
      transform: owner.style.transform,
      visual: owner.textContent
    })).sort((left, right) => (left.id ?? "").localeCompare(right.id ?? ""))
  );
  await seek.fill("0.75");
  const firstSeventyFive = await materialSnapshot();
  await seek.fill("1");
  await seek.fill("0.75");
  expect(await materialSnapshot()).toEqual(firstSeventyFive);

  await seek.fill("0");
  await expect(stage).toHaveAttribute(
    "data-kp-log-quotient-visual-owner",
    "source-native"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  await expect(page.getByRole("button", { name: "Review" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("compact native quotient tightens vertical clearance without overlap", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=1`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-quotient-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toHaveAttribute("data-kp-log-quotient-stage", "ready");
  await seek.fill("1");

  const geometry = await stage.evaluate((root) => {
    const rect = (entityId: string) => root.querySelector<HTMLElement>(
      `[data-kp-log-quotient-endpoint-state-id="log-quotient.state.quotient"] ` +
      `[data-kp-semantic-entity-id="${entityId}"]`
    )!.getBoundingClientRect();
    const numerator = rect("target.numerator.x");
    const denominator = rect("target.denominator.y");
    const bar = rect("target.quotient.bar");
    return {
      numeratorGap: bar.top - numerator.bottom,
      denominatorGap: denominator.top - bar.bottom,
      symbolHeight: Math.min(numerator.height, denominator.height)
    };
  });
  expect(geometry.numeratorGap).toBeGreaterThanOrEqual(0);
  expect(geometry.denominatorGap).toBeGreaterThanOrEqual(0);
  expect(Math.max(geometry.numeratorGap, geometry.denominatorGap))
    .toBeLessThanOrEqual(geometry.symbolHeight * 0.28);
});

test("log quotient keeps one accessible endpoint under reduced motion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=0.5`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-quotient-stage]");

  await expect(stage).toHaveAttribute("data-kp-log-quotient-stage", "ready");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  const accessibility = await stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-log-quotient-stage__endpoint"
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

async function expectLogQuotientReady(stage: Locator): Promise<void> {
  await expect.poll(() => stage.getAttribute("data-kp-log-quotient-stage"))
    .not.toBe("preparing");
  if (await stage.getAttribute("data-kp-log-quotient-stage") === "failed") {
    throw new Error(
      await stage.getAttribute("data-kp-log-quotient-error") ??
      "Log-quotient stage failed without diagnostics."
    );
  }
  await expect(stage).toHaveAttribute("data-kp-log-quotient-stage", "ready");
}
