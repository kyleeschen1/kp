import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.equation.finite-sum-expansion.v1";

test("finite sum mounts once and remains inspectable across direct seeks", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0`);

  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  );
  const stage = slot.locator("[data-kp-finite-sum-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "algebra"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.finite-sum-expansion.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute("data-kp-finite-sum-stage", "ready");
  await expect(stage.locator(".kp-finite-sum-stage__endpoint")).toHaveCount(2);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );

  for (const progress of [0, 0.16, 0.34, 0.52, 0.7, 0.88, 1, 0.6, 0]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-finite-sum-progress",
      String(progress)
    );
    await expectOneAccessibleEndpoint(stage);
    expect(await visiblePaintCount(stage)).toBeGreaterThan(0);
  }

  await expect(stage).toHaveAttribute(
    "data-kp-finite-sum-visual-owner",
    "source-native"
  );
  expect(pageErrors).toEqual([]);
});

test("finite sum URL restores its semantic frame without playback", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.63`);
  const stage = page.locator(
    `[data-kp-editor-animation-id="${animationId}"] ` +
    "[data-kp-finite-sum-stage]"
  );
  await expect(stage).toHaveAttribute("data-kp-finite-sum-stage", "ready");
  await expect(stage).toHaveAttribute("data-kp-finite-sum-progress", "0.63");
  await expectOneAccessibleEndpoint(stage);
  expect(await visiblePaintCount(stage)).toBeGreaterThan(0);
});

async function expectOneAccessibleEndpoint(stage: Locator): Promise<void> {
  await expect.poll(() => stage.locator(
    '.kp-finite-sum-stage__endpoint[aria-hidden="false"]'
  ).count()).toBe(1);
}

async function visiblePaintCount(stage: Locator): Promise<number> {
  return stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-finite-sum-stage__endpoint"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0.01);
    const material = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0.01);
    return endpoints.length + material.length;
  });
}
