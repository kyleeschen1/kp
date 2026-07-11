import { expect, test } from "@playwright/test";

import { createAdditionProgrammingTutorialCardSample } from "../src/tutorial/programming-card-sample.ts";
import { loadKpProgrammingTutorialCardSmokeDocument } from "./support/tutorial-launch-smoke.ts";

test("programming tutorial card smoke fixture renders SourceFile panel in the browser", async ({
  page
}) => {
  const sample = createAdditionProgrammingTutorialCardSample();

  await loadKpProgrammingTutorialCardSmokeDocument(page, sample, sample.sample(0.75));

  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-card",
    "tutorial.programming.add.card.live-sample"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-manifest",
    "tutorial.programming.add.card"
  );
  await expect(page.locator("[data-kp-tutorial-source-file]")).toHaveAttribute(
    "data-kp-tutorial-source-file",
    "source-file.programming.add"
  );
  await expect(page.locator("[data-kp-tutorial-source-file]")).toHaveAttribute(
    "data-kp-tutorial-source-selector-count",
    "2"
  );
  await expect(page.locator("[data-kp-tutorial-source-file-frame]")).toContainText(
    "return a + b"
  );
});
