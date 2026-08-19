import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.operation-evaluation.two-times-three";
const quotientAnimationId = "animation.operation-evaluation.three-sixths";

test("evaluation families share endpoints and change only the handoff", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const review = player.locator(
    "[data-kp-operation-evaluation-family-review]"
  );
  const stage = review.locator("[data-kp-operation-evaluation-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready",
    { timeout: 15_000 }
  );
  await expect(review).toHaveAttribute(
    "data-kp-operation-evaluation-family",
    "contributor-fusion"
  );
  await expect(stage.locator(
    "[data-kp-operation-evaluation-source]"
  )).toContainText("2×3");
  await expect(stage.locator(
    "[data-kp-operation-evaluation-target]"
  )).toContainText("6");

  const source = stage.locator("[data-kp-operation-evaluation-source]");
  await source.evaluate((element) => {
    (element as HTMLElement).dataset["kpEndpointIdentityProbe"] = "stable";
  });
  for (const checkpoint of [
    { progress: 0.2, state: "source" },
    { progress: 0.47, state: "source" },
    { progress: 0.5, state: "kernel" },
    { progress: 0.54, state: "kernel" },
    { progress: 0.62, state: "target" },
    { progress: 0.85, state: "target" }
  ] as const) {
    await seek.fill(String(checkpoint.progress));
    await expect(stage).toHaveAttribute(
      "data-kp-operation-evaluation-legibility-state",
      checkpoint.state
    );
    await expect(stage).toHaveAttribute(
      "data-kp-operation-evaluation-readable-cohort-count",
      checkpoint.state === "kernel" ? "0" : "1"
    );
    const snapshot = await readableCohortSnapshot(stage);
    expect(snapshot.visibleEquationCohorts).toBe(1);
    expect(snapshot.hasVisiblePaint).toBe(true);
  }

  await seek.fill("0.5");
  const sourceKernel = await cohortGeometry(stage, "source");
  expect(sourceKernel.centerSpreadX).toBeGreaterThan(1);
  expect(sourceKernel.centerSpreadX).toBeLessThan(20);
  expect(sourceKernel.centerSpreadY).toBeLessThan(1);
  expect(sourceKernel.maximumScale).toBeLessThan(0.53);
  expect(sourceKernel.minimumScale).toBeGreaterThanOrEqual(0.18);
  expect(sourceKernel.maximumScale - sourceKernel.minimumScale)
    .toBeLessThan(0.001);
  expect(sourceKernel.rolesInVisualOrder).toEqual([
    "successor-source:material-input",
    "successor-source:catalyst",
    "successor-source:material-input"
  ]);
  await expect(stage.locator(
    "[data-kp-operation-evaluation-masked-carrier]"
  )).toHaveCount(0);
  const firstSignature = await materialOwnerSignature(stage);
  await seek.fill("0.2");
  await seek.fill("0.5");
  expect(await materialOwnerSignature(stage)).toEqual(firstSignature);
  await expect(source).toHaveAttribute(
    "data-kp-endpoint-identity-probe",
    "stable"
  );
});

test("a family URL reconstructs its exact candidate", async ({ page }) => {
  await page.goto(
    `/?artifact=${animationId}&evaluationFamily=contributor-fusion`
  );
  const review = page.locator(
    "[data-kp-operation-evaluation-family-review]"
  );
  const stage = review.locator("[data-kp-operation-evaluation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready",
    { timeout: 15_000 }
  );
  await expect(review).toHaveAttribute(
    "data-kp-operation-evaluation-family",
    "contributor-fusion"
  );
  await expect(review.locator(
    '[data-family="contributor-fusion"]'
  )).toHaveAttribute("aria-pressed", "true");
});

