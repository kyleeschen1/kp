import { expect, test } from "@playwright/test";

import {
  createGeneratedLinearSolveIframeSmokeFixture
} from "../src/tutorial/generated-linear-solve-smoke-fixture.ts";
import {
  expectKpTutorialPanelNonblank
} from "./support/tutorial-launch-smoke.ts";

test("generated linear-solve iframe smoke fixture renders in the browser", async ({
  page
}) => {
  const fixture = createGeneratedLinearSolveIframeSmokeFixture(
    "generated.linear-solve.two-x-plus-3",
    0.5
  );

  await page.setContent(fixture.html, { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    "artifact.generated.linear-solve.two-x-plus-3.iframe"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-card",
    "tutorial.generated.linear-solve.two-x-plus-3.card.live-sample"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-fixture",
    "generated.linear-solve.two-x-plus-3"
  );
  await expectKpTutorialPanelNonblank(page, "equation");

  const artifactJson = await page
    .locator("[data-kp-export-artifact-json]")
    .textContent();

  expect(JSON.parse(artifactJson ?? "{}")).toMatchObject({
    id: "artifact.generated.linear-solve.two-x-plus-3.iframe",
    metadata: {
      generatedFixtureId: "generated.linear-solve.two-x-plus-3"
    }
  });
  expect(fixture.dependencyManifest.fixtureId).toBe(
    "generated.linear-solve.two-x-plus-3"
  );
});
