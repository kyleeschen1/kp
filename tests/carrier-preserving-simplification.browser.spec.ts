import { expect, test, type Locator, type Page } from "@playwright/test";

const animationId =
  "animation.operation-evaluation.two-times-one-carrier";
const adapterId =
  "editor-animation-surface.operation-evaluation.carrier-preserving-simplification";

test("carrier simplification seeks and rewinds through one paint owner", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0.42&theme=dark`);
  const { player, slot, stage, seek } = await readySurface(page);

  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    adapterId
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "operation-evaluation"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-progress",
    "0.42"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-recipe-id",
    /carrier-evidence\.two-times-one/u
  );
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-removed-track-count",
    "2"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-treatment",
    "identity-withdrawal"
  );
  await expectOnePaintSurface(stage);
  await expectOneAccessibleEndpoint(stage);
  await expectOpaqueUnscaledCarrier(stage);

  const checkpoints = ["0", "0.2", "0.42", "0.7", "0.9", "1", "0.42"];
  const firstSignature = await materialSignatureAt(stage, seek, "0.42");
  for (const checkpoint of checkpoints) {
    await seek.fill(checkpoint);
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      checkpoint
    );
    await expectOnePaintSurface(stage);
    await expectOneAccessibleEndpoint(stage);
  }
  expect(await materialSignatureAt(stage, seek, "0.42"))
    .toEqual(firstSignature);

  await player.focus();
  await page.keyboard.press("r");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await seek.fill("0.25");
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-progress",
    "0.75"
  );
  await expectOnePaintSurface(stage);
  expect(pageErrors).toEqual([]);
});

test("direct URL, interruption, and resize preserve the selected state", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.64&theme=dark`);
  const initial = await readySurface(page);
  await expect(initial.stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-measurement-revision",
    "0"
  );
  await initial.stage.evaluate((element) => {
    element.dataset["kpPreReloadIdentityProbe"] = "old-stage";
  });
  await page.reload();
  const remounted = await readySurface(page);
  await expect(remounted.stage).not.toHaveAttribute(
    "data-kp-pre-reload-identity-probe",
    "old-stage"
  );
  await expect(remounted.stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-progress",
    "0.64"
  );
  // Leave enough real-time runway to prove interruption; at 64% the short
  // exemplar can finish before Playwright observes its transient play state.
  await remounted.seek.fill("0.05");
  await expect(remounted.stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-progress",
    "0.05"
  );

  await remounted.player.locator(
    '[data-action="toggle-editor-animation"]'
  ).click();
  await expect(remounted.player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );
  await expect.poll(async () => Number(
    await remounted.player.getAttribute("data-kp-editor-animation-progress")
  )).toBeGreaterThan(0.05);
  await remounted.seek.fill("0.36");
  await expect(remounted.player).not.toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );
  await expect(remounted.stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-progress",
    "0.36"
  );

  await page.setViewportSize({ width: 1_100, height: 800 });
  await expect(remounted.stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-measurement-revision",
    "1"
  );
  await expect(remounted.stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-stage",
    "ready"
  );
  await expect(remounted.stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-progress",
    "0.36"
  );
  await expectOnePaintSurface(remounted.stage);
});

test("reduced motion selects semantic checkpoints and native settlement", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=0.2&theme=light`);
  const { player, stage, seek } = await readySurface(page);
  await player.evaluate((element) => {
    element.dataset["kpEditorAnimationAccessibilityMode"] = "reduced-motion";
  });

  await seek.fill("0.2");
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-progress",
    "0"
  );
  await expect(stage.locator(
    '[data-kp-carrier-preserving-simplification-endpoint="source"]'
  )).toHaveAttribute("aria-hidden", "false");
  await seek.fill("0.8");
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-progress",
    "1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-visual-owner",
    "target-native"
  );
  await expect(stage.locator(
    '[data-kp-carrier-preserving-simplification-endpoint="target"]'
  )).toHaveAttribute("aria-hidden", "false");
  await expectOnePaintSurface(stage);
  await expectOneAccessibleEndpoint(stage);
  const bounds = await stage.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
});

async function readySurface(page: Page) {
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  );
  const stage = slot.locator(
    "[data-kp-carrier-preserving-simplification-stage]"
  );
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toBeAttached({ timeout: 15_000 });
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-stage",
    "ready",
    { timeout: 15_000 }
  );
  return { player, slot, stage, seek };
}

async function expectOnePaintSurface(stage: Locator): Promise<void> {
  await expect.poll(() => stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-carrier-preserving-simplification-stage__endpoint"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0);
    const material = root.querySelector<HTMLElement>(
      "[data-kp-editor-equation-material-layer]"
    );
    const materialVisible = material !== null &&
      [...material.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].some((element) => Number(getComputedStyle(element).opacity) > 0);
    return endpoints.length + Number(materialVisible);
  })).toBe(1);
}

async function expectOneAccessibleEndpoint(stage: Locator): Promise<void> {
  await expect(stage.locator(
    ".kp-carrier-preserving-simplification-stage__endpoint" +
    '[aria-hidden="false"]:not([inert])'
  )).toHaveCount(1);
  await expect(stage.locator(
    ".kp-carrier-preserving-simplification-stage__endpoint" +
    '[aria-hidden="true"][inert]'
  )).toHaveCount(1);
}

async function expectOpaqueUnscaledCarrier(stage: Locator): Promise<void> {
  const carrier = stage.locator(
    '[data-kp-equation-material-semantic-entity-id$=".source.carrier"]'
  );
  await expect(carrier).toHaveCount(1);
  const style = await carrier.evaluate((element) => ({
    opacity: Number(getComputedStyle(element).opacity),
    scaleX: Math.abs(new DOMMatrix(getComputedStyle(element).transform).a),
    scaleY: Math.abs(new DOMMatrix(getComputedStyle(element).transform).d)
  }));
  expect(style.opacity).toBe(1);
  expect(style.scaleX).toBeCloseTo(1, 5);
  expect(style.scaleY).toBeCloseTo(1, 5);
}

async function materialSignatureAt(
  stage: Locator,
  seek: Locator,
  progress: string
) {
  await seek.fill(progress);
  return stage.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((owners) => owners.map((element) => {
    const owner = element as HTMLElement;
    return {
      id: owner.dataset["kpEquationMaterialOwnerId"],
      entity: owner.dataset["kpEquationMaterialSemanticEntityId"],
      opacity: owner.style.opacity,
      transform: owner.style.transform
    };
  }));
}
