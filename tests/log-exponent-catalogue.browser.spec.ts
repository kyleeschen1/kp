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
  await player.locator('[data-action="seek-editor-animation"]').fill("0.95");
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-operation-id",
    "operation.log-exponent.divide-by-log-base"
  );
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
