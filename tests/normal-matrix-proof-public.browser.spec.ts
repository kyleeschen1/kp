import { expect, test } from "@playwright/test";

const route = "/learn/math/normal-matrices/";

test("public proof is readable before and after lazy capability load", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });

  const publication = page.locator("[data-kp-normal-proof-publication]");
  await expect(publication).toBeVisible();
  await expect(publication.getByRole("heading", {
    name: "Why does a normal matrix have an orthonormal eigenbasis?"
  })).toBeVisible();
  await expect(publication.locator("math").first()).toBeAttached();
  await publication.locator(
    "[data-kp-normal-proof-stage-fallback]"
  ).scrollIntoViewIfNeeded();
  await expect(publication).toHaveAttribute(
    "data-kp-normal-proof-capability",
    "ready"
  );
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
});
