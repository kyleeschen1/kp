import { expect, test } from "@playwright/test";

const radicalId = "animation.generated.radical.square-root-as-power";
const quadraticId = "animation.algebra.quadratic.solution-branching";

test("Workbench reuses the live player and preserves direct seek and rewind", async ({
  page
}) => {
  await page.goto(
    `/?view=animation-workbench&q=radical&workbenchAnimation=${radicalId}`
  );
  const workbench = page.locator("[data-kp-animation-workbench]");
  const player = workbench.locator("[data-kp-editor-animation-player]");

  await expect(workbench).toBeVisible();
  await expect(player).toHaveAttribute("data-kp-editor-animation-id", radicalId);
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(
    page.locator(
      '[data-kp-animation-workbench-acceptance-kind="semantic-law"]'
    )
  ).toHaveCount(2);
  await expect(
    page.locator("[data-kp-animation-workbench-acceptance]")
  ).toContainText("animation.seek-rewind");
  await expect(
    page.locator("[data-kp-animation-workbench-lifecycle-facet]")
  ).toHaveCount(7);

  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.5");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.5");
  await player.locator('[data-action="rewind-editor-animation"]').click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
});

test("Workbench planned quadratic never mounts a player", async ({ page }) => {
  await page.goto(
    `/?view=animation-workbench&q=quadratic&workbenchAnimation=${quadraticId}`
  );

  await expect(
    page.locator(`[data-kp-animation-workbench-selection="${quadraticId}"]`)
  ).toBeVisible();
  await expect(
    page.locator("[data-kp-animation-workbench-planned-preview]")
  ).toBeVisible();
  await expect(
    page.locator("[data-kp-animation-workbench-missing-evidence]")
  ).toContainText("Semantic law checks will appear");
  await expect(
    page.locator(
      '[data-kp-animation-workbench-lifecycle-facet="playability"]'
    )
  ).toHaveAttribute("data-state", "planned-only");
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
});
