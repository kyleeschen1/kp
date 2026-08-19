import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo
} from "@playwright/test";

const animationId =
  "animation.equation.fraction-equivalence.common-denominator-pressure.v1";
const adapterId =
  "editor-animation-surface.fraction-equivalence.common-denominator-pressure";

test("pressure caller stays complete and deterministic across its timeline", async ({
  page
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0&theme=dark`);
  const { player, stage, seek } = await readyPressureSurface(page);

  await expect(stage.locator(
    ".kp-common-denominator-pressure-stage__endpoint"
  )).toHaveCount(4);
  await expect(player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  )).toHaveAttribute("data-kp-editor-animation-adapter-id", adapterId);
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-measurement-count",
    "4"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-seam",
    "verified"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-seam-leaf-count",
    /[1-9]\d*/u
  );

  for (const progress of [0, 0.09, 0.18, 0.44, 0.7, 0.85, 1, 0.44, 0]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-common-denominator-pressure-progress",
      String(progress)
    );
    await expectExactlyOnePaintOwner(stage);
  }

  for (const [progress, name] of [
    [0, "pressure-dark-start.png"],
    [0.09, "pressure-dark-introduction.png"],
    [0.18, "pressure-dark-staged.png"],
    [0.7, "pressure-dark-products.png"],
    [0.85, "pressure-dark-evaluation.png"],
    [1, "pressure-dark-final.png"]
  ] as const) {
    await seek.fill(String(progress));
    await captureStage(stage, testInfo, name);
  }
  for (const seam of [0.18, 0.7]) {
    const bounds = [];
    for (const progress of [seam - 0.001, seam, seam + 0.001]) {
      await seek.fill(String(progress));
      bounds.push(await visiblePaintBounds(stage));
    }
    expect(
      maximumRectDelta(bounds[0]!, bounds[1]!),
      `pre-seam geometry ${seam}: ${JSON.stringify(bounds)}`
    ).toBeLessThanOrEqual(0.5);
    expect(
      maximumRectDelta(bounds[1]!, bounds[2]!),
      `post-seam geometry ${seam}: ${JSON.stringify(bounds)}`
    ).toBeLessThan(1);
  }

  await seek.fill("0.179");
  const terminalPose = await terminalMaterialPose(stage);
  expect(terminalPose.comparedLeafCount).toBeGreaterThan(0);
  expect(terminalPose.missingTargetAtomIds).toEqual([]);
  expect(
    terminalPose.maximumPaintRectDeltaPx,
    JSON.stringify(terminalPose.leafDeltas)
  ).toBeLessThanOrEqual(0.5);
  await seek.fill("0.18");

  await seek.fill("0.44");
  await expect(stage.locator(
    '[data-kp-equation-material-semantic-entity-id="entity.fraction.common-denominator.source.plus"]'
  )).toHaveCount(1);
  await expect(stage.locator(
    '[data-kp-equation-material-semantic-entity-id="entity.fraction.common-denominator.source.second.numerator"]'
  )).toHaveCount(1);
  await expect(stage.locator(
    '[data-kp-equation-material-semantic-entity-id="entity.fraction.common-denominator.source.second.denominator"]'
  )).toHaveCount(1);
  await captureStage(stage, testInfo, "pressure-dark-midpoint.png");

  await player.focus();
  await page.keyboard.press("r");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await seek.fill("0.25");
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-progress",
    "0.75"
  );
  await expectExactlyOnePaintOwner(stage);
  expect(pageErrors).toEqual([]);
});

test("direct URL seek remounts the reviewed state in light mode", async ({
  page
}, testInfo) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.7&theme=light`);
  const { stage } = await readyPressureSurface(page);

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-development-theme",
    "light"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-progress",
    "0.7"
  );
  await expectExactlyOnePaintOwner(stage);
  await captureStage(stage, testInfo, "pressure-light-product.png");

  await page.reload();
  const remounted = (await readyPressureSurface(page)).stage;
  await expect(remounted).toHaveAttribute(
    "data-kp-common-denominator-pressure-progress",
    "0.7"
  );
  await expectExactlyOnePaintOwner(remounted);
});

