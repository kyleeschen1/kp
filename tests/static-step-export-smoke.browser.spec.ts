import { expect, test } from "@playwright/test";

import { createLinearSolveStaticStepExportSmokeFixture } from "../src/tutorial/static-step-export-smoke-fixture.ts";
import { loadKpStaticStepExportSmokeFixtureDocument } from "./support/tutorial-launch-smoke.ts";

test("static-step export smoke fixture renders step sequence document in the browser", async ({
  page
}) => {
  const fixture = createLinearSolveStaticStepExportSmokeFixture();

  await loadKpStaticStepExportSmokeFixtureDocument(page, fixture);

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    "artifact.linear-solve.steps"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-export-payload",
    "json-document"
  );
  await expect(page.locator("[data-kp-static-step]")).toHaveCount(4);
  await expect(
    page.locator('[data-kp-static-step="step.timeline.linear-solve.shared.start"]')
  ).toHaveAttribute("data-kp-static-step-progress", "0");
  await expect(
    page.locator(
      '[data-kp-static-step="step.transform.linear-solve.simplify-right-difference"]'
    )
  ).toHaveAttribute("data-kp-static-step-progress", "1");

  const sequenceJson = await page
    .locator("[data-kp-static-step-sequence-json]")
    .textContent();
  const sequence = JSON.parse(sequenceJson ?? "{}") as {
    steps?: readonly { progress: number }[];
  };

  expect(sequence.steps?.map((step) => step.progress)).toEqual([
    0,
    1 / 3,
    2 / 3,
    1
  ]);
});
