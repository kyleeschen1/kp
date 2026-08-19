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
    "masked-carrier-relay"
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
    { progress: 0.49, state: "source" },
    { progress: 0.53, state: "carrier" },
    { progress: 0.6, state: "target" },
    { progress: 0.85, state: "target" }
  ] as const) {
    await seek.fill(String(checkpoint.progress));
    await expect(stage).toHaveAttribute(
      "data-kp-operation-evaluation-legibility-state",
      checkpoint.state
    );
    await expect(stage).toHaveAttribute(
      "data-kp-operation-evaluation-readable-cohort-count",
      checkpoint.state === "carrier" ? "0" : "1"
    );
    const snapshot = await readableCohortSnapshot(stage);
    expect(snapshot.readableEquationCohorts).toBeLessThanOrEqual(1);
    expect(snapshot.hasVisiblePaint).toBe(true);
  }

  await seek.fill("0.53");
  const firstSignature = await materialOwnerSignature(stage);
  await seek.fill("0.2");
  await seek.fill("0.53");
  expect(await materialOwnerSignature(stage)).toEqual(firstSignature);
  await expect(source).toHaveAttribute(
    "data-kp-endpoint-identity-probe",
    "stable"
  );
});

test("a family URL reconstructs its exact candidate", async ({ page }) => {
  await page.goto(
    `/?artifact=${animationId}&evaluationFamily=masked-carrier-relay`
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
    "masked-carrier-relay"
  );
  await expect(review.locator(
    '[data-family="masked-carrier-relay"]'
  )).toHaveAttribute("aria-pressed", "true");
});

async function materialOwnerSignature(stage: Locator) {
  return stage.evaluate((element) => {
    const root = element as HTMLElement;
    const carrier = root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-masked-carrier]"
    );
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
      })),
      carrier: carrier === null ? null : {
        transform: carrier.style.transform,
        visibility: carrier.style.visibility
      }
    };
  });
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
    const carrierVisible = visible(root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-masked-carrier]"
    ));
    return {
      readableEquationCohorts:
        Number(sourceVisible) + Number(targetVisible),
      hasVisiblePaint: sourceVisible || targetVisible || carrierVisible
    };
  });
}
