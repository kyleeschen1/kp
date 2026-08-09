import { expect, test } from "@playwright/test";

const rootRoutes = [
  {
    name: "catalogue",
    href: "/",
    ready: "[data-kp-svelte-catalogue-shell]",
    pageId: "studio.catalogue"
  },
  {
    name: "editor",
    href: "/?view=editor",
    ready: "[data-kp-editor-animation-library]",
    pageId: "studio.editor"
  },
  {
    name: "dashboard",
    href: "/?view=dashboard",
    ready: "[data-kp-project-dashboard]",
    pageId: "studio.dashboard"
  },
  {
    name: "animation library host",
    href: "/?view=animation-library-host",
    ready: "[data-kp-editor-animation-library-host]",
    pageId: "studio.animation-library-host"
  },
  {
    name: "animation workbench",
    href: "/?view=animation-workbench",
    ready: "[data-kp-animation-workbench]",
    pageId: "studio.animation-workbench"
  },
  {
    name: "FTC tutorial",
    href: "/?view=ftc-tutorial",
    ready: "[data-kp-ftc-tutorial-host]",
    pageId: "tutorial.ftc"
  },
  {
    name: "linear-equation concept room",
    href: "/concepts/mathematics/linear-equations/solve-with-balance",
    ready: "[data-kp-concept-room-shell]",
    pageId: "tutorial.linear-equation-concept"
  }
] as const;

for (const route of rootRoutes) {
  test(`${route.name} has one page directory with the correct identity`, async ({
    page
  }) => {
    await page.goto(route.href);
    await expect(page.locator(route.ready)).toBeVisible();
    const toolbar = page.getByRole("complementary", {
      name: "Development tools"
    });
    await expect(toolbar).toBeVisible();
    await expect(page.locator("[data-kp-dev-toolbar]")).toHaveCount(1);
    const pages = toolbar.locator(
      "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
    );
    await pages.locator("summary").click();
    const navigation = pages.getByRole("navigation", {
      name: "Development pages"
    });
    await expect(navigation.locator("[aria-current='page']")).toHaveCount(1);
    await expect(navigation.locator(
      `[data-kp-dev-toolbar-page="${route.pageId}"]`
    )).toHaveAttribute("aria-current", "page");
  });
}