test("ink-knot fusion preserves a stacked fraction's native reading order", async ({
  page
}) => {
  await page.goto(
    `/?artifact=${quotientAnimationId}&evaluationFamily=contributor-fusion`
  );
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${quotientAnimationId}"]`
  );
  const review = player.locator(
    "[data-kp-operation-evaluation-family-review]"
  );
  const stage = review.locator("[data-kp-operation-evaluation-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready",
    { timeout: 15_000 }
  );
  const source = stage.locator("[data-kp-operation-evaluation-source]");
  const target = stage.locator("[data-kp-operation-evaluation-target]");
  await expect(source).toContainText("3");
  await expect(source).toContainText("6");
  await expect(target).toContainText("1");
  await expect(target).toContainText("2");

  await seek.fill("0.5");
  const sourceKernel = await cohortGeometry(stage, "source");
  expect(sourceKernel.centerSpreadX).toBeLessThan(1);
  expect(sourceKernel.centerSpreadY).toBeGreaterThan(1);
  expect(sourceKernel.centerSpreadY).toBeLessThan(20);
  expect(sourceKernel.maximumScale - sourceKernel.minimumScale)
    .toBeLessThan(0.001);
  expect(sourceKernel.rolesInVerticalOrder).toEqual([
    "successor-source:material-input",
    "successor-source:catalyst",
    "successor-source:material-input"
  ]);

  const firstSignature = await materialOwnerSignature(stage);
  await seek.fill("0.8");
  await seek.fill("0.5");
  expect(await materialOwnerSignature(stage)).toEqual(firstSignature);
  await seek.fill("1");
  expect((await readableCohortSnapshot(stage)).visibleEquationCohorts).toBe(1);
});

async function materialOwnerSignature(stage: Locator) {
  return stage.evaluate((element) => {
    const root = element as HTMLElement;
    return {
      owners: [...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"],
        transform: owner.style.transform,
        visibility: owner.style.visibility,
        clipPath:
          (owner.firstElementChild as HTMLElement | null)?.style.clipPath,
        text: owner.textContent
      }))
    };
  });
}

async function cohortGeometry(
  stage: Locator,
  side: "source" | "target"
) {
  return stage.evaluate((element, requestedSide) => {
    const owners = [...element.querySelectorAll<HTMLElement>(
      `[data-kp-equation-material-fragment-role^="successor-${requestedSide}:"]`
    )].filter((owner) => getComputedStyle(owner).visibility !== "hidden");
    const centers = owners.map((owner) => {
      const rect = owner.getBoundingClientRect();
      const matrix = new DOMMatrix(getComputedStyle(owner).transform);
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        scale: Math.abs(matrix.a),
        role: owner.dataset["kpEquationMaterialFragmentRole"] ?? ""
      };
    });
    return {
      centerSpreadX: Math.max(...centers.map(({ x }) => x)) -
        Math.min(...centers.map(({ x }) => x)),
      centerSpreadY: Math.max(...centers.map(({ y }) => y)) -
        Math.min(...centers.map(({ y }) => y)),
      minimumScale: Math.min(...centers.map(({ scale }) => scale)),
      maximumScale: Math.max(...centers.map(({ scale }) => scale)),
      rolesInVisualOrder: [...centers]
        .sort((left, right) => left.x - right.x)
        .map(({ role }) => role),
      rolesInVerticalOrder: [...centers]
        .sort((top, bottom) => top.y - bottom.y)
        .map(({ role }) => role)
    };
  }, side);
}

async function readableCohortSnapshot(stage: Locator) {
  return stage.evaluate((element) => {
    const root = element as HTMLElement;
    const visible = (candidate: HTMLElement | null) => {
      if (candidate === null) return false;
      const style = getComputedStyle(candidate);
      const rect = candidate.getBoundingClientRect();
      return style.visibility !== "hidden" &&
        Number(style.opacity) > 0.01 &&
        rect.width > 0 && rect.height > 0;
    };
    const cohortVisible = (side: "source" | "target") => [
      ...root.querySelectorAll<HTMLElement>(
        `[data-kp-equation-material-fragment-role^="successor-${side}:"]`
      )
    ].some(visible);
    const sourceVisible = visible(root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-source]"
    )) || cohortVisible("source");
    const targetVisible = visible(root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-target]"
    )) || cohortVisible("target");
    return {
      visibleEquationCohorts:
        Number(sourceVisible) + Number(targetVisible),
      hasVisiblePaint: sourceVisible || targetVisible
    };
  });
}
