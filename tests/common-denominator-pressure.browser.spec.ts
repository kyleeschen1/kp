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
    ).toBeLessThan(8);
    expect(
      maximumRectDelta(bounds[1]!, bounds[2]!),
      `post-seam geometry ${seam}: ${JSON.stringify(bounds)}`
    ).toBeLessThan(1);
  }

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
