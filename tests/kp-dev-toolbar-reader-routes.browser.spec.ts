import { expect, test } from "@playwright/test";

test("the common equation reader exposes one development toolbar", async ({
  page
}) => {
  await page.goto("/reader/solve-x/", { waitUntil: "networkidle" });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-hydrated",
    "true"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  await expect(toolbar).toHaveCount(1);
  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
  await expect(page.locator("[data-kp-dev-review-shell] button.launcher"))
    .toBeHidden();
  await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();

  const pages = toolbar.locator(
    "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
  );
  await pages.locator("summary").click();
  const navigation = pages.getByRole("navigation", {
    name: "Development pages"
  });
  await expect(navigation.locator(
    '[data-kp-dev-toolbar-page="reader.solve-x"]'
  )).toHaveAttribute("aria-current", "page");
  await toolbar.getByRole("button", { name: "Review" }).click();
  await expect(page.getByRole("dialog", { name: "Review this moment" }))
    .toBeVisible();
});
