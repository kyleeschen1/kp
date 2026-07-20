import { expect, test } from "@playwright/test";

test("cancellation material meets through a readable zero witness", async ({ page }) => {
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=553"
  );
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-annihilation-witness-readable",
    "true"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-annihilation-phase",
    "witness-dwell"
  );
  const witness = page.locator("[data-kp-reader-annihilation-witness]");
  await expect(witness.locator(".katex")).toHaveText("0");
  await expect.poll(async () => Number(await witness.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeGreaterThan(0.8);
});
