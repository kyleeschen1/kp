import { expect, test } from "@playwright/test";

for (const route of [
  {
    name: "Lisp tutorial",
    href: "/tutorials/programming/lisp-function-application/",
    ready: "[data-kp-lisp-function-application-tutorial]",
    pageId: "tutorial.lisp-function-application"
  },
  {
    name: "animation catalogue",
    href: "/?artifact=animation.dot-projection.basic",
    ready: "[data-kp-svelte-catalogue-shell]",
    pageId: "studio.catalogue"
  }
] as const) {
  test(`${route.name} adopts the shared development toolbar`, async ({ page }) => {
    await page.goto(route.href);
    await expect(page.locator(route.ready)).toBeVisible();

    const toolbar = page.getByRole("complementary", {
      name: "Development tools"
    });
    await expect(toolbar).toBeVisible();
    await expect(page.locator("[data-kp-dev-toolbar]")).toHaveCount(1);
    await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
    await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();
    const pages = toolbar.locator("[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']");
    await expect(pages.getByText("View", { exact: true })).toBeVisible();
    await pages.getByText("View", { exact: true }).click();
    const navigation = pages.getByRole("navigation", {
      name: "Development pages"
    });
    await expect(navigation.getByRole("link", {
      name: "Economics · demand shift"
    })).toHaveAttribute("href", "/tutorials/economics/demand-shift/");
    await expect(navigation.getByRole("link", {
      name: "Solve x",
      exact: true
    })).toHaveAttribute("href", "/reader/solve-x/");
    await expect(navigation.getByRole("link")).toHaveCount(29);

    const current = navigation.locator("[aria-current='page']");
    await expect(current).toHaveCount(1);
    await expect(navigation.locator(
      `[data-kp-dev-toolbar-page="${route.pageId}"]`
    )).toHaveAttribute("aria-current", "page");

    await page.keyboard.press("Escape");
    await expect(pages).not.toHaveAttribute("open", "");
    await expect(pages.getByText("View", { exact: true })).toBeFocused();
    await expect(pages.getByText("View", { exact: true }))
      .toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(pages).toHaveAttribute("open", "");
    await expect(pages.getByText("View", { exact: true }))
      .toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(navigation.getByRole("link", {
      name: "Animation catalogue"
    })).toBeFocused();

    await expect.poll(() => page.locator("[data-kp-dev-review-shell]").evaluate(
      (shell) => shell.shadowRoot?.querySelector<HTMLElement>(".launcher")
        ?.style.display
    )).toBe("none");

    await toolbar.getByRole("button", { name: "Review" }).click();
    await expect(page.getByRole("dialog", { name: "Review this moment" }))
      .toBeVisible();
  });
}
