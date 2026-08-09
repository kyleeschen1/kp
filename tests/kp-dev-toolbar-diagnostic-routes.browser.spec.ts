import { expect, test } from "@playwright/test";

for (const route of [
  {
    name: "canonical animation review",
    href: "/canonical-animation-review.html",
    ready: "[data-kp-animation-library][data-catalog-ready='true']",
    pageId: "diagnostic.canonical-animation-review"
  },
  {
    name: "glyph reconciliation",
    href: "/glyph-reconciliation-experiment.html",
    ready: "[data-kp-glyph-review][data-kp-ready='true']",
    pageId: "diagnostic.glyph-reconciliation"
  }
] as const) {
  test(`${route.name} shares one development toolbar and Review owner`, async ({
    page
  }) => {
    await page.goto(route.href);
    await expect(page.locator(route.ready)).toBeAttached();
    await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
    const toolbar = page.getByRole("complementary", {
      name: "Development tools"
    });
    await expect(toolbar).toHaveCount(1);
    await expect(page.locator("[data-kp-dev-review-shell] button.launcher"))
      .toBeHidden();
    const pages = toolbar.locator(
      "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
    );
    await pages.locator("summary").click();
    await expect(pages.locator(
      `[data-kp-dev-toolbar-page="${route.pageId}"]`
    )).toHaveAttribute("aria-current", "page");
    if (route.pageId === "diagnostic.canonical-animation-review") {
      await expect(page.locator("[data-kp-animation-library]"))
        .toHaveAttribute("data-preview-ready", "true");
      await expect(page.frameLocator("[data-animation-library-frame]")
        .locator("[data-kp-dev-toolbar]")).toHaveCount(0);
    }
    await page.keyboard.press("Escape");
    await toolbar.getByRole("button", { name: "Review" }).click();
    await expect(page.getByRole("dialog", { name: "Review this moment" }))
      .toBeVisible();
  });
}
