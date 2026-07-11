import { expect, test } from "@playwright/test";

import { createLinearSolveIframeExportSmokeFixture } from "../src/tutorial/iframe-export-smoke-fixture.ts";
import { loadKpIframeExportSmokeFixtureDocument } from "./support/tutorial-launch-smoke.ts";

test("iframe export smoke fixture renders artifact document in the browser", async ({
  page
}) => {
  const fixture = createLinearSolveIframeExportSmokeFixture(0.5);

  await loadKpIframeExportSmokeFixtureDocument(page, fixture);

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    "artifact.linear-solve.iframe"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-profile",
    "export.linear-solve.iframe"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-export-payload",
    "html-document"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-card",
    "tutorial.linear-solve.card.live-sample"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-progress",
    "0.5"
  );

  const artifactJson = await page
    .locator("[data-kp-export-artifact-json]")
    .textContent();

  expect(JSON.parse(artifactJson ?? "{}")).toMatchObject({
    id: "artifact.linear-solve.iframe",
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.iframe",
    payloadKind: "html-document",
    dependencies: {
      phases: ["critical", "interactive"]
    },
    fallback: {
      strategy: "static-snapshot",
      preservesLayout: true
    }
  });
});
