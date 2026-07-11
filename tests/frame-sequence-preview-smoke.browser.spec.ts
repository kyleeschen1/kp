import { expect, test } from "@playwright/test";

import {
  createLinearSolveFrameSequencePreviewSmokeFixture
} from "../src/tutorial/frame-sequence-preview-smoke-fixture.ts";

test("frame-sequence preview smoke fixture renders sampled frame rows in the browser", async ({
  page
}) => {
  const fixture = createLinearSolveFrameSequencePreviewSmokeFixture();

  await page.setContent(fixture.html, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    "artifact.linear-solve.gif.frames"
  );

  const midpointFrame = page.locator(
    '[data-kp-frame-sequence-frame="frame-sequence.timeline-linear-solve-shared.0002"]'
  );
  await expect(midpointFrame).toBeVisible();
  await expect(midpointFrame).toHaveAttribute("data-kp-frame-progress", "0.5");

  const metrics = await midpointFrame.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      textLength: (element.textContent ?? "").trim().length,
      width: rect.width,
      height: rect.height
    };
  });

  expect(metrics.textLength).toBeGreaterThan(0);
  expect(metrics.width).toBeGreaterThan(0);
  expect(metrics.height).toBeGreaterThan(0);

  const sequenceJson = await page
    .locator("[data-kp-frame-sequence-json]")
    .textContent();
  const sequence = JSON.parse(sequenceJson ?? "{}") as {
    frames?: readonly unknown[];
    rewindFrameIds?: readonly string[];
  };

  expect(sequence.frames?.length).toBe(5);
  expect(sequence.rewindFrameIds?.[0]).toBe(
    "frame-sequence.timeline-linear-solve-shared.0004"
  );
});
