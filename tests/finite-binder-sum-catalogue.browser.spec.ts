import { expect, test, type Locator } from "@playwright/test";

import {
  kpCanonicalFiniteSumExpansionOperation
} from "../src/semantic/canonical-finite-sum-expansion.ts";

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
    "algebra",
    { timeout: 30_000 }
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.finite-sum-expansion.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute("data-kp-finite-sum-stage", "ready");
  await expect(stage.locator(".kp-finite-sum-stage__endpoint")).toHaveCount(2);
  await expect(stage.locator(
    ".kp-finite-sum-stage__frozen-source"
  )).toBeVisible();
  await expect(stage.locator(
    ".kp-finite-sum-stage__relation"
  )).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true",
    { timeout: 30_000 }
  );

  await seek.fill("0.18");
  await expect(stage).toHaveAttribute("data-kp-finite-sum-progress", "0.18");
  const relationAtFirstTransit = await stage.locator(
    ".kp-finite-sum-stage__relation .mrel"
  ).boundingBox();
  const firstBodyAtTransit = await stage.locator(
    `[data-kp-equation-material-semantic-entity-id="` +
    `${kpCanonicalFiniteSumExpansionOperation.target.instances[0]!.id}"]`
  ).locator(":scope > *").boundingBox();
  expect(relationAtFirstTransit).not.toBeNull();
  expect(firstBodyAtTransit).not.toBeNull();
  const relationCenterY = relationAtFirstTransit!.y +
    relationAtFirstTransit!.height / 2;
  const firstBodyCenterY = firstBodyAtTransit!.y +
    firstBodyAtTransit!.height / 2;
  expect(Math.abs(firstBodyCenterY - relationCenterY)).toBeGreaterThan(
    relationAtFirstTransit!.height * 0.25
  );

  await seek.fill("0.28");
  await expect(stage).toHaveAttribute("data-kp-finite-sum-progress", "0.28");
  const stageAtFirstArrival = await stage.boundingBox();
  const relationAtFirstArrival = await stage.locator(
    ".kp-finite-sum-stage__relation .mrel"
  ).boundingBox();
  const firstBodyAtArrival = await stage.locator(
    `[data-kp-equation-material-semantic-entity-id="` +
    `${kpCanonicalFiniteSumExpansionOperation.target.instances[0]!.id}"]`
  ).locator(":scope > *").boundingBox();
  expect(stageAtFirstArrival).not.toBeNull();
  expect(relationAtFirstArrival).not.toBeNull();
  expect(firstBodyAtArrival).not.toBeNull();
  // Generated terms belong to the target side of the retained equivalence.
  // This catches coordinate-space regressions that strand transit paint at
  // the material layer's upper-left origin while preserving route freedom.
  expect(firstBodyAtArrival!.x + firstBodyAtArrival!.width / 2).toBeGreaterThan(
    relationAtFirstArrival!.x + relationAtFirstArrival!.width / 2
  );
  expect(firstBodyAtArrival!.y).toBeGreaterThan(stageAtFirstArrival!.y);
  expect(firstBodyAtArrival!.y + firstBodyAtArrival!.height).toBeLessThan(
    stageAtFirstArrival!.y + stageAtFirstArrival!.height
  );

  for (const progress of [0, 0.16, 0.34, 0.52, 0.7, 0.88, 1, 0.6, 0]) {
    const sourceBoxBefore = await stage.locator(
      ".kp-finite-sum-stage__frozen-source"
    ).boundingBox();
    const relationBoxBefore = await stage.locator(
      ".kp-finite-sum-stage__relation"
    ).boundingBox();
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-finite-sum-progress",
      String(progress)
    );
    await expectAtMostOneAccessibleEndpoint(stage);
    expect(await visiblePaintCount(stage)).toBeGreaterThan(0);
    expect(await stage.locator(
      ".kp-finite-sum-stage__frozen-source"
    ).boundingBox()).toEqual(sourceBoxBefore);
    expect(await stage.locator(
      ".kp-finite-sum-stage__relation"
    ).boundingBox()).toEqual(relationBoxBefore);
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
  await expectAtMostOneAccessibleEndpoint(stage);
  expect(await visiblePaintCount(stage)).toBeGreaterThan(0);
});

async function expectAtMostOneAccessibleEndpoint(stage: Locator): Promise<void> {
  await expect.poll(() => stage.locator(
    '.kp-finite-sum-stage__endpoint[aria-hidden="false"]'
  ).count()).toBeLessThanOrEqual(1);
}

async function visiblePaintCount(stage: Locator): Promise<number> {
  return stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-finite-sum-stage__endpoint"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0.01);
    const retained = [...root.querySelectorAll<HTMLElement>(
      ".kp-finite-sum-stage__frozen-source, .kp-finite-sum-stage__relation"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0.01);
    const material = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0.01);
    return endpoints.length + retained.length + material.length;
  });
}
