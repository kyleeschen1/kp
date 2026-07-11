import { expect, type Page } from "@playwright/test";

import type { KpTutorialLaunchTarget } from "../../src/tutorial/launch-targets.ts";
import type { LinearSolveIframeExportSmokeFixture } from "../../src/tutorial/iframe-export-smoke-fixture.ts";
import {
  renderKpProgrammingTutorialCardHtmlShell,
  type ProgrammingTutorialCardSample,
  type ProgrammingTutorialCardSampleFrame
} from "../../src/tutorial/programming-card-sample.ts";
import type { LinearSolveStaticStepExportSmokeFixture } from "../../src/tutorial/static-step-export-smoke-fixture.ts";

export async function openKpTutorialLaunchTargetPreview(
  page: Page,
  target: KpTutorialLaunchTarget
): Promise<void> {
  await page.getByRole("button", { name: "Project Dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Project Dashboard", exact: true })
  ).toBeVisible();

  const selectRow = page.locator(target.dashboardSelectRowSelector[0] ?? "");

  await expect(selectRow).toBeVisible();
  await selectRow.click();
  await expect(page.locator("[data-kp-project-agenda-preview]")).toHaveAttribute(
    "data-kp-selected-agenda-row",
    target.dashboardRowId
  );
}

export async function loadKpIframeExportSmokeFixtureDocument(
  page: Page,
  fixture: LinearSolveIframeExportSmokeFixture
): Promise<void> {
  await page.setContent(fixture.html, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    fixture.artifact.id
  );
}

export async function loadKpStaticStepExportSmokeFixtureDocument(
  page: Page,
  fixture: LinearSolveStaticStepExportSmokeFixture
): Promise<void> {
  await page.setContent(fixture.html, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    fixture.sequence.artifact.id
  );
}

export async function loadKpProgrammingTutorialCardSmokeDocument(
  page: Page,
  sample: ProgrammingTutorialCardSample,
  frame: ProgrammingTutorialCardSampleFrame
): Promise<void> {
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
      renderKpProgrammingTutorialCardHtmlShell(sample, frame),
      "</body>",
      "</html>"
    ].join("\n"),
    { waitUntil: "domcontentloaded" }
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-card",
    sample.id
  );
}
