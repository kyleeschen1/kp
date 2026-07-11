import { expect, type Page } from "@playwright/test";

import type { KpTutorialLaunchTarget } from "../../src/tutorial/launch-targets.ts";
import type { LinearSolveIframeExportSmokeFixture } from "../../src/tutorial/iframe-export-smoke-fixture.ts";

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
