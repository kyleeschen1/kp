import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.operation-evaluation.two-times-three";

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
    "punctuated-substitution"
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
  await seek.fill("0.55");
  await expect(source).toHaveCSS("opacity", "1");
  expect(await visibleMaterialOwnerCount(stage)).toBe(0);
  await seek.fill("0.7");
  await expect(stage.locator(
    "[data-kp-operation-evaluation-target]"
  )).toHaveCSS("opacity", "1");

  await review.locator(
    '[data-family="contributor-fusion"]'
  ).click();
  await expect(page).toHaveURL(/evaluationFamily=contributor-fusion/);
  await expect(source).toHaveAttribute(
    "data-kp-endpoint-identity-probe",
    "stable"
  );
  await seek.fill("0.55");
  const materialOwners = stage.locator(
    "[data-kp-equation-material-owner-id]"
  );
  await expect(materialOwners).not.toHaveCount(0);
  const firstSignature = await materialOwnerSignature(stage);
  await seek.fill("0.2");
  await seek.fill("0.55");
  expect(await materialOwnerSignature(stage)).toEqual(firstSignature);

  await review.locator('[data-family="result-reception"]').click();
  await seek.fill("0.88");
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-cue-kind",
    "result-reception"
  );
  const cueScale = await stage.locator(
    "[data-kp-operation-evaluation-family-cue]"
  ).evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    return transform === "none" ? 0 : new DOMMatrix(transform).a;
  });
  expect(cueScale).toBeGreaterThan(0.01);
  await expect(source).toHaveAttribute(
    "data-kp-endpoint-identity-probe",
    "stable"
  );
});

test("a family URL reconstructs its exact candidate", async ({ page }) => {
  await page.goto(
    `/?artifact=${animationId}&evaluationFamily=result-reception`
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
    "result-reception"
  );
  await expect(review.locator(
    '[data-family="result-reception"]'
  )).toHaveAttribute("aria-pressed", "true");
});

async function materialOwnerSignature(stage: Locator) {
  return stage.locator("[data-kp-equation-material-owner-id]").evaluateAll(
    (owners) => owners.map((owner) => {
      const element = owner as HTMLElement;
      return {
        id: element.dataset["kpEquationMaterialOwnerId"],
        transform: element.style.transform,
        text: element.textContent
      };
    })
  );
}

async function visibleMaterialOwnerCount(stage: Locator): Promise<number> {
  return stage.locator("[data-kp-equation-material-owner-id]").evaluateAll(
    (owners) => owners.filter((owner) => {
      const element = owner as HTMLElement;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return Number(style.opacity) > 0.01 && rect.width > 0 && rect.height > 0;
    }).length
  );
}
