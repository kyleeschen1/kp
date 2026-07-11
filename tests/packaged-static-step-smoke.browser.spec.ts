import { expect, test } from "@playwright/test";

import {
  createLinearSolveStaticHostFixtureRoot
} from "../src/tutorial/static-host-fixture-root.ts";
import {
  loadKpStaticHostFixtureEntryDocument
} from "./support/tutorial-launch-smoke.ts";

test("packaged static-step fixture renders from static-host root entry", async ({
  page
}) => {
  const root = createLinearSolveStaticHostFixtureRoot();

  await loadKpStaticHostFixtureEntryDocument(
    page,
    root,
    "linear-solve/static-steps/index.html"
  );

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    "artifact.linear-solve.steps"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-export-payload",
    "json-document"
  );
  await expect(page.locator("[data-kp-static-step]")).toHaveCount(4);

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