test("natural playback can be interrupted and directly resampled at the seam", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0&theme=dark`);
  const { player, stage, seek } = await readyPressureSurface(page);
  await player.locator('[data-action="toggle-editor-animation"]').click();
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeGreaterThan(0);

  for (const progress of ["0.179", "0.181", "0.18", "0.44", "0.18"]) {
    await seek.fill(progress);
    await expect(stage).toHaveAttribute(
      "data-kp-common-denominator-pressure-progress",
      progress
    );
    await expectExactlyOnePaintOwner(stage);
  }
  await player.focus();
  await page.keyboard.press("r");
  await seek.fill("0.82");
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-progress",
    String(1 - 0.82)
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-seam",
    "verified"
  );
  await expectExactlyOnePaintOwner(stage);
});

test("font and viewport replacement retain the exact state without replay", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.44&theme=dark`);
  const { player, stage, seek } = await readyPressureSurface(page);
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-measurement-revision",
    "0"
  );

  await page.setViewportSize({ width: 1_100, height: 800 });
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-measurement-revision",
    "1"
  );
  await expectPressureReplacement(stage, "0.44");

  await page.evaluate(() =>
    document.fonts.dispatchEvent(new Event("loadingdone"))
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-measurement-revision",
    "2"
  );
  await expectPressureReplacement(stage, "0.44");
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-font-revision",
    /[1-9]\d*/u
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-viewport-key",
    /@\d+(?:\.\d+)?:font-\d+:viewport-2$/u
  );

  await player.evaluate((element) => {
    element.dataset["kpEditorAnimationAccessibilityMode"] = "reduced-motion";
  });
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await seek.fill("0.82");
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-progress",
    "0.7"
  );
  await expectExactlyOneAccessibleEndpoint(stage);
  await expectExactlyOnePaintOwner(stage);
});

