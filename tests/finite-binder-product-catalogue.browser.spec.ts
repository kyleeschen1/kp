import { expect, test, type Locator } from "@playwright/test";

import { kpCanonicalFiniteProductExpansionOperation } from
  "../src/semantic/canonical-finite-product-expansion.ts";

const animationId = "animation.equation.finite-product-expansion.v1";

test("finite product mounts through its own adapter and supports direct seeks", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0`);
  const player = page.locator(
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  );
  const stage = slot.locator("[data-kp-finite-product-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "algebra",
    { timeout: 30_000 }
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.finite-product-expansion.canonical-native-katex"
  );
  await waitForProductReady(stage);
  await expect(stage.locator(
    ".kp-finite-product-stage__frozen-source"
  )).toBeVisible();
  await expect(stage.locator(
    ".kp-finite-product-stage__relation"
  )).toBeVisible();

  const sourceBox = await stage.locator(
    ".kp-finite-product-stage__frozen-source"
  ).boundingBox();
  const relationBox = await stage.locator(
    ".kp-finite-product-stage__relation"
  ).boundingBox();
  for (const progress of [0, 0.18, 0.3, 0.46, 0.54, 0.7, 0.78, 1, 0.5, 0]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-finite-product-progress",
      String(progress)
    );
    await expectAtMostOneAccessibleEndpoint(stage);
    expect(await visiblePaintCount(stage)).toBeGreaterThan(0);
    expect(await stage.locator(
      ".kp-finite-product-stage__frozen-source"
    ).boundingBox()).toEqual(sourceBox);
    expect(await stage.locator(
      ".kp-finite-product-stage__relation"
    ).boundingBox()).toEqual(relationBox);
  }

  await seek.fill("0.3");
  const relation = await stage.locator(
    ".kp-finite-product-stage__relation .mrel"
  ).boundingBox();
  const firstFactor = await stage.locator(
    `[data-kp-equation-material-semantic-entity-id="` +
    `${kpCanonicalFiniteProductExpansionOperation.target.instances[0]!.id}"]`
  ).locator(':scope > [data-kp-equation-material-visual-active="true"]')
    .boundingBox();
  expect(relation).not.toBeNull();
  expect(firstFactor).not.toBeNull();
  expect(firstFactor!.x + firstFactor!.width / 2).toBeGreaterThan(
    relation!.x + relation!.width / 2
  );

  await seek.fill("1");
  await expect(stage).toHaveAttribute(
    "data-kp-finite-product-visual-owner",
    "target-native"
  );
  await expect(stage.locator(
    '.kp-finite-product-stage__endpoint[aria-hidden="false"]'
  )).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test("finite product URL restores an arbitrary semantic frame", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.63`);
  const stage = page.locator(
    `[data-kp-editor-animation-id="${animationId}"] ` +
    "[data-kp-finite-product-stage]"
  );
  await waitForProductReady(stage);
  await expect(stage).toHaveAttribute(
    "data-kp-finite-product-progress",
    "0.63"
  );
  expect(await visiblePaintCount(stage)).toBeGreaterThan(0);
});

async function expectAtMostOneAccessibleEndpoint(stage: Locator):
Promise<void> {
  await expect.poll(() => stage.locator(
    '.kp-finite-product-stage__endpoint[aria-hidden="false"]'
  ).count()).toBeLessThanOrEqual(1);
}

async function waitForProductReady(stage: Locator): Promise<void> {
  await stage.waitFor({ timeout: 30_000 });
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    const settle = () => {
      const status = root.dataset["kpFiniteProductStage"];
      if (status === "preparing") return false;
      if (status === "ready") resolve();
      else reject(new Error(
        root.dataset["kpFiniteProductError"] ??
        `Finite-product stage ended in ${status ?? "unknown"}.`
      ));
      return true;
    };
    if (settle()) return;
    const observer = new MutationObserver(() => {
      if (!settle()) return;
      observer.disconnect();
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-finite-product-stage"]
    });
  }));
}

async function visiblePaintCount(stage: Locator): Promise<number> {
  return stage.evaluate((root) => [...root.querySelectorAll<HTMLElement>(
    ".kp-finite-product-stage__endpoint, " +
    ".kp-finite-product-stage__frozen-source, " +
    ".kp-finite-product-stage__relation, " +
    "[data-kp-equation-material-owner-id]"
  )].filter((element) =>
    Number(getComputedStyle(element).opacity) > 0.01
  ).length);
}
