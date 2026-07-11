import { expect, test } from "@playwright/test";

import {
  createAdditionProgrammingExecutionTraceTutorialCardSample,
  renderKpProgrammingExecutionTraceTutorialCardHtmlShell
} from "../src/tutorial/programming-execution-trace-card-sample.ts";
import {
  expectKpTutorialPanelNonblank
} from "./support/tutorial-launch-smoke.ts";

test("programming execution-trace tutorial card renders source and trace panels", async ({
  page
}) => {
  const sample = createAdditionProgrammingExecutionTraceTutorialCardSample();
  const frame = sample.sample(1);

  await page.setContent(
    [
      "<!doctype html>",
      `<html lang="en">`,
      "<head>",
      `  <meta charset="utf-8" />`,
      `  <meta name="viewport" content="width=device-width, initial-scale=1" />`,
      `  <title>${sample.title}</title>`,
      "</head>",
      "<body>",
      renderKpProgrammingExecutionTraceTutorialCardHtmlShell(sample, frame),
      "</body>",
      "</html>"
    ].join("\n"),
    { waitUntil: "domcontentloaded" }
  );

  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-card",
    "tutorial.programming.add.execution-trace.card.live-sample"
  );
  await expectKpTutorialPanelNonblank(page, "code");
  await expectKpTutorialPanelNonblank(page, "execution-trace");
  await expect(page.locator("[data-kp-tutorial-execution-output]")).toHaveText(
    "4"
  );
});
