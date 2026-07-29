import { expect, test, type Locator } from "@playwright/test";

const descriptorId =
  "editor-animation.animation.operation-evaluation.one-plus-two";
const animationId =
  "animation.operation-evaluation.one-plus-two";

test("one plus two mounts through the lazy verified compositor adapter", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    "[data-kp-editor-animation-surface-slot=\"equation\"]"
  );
  const stage = slot.locator("[data-kp-operation-evaluation-stage]");

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "operation-evaluation"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.operation-evaluation.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-presentation-mode",
    "verified-motion"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-transfer-topology",
    "shared-zero-area-junction"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-native-katex-successor-synthesis-count",
    "1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-canonical-native-katex-session-factory",
    "shared-v1"
  );
});

test("one plus two direct seek and rewind share one exact pose", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-operation-evaluation-stage]");
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );

  await scrubber.fill("0.25");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.25"
  );
  const forwardOwners = await ownerPoses(stage);

  await player.locator(
    "[data-action=\"rewind-editor-animation\"]"
  ).click();
  await player.locator(
    "[data-action=\"toggle-editor-animation\"]"
  ).click();
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-direction",
    "rewind"
  );
  await scrubber.fill("0.75");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.25"
  );
  const rewindOwners = await ownerPoses(stage);

  expect(rewindOwners).toEqual(forwardOwners);
  await scrubber.fill("0.3");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.7"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-boundary-side",
    "junction"
  );
});

test("Review can capture the one plus two Animation Library moment", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await expect(player.locator(
    "[data-kp-operation-evaluation-stage]"
  )).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );
  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review.locator("button.launcher")).toBeVisible();
  await review.locator("button.launcher").click();
  await review.locator("textarea").fill(
    "Operation evaluation Review capture wiring proof."
  );
  await expect(review.locator(".meta")).toContainText("wide");
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/dev/reviews/v2/notes") &&
    response.request().method() === "POST"
  );
  await review.locator("button.save").click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const note = await response.json() as {
    capture: {
      semantic: {
        assetId?: string;
      };
    };
  };
  expect(note.capture.semantic.assetId).toBe(animationId);
});

async function ownerPoses(
  stage: Locator
): Promise<readonly string[]> {
  return stage.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((owners) => owners.map((owner) => {
    const element = owner as HTMLElement;
    return [
      element.dataset["kpEquationMaterialFragmentRole"],
      element.style.opacity,
      element.style.transform
    ].join("|");
  }).sort());
}
