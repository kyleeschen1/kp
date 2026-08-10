import { expect, test } from "@playwright/test";
import {
  createKpFractionCompositionAnnotatedEndpoints
} from "../src/rendering/fraction-composition-selector-annotated-latex.ts";

test("fraction composition mounts the compiler-owned canonical stage shell", async ({
  page
}) => {
  await page.goto("/reader/fraction-composition/", {
    waitUntil: "domcontentloaded"
  });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveCount(1);
  await expect(stage.locator("[data-kp-reader-equation-viewport]")).toHaveCount(1);
  await expect(stage.locator("[data-kp-reader-material-fit-surface]")).toHaveCount(1);
  await expect(stage.locator("[data-kp-reader-equation-material-layer]")).toHaveCount(1);
  await expect(stage.locator("[data-kp-reader-transition]")).toHaveCount(13);
  await expect(stage.locator(
    '[data-kp-reader-equation-measurement][aria-hidden="true"]'
  )).toHaveCount(13);
  await expect(stage.locator('[data-kp-reader-native="source"]')).toHaveCount(13);
  await expect(stage.locator('[data-kp-reader-native="target"]')).toHaveCount(13);
  await expect(stage.locator(
    "[data-kp-reader-accessible-equation][aria-live='polite'][aria-atomic='true']"
  )).toHaveCount(1);
  await expect(stage.locator(
    "[data-kp-reader-accessible-equation-state][aria-current='step']"
  )).toHaveCount(1);

  for (const endpoint of createKpFractionCompositionAnnotatedEndpoints()) {
    const states = stage.locator(
      `[data-kp-reader-equation-state="${endpoint.stateId}"]`
    );
    const stateCount = await states.count();
    expect(stateCount).toBeGreaterThan(0);
    for (let stateIndex = 0; stateIndex < stateCount; stateIndex += 1) {
      const state = states.nth(stateIndex);
      for (const anchor of endpoint.structuralAnchors) {
        await expect(state.locator(
          `[data-kp-reader-selector-id="${anchor.id}"]`
        )).toHaveCount(1);
      }
    }
  }
});
