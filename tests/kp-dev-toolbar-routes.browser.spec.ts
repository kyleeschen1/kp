import { expect, test } from "@playwright/test";

for (const route of [
  {
    name: "Lisp tutorial",
    href: "/tutorials/programming/lisp-function-application/",
    ready: "[data-kp-lisp-function-application-tutorial]"
  },
  {
    name: "animation catalogue",
    href: "/?artifact=animation.dot-projection.basic",
    ready: "[data-kp-svelte-catalogue-shell]"
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
    await expect(pages.getByText("Pages", { exact: true })).toBeVisible();
    await pages.getByText("Pages", { exact: true }).click();
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
    await expect(navigation.getByRole("link")).toHaveCount(23);

    const current = navigation.locator("[aria-current='page']");
    await expect(current).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(pages).not.toHaveAttribute("open", "");
    await expect(pages.getByText("Pages", { exact: true })).toBeFocused();
    await expect(pages.getByText("Pages", { exact: true }))
      .toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(pages).toHaveAttribute("open", "");
    await expect(pages.getByText("Pages", { exact: true }))
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
