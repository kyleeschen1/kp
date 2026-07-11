import { test } from "@playwright/test";

import { createLinearSolveIframeExportSmokeFixture } from "../src/tutorial/iframe-export-smoke-fixture.ts";
import {
  expectKpTutorialCardSeekSample,
  loadKpIframeExportSmokeFixtureDocument
} from "./support/tutorial-launch-smoke.ts";

test("iframe tutorial card smoke fixture can seek across sampled progress", async ({
  page
}) => {
  for (const progress of [0, 0.5, 1]) {
    const fixture = createLinearSolveIframeExportSmokeFixture(progress);

    await loadKpIframeExportSmokeFixtureDocument(page, fixture);
    await expectKpTutorialCardSeekSample(page, {
      progress: fixture.progress,
      clockId: "timeline.linear-solve.shared",
      beat: progress * 50
    });
  }
});
