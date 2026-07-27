import { expect, test } from "@playwright/test";

test("production package exposes one lazy Animation Library host", async ({
  page
}) => {
  await page.goto("/canonical-animation-review.html");
  const library = page.locator(
    '[data-kp-animation-library][data-catalog-ready="true"]'
  );
  await expect(library).toBeVisible();
  await expect(page.locator("[data-animation-library-count]")).toHaveText(
    /\d+ animations/
  );
  const count = Number(
    (await page
      .locator("[data-animation-library-count]")
      .textContent())?.split(" ")[0]
  );
  expect(count).toBeGreaterThan(29);

  const frames = page.locator("[data-animation-library-frame]");
  await expect(frames).toHaveCount(1);
  await expect(frames).toHaveAttribute(
    "src",
    "/reader/radical-succession/"
  );
  await page
    .frameLocator("[data-animation-library-frame]")
    .locator("[data-kp-reader-equation-stage]")
    .waitFor();
  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(0);
});
