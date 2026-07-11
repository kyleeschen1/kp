import { test } from "@playwright/test";

import { createLinearSolveIframeExportSmokeFixture } from "../src/tutorial/iframe-export-smoke-fixture.ts";
import { createAdditionProgrammingTutorialCardSample } from "../src/tutorial/programming-card-sample.ts";
import {
  expectKpTutorialPanelNonblank,
  loadKpIframeExportSmokeFixtureDocument,
  loadKpProgrammingTutorialCardSmokeDocument
} from "./support/tutorial-launch-smoke.ts";

test("iframe tutorial card renders nonblank equation and graph panels", async ({
  page
}) => {
  await loadKpIframeExportSmokeFixtureDocument(
    page,
    createLinearSolveIframeExportSmokeFixture(0.5)
  );

  await expectKpTutorialPanelNonblank(page, "equation");
  await expectKpTutorialPanelNonblank(page, "graph");
});

test("programming tutorial card renders a nonblank code panel", async ({
  page
}) => {
  const sample = createAdditionProgrammingTutorialCardSample();

  await loadKpProgrammingTutorialCardSmokeDocument(page, sample, sample.sample(0.75));

  await expectKpTutorialPanelNonblank(page, "code");
});
