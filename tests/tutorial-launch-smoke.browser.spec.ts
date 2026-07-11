import { expect, test } from "@playwright/test";

import { listKpTutorialLaunchTargets } from "../src/tutorial/launch-targets.ts";
import { openKpTutorialLaunchTargetPreview } from "./support/tutorial-launch-smoke.ts";

for (const target of listKpTutorialLaunchTargets()) {
  test(`tutorial launch target preview is browser-reachable: ${target.id}`, async ({
    page
  }) => {
    await page.goto(target.launchPath);
    await openKpTutorialLaunchTargetPreview(page, target);

    await expect(page.locator("[data-kp-project-agenda-preview]")).toHaveAttribute(
      "data-kp-selected-agenda-row",
      target.dashboardRowId
    );

    for (const selector of target.previewSelectors) {
      await expect(page.locator(selector)).toBeVisible();
    }
  });
}
