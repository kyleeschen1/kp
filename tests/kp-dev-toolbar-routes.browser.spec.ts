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

    await expect.poll(() => page.locator("[data-kp-dev-review-shell]").evaluate(
      (shell) => shell.shadowRoot?.querySelector<HTMLElement>(".launcher")
        ?.style.display
    )).toBe("none");

    await toolbar.getByRole("button", { name: "Review" }).click();
    await expect(page.getByRole("dialog", { name: "Review this moment" }))
      .toBeVisible();
  });
}
