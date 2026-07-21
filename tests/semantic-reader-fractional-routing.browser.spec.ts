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
