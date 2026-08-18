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
    "operation-choreography.transformation.log-exponent.apply-log-both-sides.canonical-wrap.forward"
  );
  await expect(stage).toHaveCSS("text-transform", "none");
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
      if (
        entityId === "logged.left.log" ||
        entityId === "logged.left.log.operator"
      ) {
        bySide.left.push(Number(getComputedStyle(owner).opacity));
      }
      if (
        entityId === "logged.right.log" ||
        entityId === "logged.right.log.operator"
      ) {
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
  await player.locator('[data-action="seek-editor-animation"]').fill("0.494");
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-operation-id",
    "operation.log-exponent.extract-exponent"
  );
  const extractionGeometry = await stage.evaluate((root) => {
    const stageRect = root.getBoundingClientRect();
    const visibleOwners = Array.from(root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )).filter((owner) => Number(getComputedStyle(owner).opacity) > 0.01);
    const rectFor = (entityId: string) => {
      const owner = visibleOwners.find((candidate) =>
        candidate.dataset["kpEquationMaterialSemanticEntityId"] === entityId
      );
      if (owner === undefined) {
        throw new Error(`Missing visible material owner ${entityId}`);
      }
      return owner.getBoundingClientRect();
    };
    const log = rectFor("logged.left.log.operator");
    const equality = rectFor("logged.equality");
    const exponent = rectFor("logged.exponent");
    return {
      baselineDelta: Math.abs(
        log.y + log.height / 2 - (equality.y + equality.height / 2)
      ),
      exponentBottom: exponent.bottom,
      baselineTop: equality.top,
      ownersRemainInsideStage: visibleOwners.every((owner) => {
        const rect = owner.getBoundingClientRect();
        return rect.left >= stageRect.left - 1 &&
          rect.right <= stageRect.right + 1 &&
          rect.top >= stageRect.top - 1 &&
          rect.bottom <= stageRect.bottom + 1;
      })
    };
  });
  // The exponent may lift, but the persistent logarithm must not inherit that path.
  expect(extractionGeometry.baselineDelta).toBeLessThan(8);
  expect(extractionGeometry.exponentBottom)
    .toBeLessThan(extractionGeometry.baselineTop);
  expect(extractionGeometry.ownersRemainInsideStage).toBe(true);
  const exponentPositions: Array<{ x: number; y: number }> = [];
  for (const progress of [
    0.47,
    0.482,
    0.494,
    0.506,
    0.518,
    0.53,
    0.542,
    0.554,
    0.566
  ]) {
    await player.locator('[data-action="seek-editor-animation"]')
      .fill(String(progress));
    exponentPositions.push(await stage.evaluate((root) => {
      const owner = Array.from(root.querySelectorAll<HTMLElement>(
        '[data-kp-equation-material-semantic-entity-id="logged.exponent"]'
      )).find((candidate) => Number(getComputedStyle(candidate).opacity) > 0.01);
      if (owner === undefined) {
        throw new Error("Missing visible extracted exponent material.");
      }
      const rect = owner.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    }));
  }
  const exponentSteps = exponentPositions.slice(1).map((position, index) =>
    Math.hypot(
      position.x - exponentPositions[index]!.x,
      position.y - exponentPositions[index]!.y
    )
  );
  // A lift-hold-settle remap is continuous on paper but reads as two snaps.
  // Every sampled interval must advance, without one interval owning the move.
  expect(Math.min(...exponentSteps)).toBeGreaterThan(0.1);
  expect(
    Math.max(...exponentSteps) /
      exponentSteps.reduce((sum, distance) => sum + distance, 0)
  ).toBeLessThan(0.23);
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
  const symbolMotionTracks = JSON.parse(
    await stage.getAttribute("data-kp-log-exponent-symbol-motion-tracks") ??
      "[]"
  ) as Array<{
    sourceEntityId?: string;
    motionUnitId?: string;
  }>;
  const logTwoUnitIds = symbolMotionTracks
    .filter(({ sourceEntityId }) => [
      "extracted.left.log.operator",
      "extracted.base"
    ].includes(sourceEntityId ?? ""))
    .map(({ motionUnitId }) => motionUnitId);
  expect(logTwoUnitIds).toHaveLength(2);
  expect(new Set(logTwoUnitIds).size).toBe(1);
  expect(logTwoUnitIds[0]).toContain("divide-by-log-base.log-two");
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

test("terminal scrubbing replays from the source after the native surface is ready", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-exponent-stage]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const toggle = player.locator('[data-action="toggle-editor-animation"]');

  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-surface-readiness",
    "ready"
  );
  await expect(toggle).toBeEnabled();

  for (let replay = 0; replay < 2; replay += 1) {
    await scrubber.fill("1");
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-status",
      "paused"
    );
    const synchronousReplay = await toggle.evaluate((button) => {
      (button as HTMLButtonElement).click();
      const owner = button.closest<HTMLElement>(
        "[data-kp-editor-animation-player]"
      );
      return {
        progress: owner?.dataset["kpEditorAnimationProgress"],
        status: owner?.dataset["kpEditorAnimationStatus"]
      };
    });
    expect(synchronousReplay).toEqual({ progress: "0", status: "playing" });
    await expect.poll(async () => Number(
      await player.getAttribute("data-kp-editor-animation-progress")
    )).toBeGreaterThan(0);
    await toggle.click();
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-status",
      "paused"
    );
  }
});

test("catalogue playback does not charge background-tab time", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-exponent-stage]");
  const toggle = player.locator('[data-action="toggle-editor-animation"]');

  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await toggle.click();
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeGreaterThan(0.02);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "paused"
  );
  const hiddenProgress = Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ));
  const hiddenUrl = page.url();
  await page.waitForTimeout(250);
  expect(Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ))).toBe(hiddenProgress);
  expect(page.url()).toBe(hiddenUrl);

  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await toggle.click();
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeGreaterThan(hiddenProgress);
});

test("catalogue survives a persisted pagehide and pageshow cycle", async ({
  page
}) => {
  const playhead = 0.625;
  await page.goto(`/?artifact=${animationId}&playhead=${playhead}`);
  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-exponent-stage]");

  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", {
      persisted: true
    }));
    window.dispatchEvent(new PageTransitionEvent("pageshow", {
      persisted: true
    }));
  });

  await expect(exemplar).toHaveCount(1);
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    String(playhead)
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