test("narrow view keeps the pressure stage and transport unobstructed", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?artifact=${animationId}&playhead=1&theme=dark`);
  const { player, stage } = await readyPressureSurface(page);
  const box = await stage.boundingBox();
  const controls = player.locator(".editor-animation-player__transport");
  const controlsBox = await controls.boundingBox();

  expect(box).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(controlsBox!.y).toBeGreaterThanOrEqual(box!.y + box!.height - 1);
  await expect(stage.locator(
    '[data-kp-common-denominator-pressure-endpoint="evaluated"]'
  )).toHaveAttribute("aria-hidden", "false");
  await expectExactlyOnePaintOwner(stage);
  await captureStage(stage, testInfo, "pressure-narrow-final.png");
});

test("device scale and static checkpoints preserve one endpoint owner", async ({
  browser
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  try {
    const page = await context.newPage();
    await page.goto(`/?artifact=${animationId}&playhead=0.82&theme=dark`);
    const { player, stage, seek } = await readyPressureSurface(page);
    expect(await page.evaluate(() => window.devicePixelRatio)).toBe(2);
    await expect(stage).toHaveAttribute(
      "data-kp-common-denominator-pressure-viewport-key",
      /@2:font-\d+:viewport-0$/u
    );
    await player.evaluate((element) => {
      element.dataset["kpEditorAnimationAccessibilityMode"] = "static";
    });
    await seek.fill("0.82");
    await expect(stage).toHaveAttribute(
      "data-kp-common-denominator-pressure-progress",
      "0.7"
    );
    await expectExactlyOneAccessibleEndpoint(stage);
    await expectExactlyOnePaintOwner(stage);
  } finally {
    await context.close();
  }
});

async function readyPressureSurface(page: Page) {
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator(
    "[data-kp-common-denominator-pressure-stage]"
  );
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toBeAttached();
  await expect(stage).not.toHaveAttribute(
    "data-kp-common-denominator-pressure-stage",
    "preparing"
  );
  const state = await stage.getAttribute(
    "data-kp-common-denominator-pressure-stage"
  );
  if (state === "failed") {
    const diagnostics = await stage.evaluate((root) => ({
      error: root.dataset["kpCommonDenominatorPressureError"],
      owners: [...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"],
        source: owner.dataset["kpEquationMaterialSourceMotionId"],
        html: owner.firstElementChild?.outerHTML.slice(0, 900)
      }))
    }));
    throw new Error(`Pressure surface failed: ${JSON.stringify(diagnostics)}`);
  }
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-stage",
    "ready"
  );
  return { player, stage, seek };
}

async function expectExactlyOnePaintOwner(stage: Locator): Promise<void> {
  await expect.poll(async () => stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-common-denominator-pressure-stage__endpoint"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0);
    const material = root.querySelector<HTMLElement>(
      "[data-kp-editor-equation-material-layer]"
    );
    const hasMaterial = material !== null &&
      [...material.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].some((element) => Number(getComputedStyle(element).opacity) > 0);
    return endpoints.length + Number(hasMaterial);
  })).toBe(1);
}

async function expectPressureReplacement(
  stage: Locator,
  progress: string
): Promise<void> {
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-stage",
    "ready"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-measurement-count",
    "4"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-seam",
    "verified"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-common-denominator-pressure-progress",
    progress
  );
  await expectExactlyOneAccessibleEndpoint(stage);
  await expectExactlyOnePaintOwner(stage);
}

async function expectExactlyOneAccessibleEndpoint(
  stage: Locator
): Promise<void> {
  const endpoints = stage.locator(
    ".kp-common-denominator-pressure-stage__endpoint"
  );
  await expect(endpoints).toHaveCount(4);
  await expect(stage.locator(
    ".kp-common-denominator-pressure-stage__endpoint" +
    '[aria-hidden="false"]:not([inert])'
  )).toHaveCount(1);
  await expect(stage.locator(
    ".kp-common-denominator-pressure-stage__endpoint" +
    '[aria-hidden="true"][inert]'
  )).toHaveCount(3);
}

async function captureStage(
  stage: Locator,
  testInfo: TestInfo,
  name: string
): Promise<void> {
  const path = testInfo.outputPath(name);
  await stage.screenshot({ path, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function visiblePaintBounds(stage: Locator) {
  return stage.evaluate(async (root) => {
    const geometryModulePath =
      "/src/rendering/native-katex-paint-geometry.ts";
    const geometry = await import(geometryModulePath);
    const visibleEndpointPaint = [
      ...root.querySelectorAll<HTMLElement>(
        ".kp-common-denominator-pressure-stage__endpoint"
      )
    ].filter((endpoint) => Number(getComputedStyle(endpoint).opacity) > 0)
      .flatMap((endpoint) => [
        ...endpoint.querySelectorAll<HTMLElement>(".katex-html")
      ]);
    const visibleMaterial = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )
    ].filter((owner) => Number(getComputedStyle(owner).opacity) > 0)
      .flatMap((owner) => owner.firstElementChild instanceof HTMLElement
        ? [owner.firstElementChild]
        : []);
    const rects = [...visibleEndpointPaint, ...visibleMaterial]
      .flatMap((element) => {
        const rect = geometry.measureKpNativeKatexSubtreePaintRect(
          root,
          element
        );
        return rect === undefined ? [] : [rect];
      });
    return {
      left: Math.min(...rects.map(({ left }) => left)),
      top: Math.min(...rects.map(({ top }) => top)),
      right: Math.max(...rects.map(({ left, width }) => left + width)),
      bottom: Math.max(...rects.map(({ top, height }) => top + height))
    };
  });
}

async function terminalMaterialPose(stage: Locator) {
  return stage.evaluate(async (root) => {
    const geometryPath = "/src/rendering/native-katex-paint-geometry.ts";
    const geometry = await import(geometryPath);
    const targetRoot = root.querySelector<HTMLElement>(
      '[data-kp-common-denominator-pressure-endpoint="equivalence-source"]'
    );
    if (targetRoot === null) throw new Error("Missing equivalence target root");
    const owners = [...root.querySelectorAll<HTMLElement>(
      '[data-kp-equation-material-endpoint-paint-atom-id]'
    )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0);
    const missingTargetAtomIds: string[] = [];
    const paintRectDeltas: number[] = [];
    const leafDeltas: Array<{
      atomId: string;
      semanticEntityId: string;
      paintRectDeltaPx: number;
      materialRect: { left: number; top: number; width: number; height: number };
      nativeRect: { left: number; top: number; width: number; height: number };
    }> = [];
    const rectDelta = (
      left: { left: number; top: number; width: number; height: number },
      right: { left: number; top: number; width: number; height: number }
    ) => Math.max(
      Math.abs(left.left - right.left),
      Math.abs(left.top - right.top),
      Math.abs(left.width - right.width),
      Math.abs(left.height - right.height)
    );
    for (const owner of owners) {
      const atomId =
        owner.dataset["kpEquationMaterialEndpointPaintAtomId"] ?? "";
      const semanticEntityId =
        owner.dataset["kpEquationMaterialSemanticEntityId"] ?? "";
      const nativeCandidates = [...targetRoot.querySelectorAll<HTMLElement>(
        `[data-kp-semantic-entity-id="${CSS.escape(semanticEntityId)}"]`
      )];
      const native = nativeCandidates.length === 1
        ? nativeCandidates[0]!
        : undefined;
      const visual = owner.firstElementChild as HTMLElement | null;
      if (native === undefined || visual === null) {
        missingTargetAtomIds.push(atomId);
        continue;
      }
      const materialRect = geometry.measureKpNativeKatexSubtreePaintRect(
        root,
        visual
      );
      const nativeRect = geometry.measureKpNativeKatexSubtreePaintRect(
        root,
        native
      );
      if (materialRect === undefined || nativeRect === undefined) {
        missingTargetAtomIds.push(atomId);
        continue;
      }
      const paintRectDeltaPx = rectDelta(materialRect, nativeRect);
      paintRectDeltas.push(paintRectDeltaPx);
      leafDeltas.push({
        atomId,
        semanticEntityId,
        paintRectDeltaPx,
        materialRect,
        nativeRect
      });
    }
    const maximum = (values: readonly number[]) =>
      values.length === 0 ? 0 : Math.max(...values);
    return {
      comparedLeafCount: owners.length,
      missingTargetAtomIds,
      maximumPaintRectDeltaPx: maximum(paintRectDeltas),
      leafDeltas
    };
  });
}

function maximumRectDelta(
  left: Awaited<ReturnType<typeof visiblePaintBounds>>,
  right: Awaited<ReturnType<typeof visiblePaintBounds>>
): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.right - right.right),
    Math.abs(left.bottom - right.bottom)
  );
}
