import { expect, test } from "@playwright/test";

test("semantic editor opens the fractional equation reader route", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/", { waitUntil: "networkidle" });
  const link = page.getByRole("link", { name: "Review fraction animation" });
  await expect(link).toHaveAttribute("href", "/reader/solve-fractional-linear/");
  await link.click();

  await expect(page).toHaveURL(/\/reader\/solve-fractional-linear\//);
  await expect(
    page.getByRole("heading", { name: "Solve an equation with a fraction", exact: true })
  ).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-lesson-variant",
    "fractional-linear"
  );
  await expect(page.locator("[data-kp-reader-hydrated]"))
    .toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(page.locator(
    "[data-kp-reader-equation-stage] [data-kp-reader-transition]"
  )).toHaveCount(6);
  await expect(page.locator(".frac-line[data-kp-reader-selector-id]").first()).toBeAttached();
  await expect(page.locator(".mopen.delimcenter[data-kp-reader-selector-id]").first())
    .toBeAttached();
  await expect(page.locator(".mclose.delimcenter[data-kp-reader-selector-id]").first())
    .toBeAttached();
  expect(pageErrors).toEqual([]);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 640 }
]) {
  test(`fractional reader stays finite and contained at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/reader/solve-fractional-linear/", { waitUntil: "networkidle" });
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-responsive-projection",
      "compact-transcript"
    );

    const geometry = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]")!;
      const beats = [...document.querySelectorAll<HTMLElement>("[data-kp-beat]")];
      return {
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        stageHeight: stage.getBoundingClientRect().height,
        beatHeights: beats.map((beat) => beat.getBoundingClientRect().height)
      };
    });
    expect(geometry.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(geometry.stageHeight).toBeLessThanOrEqual(viewport.height * 0.52);
    expect(Math.max(...geometry.beatHeights)).toBeLessThanOrEqual(225);
  });
}
