import { expect, test } from "@playwright/test";

const route = "/reader/radical-succession/?kpMotion=full";

test("radical succession uses one exclusive canonical paint owner", async ({
  page
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto(route, { waitUntil: "networkidle" });

  const stage = page.locator("[data-kp-reader-equation-stage]");
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  await scrubber.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "500";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "500"
  );

  const active = stage.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  await expect(active).toHaveAttribute(
    "data-kp-reader-canonical-equation-session",
    "active"
  );
  await expect(active.locator(
    ".kp-reader-canonical-equation-session-material"
  )).toHaveCount(1);
  await expect(active.locator(
    ".kp-reader-equation-material:not(.kp-reader-canonical-equation-session-material) > *"
  )).toHaveCount(0);
  await expect(active.locator(
    '[data-kp-reader-native="target"] [data-kp-reader-equation-state]' +
    '[data-kp-semantic-entity-id$=".radical"]'
  )).toHaveCount(1);
  expect(pageErrors.filter(({ name }) => name !== "KpDevReviewClientError"))
    .toEqual([]);
});
