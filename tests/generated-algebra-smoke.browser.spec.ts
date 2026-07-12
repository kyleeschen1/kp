import { expect, test } from "@playwright/test";

import {
  createGeneratedAlgebraIframeSmokeFixture
} from "../src/tutorial/generated-algebra-smoke-fixture.ts";
import {
  expectKpTutorialPanelNonblank
} from "./support/tutorial-launch-smoke.ts";

test("generated fraction-expression iframe smoke fixture renders in the browser", async ({
  page
}) => {
  const fixture = createGeneratedAlgebraIframeSmokeFixture(
    "generated.fraction-expression.two-fourths",
    0.5
  );

  await page.setContent(fixture.html, { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    "artifact.generated.fraction-expression.two-fourths.iframe"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-card",
    "tutorial.generated.fraction-expression.two-fourths.card.live-sample"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-fixture",
    "generated.fraction-expression.two-fourths"
  );
  await expectKpTutorialPanelNonblank(page, "equation");

  const artifactJson = await page
    .locator("[data-kp-export-artifact-json]")
    .textContent();

  expect(JSON.parse(artifactJson ?? "{}")).toMatchObject({
    id: "artifact.generated.fraction-expression.two-fourths.iframe",
    metadata: {
      generatedFixtureId: "generated.fraction-expression.two-fourths",
      generatedFixtureFamilyId: "generated.fraction-expression"
    }
  });
  expect(fixture.dependencyManifest.fixtureFamilyId).toBe(
    "generated.fraction-expression"
  );
});

test("generated radical iframe smoke fixture renders in the browser", async ({
  page
}) => {
  const fixture = createGeneratedAlgebraIframeSmokeFixture(
    "generated.radical.square-root-as-power",
    0.5
  );

  await page.setContent(fixture.html, { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    "artifact.generated.radical.square-root-as-power.iframe"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-card",
    "tutorial.generated.radical.square-root-as-power.card.live-sample"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-fixture",
    "generated.radical.square-root-as-power"
  );
  await expectKpTutorialPanelNonblank(page, "equation");

  const artifactJson = await page
    .locator("[data-kp-export-artifact-json]")
    .textContent();

  expect(JSON.parse(artifactJson ?? "{}")).toMatchObject({
    id: "artifact.generated.radical.square-root-as-power.iframe",
    metadata: {
      generatedFixtureId: "generated.radical.square-root-as-power",
      generatedFixtureFamilyId: "generated.radical"
    }
  });
  expect(fixture.dependencyManifest.flashcardIds).toEqual([
    "card.generated.radical.square-root-as-power.explain-radical-power"
  ]);
  expect(fixture.dependencyManifest.fixtureFamilyId).toBe("generated.radical");
});
