import { expect, test } from "@playwright/test";

import { kpDevelopmentPages } from "../src/dev-toolbar/development-page-directory.ts";

const readySelectors: Readonly<Record<string, string>> = Object.freeze({
  "studio.catalogue": "[data-kp-svelte-catalogue-shell]",
  "studio.editor": "[data-kp-editor-animation-library]",
  "studio.dashboard": "[data-kp-project-dashboard]",
  "studio.animation-library-host": "[data-kp-editor-animation-library-host]",
  "studio.animation-workbench": "[data-kp-animation-workbench]",
  "tutorial.ftc": "[data-kp-ftc-tutorial-host]",
  "tutorial.linear-equation-concept": "[data-kp-concept-room-shell]",
  "tutorial.economics-demand-shift": "[data-kp-economics-static-publication]",
  "tutorial.algebra-fraction-composition":
    "[data-kp-algebra-fraction-composition-publication]",
  "tutorial.lisp-function-application":
    "[data-kp-lisp-function-application-tutorial]",
  "diagnostic.canonical-animation-review":
    "[data-kp-animation-library][data-catalog-ready='true']",
  "diagnostic.glyph-reconciliation":
    "[data-kp-glyph-review][data-kp-ready='true']"
});

const reviewOwnerIds = new Set([
  "studio.catalogue",
  "studio.editor",
  "studio.animation-library-host",
  "studio.animation-workbench",
  "tutorial.economics-demand-shift",
  "tutorial.algebra-fraction-composition",
  "tutorial.lisp-function-application",
  "diagnostic.canonical-animation-review",
  "diagnostic.glyph-reconciliation",
  ...kpDevelopmentPages
    .filter(({ group }) => group === "readers")
    .map(({ id }) => id)
]);

test("the rendered directory contains exactly the declared real links", async ({
  page
}) => {
  await page.goto("/");
  await expect(page.locator("[data-kp-svelte-catalogue-shell]")).toBeVisible();
  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  const pages = toolbar.locator(
    "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
  );
  await pages.locator("summary").click();
  const rendered = await pages.locator("[data-kp-dev-toolbar-page]")
    .evaluateAll((links) => links.map((link) => ({
      id: link.getAttribute("data-kp-dev-toolbar-page"),
      href: link.getAttribute("href")
    })));

  expect(rendered).toEqual(kpDevelopmentPages.map(({ id, href }) => ({
    id,
    href
  })));
  expect(rendered.some(({ href }) => href?.includes("fixture"))).toBe(false);
});

for (const descriptor of kpDevelopmentPages) {
  test(`${descriptor.label} resolves with the correct page identity`, async ({
    page
  }) => {
    await page.goto(descriptor.href);
    const ready = descriptor.group === "readers"
      ? "body[data-kp-reader-hydrated='true']"
      : readySelectors[descriptor.id];
    if (ready === undefined) {
      throw new Error(`Missing browser-ready selector for ${descriptor.id}.`);
    }
    await expect(page.locator(ready)).toBeAttached();
    const toolbar = page.getByRole("complementary", {
      name: "Development tools"
    });
    await expect(toolbar).toHaveCount(1);
    const pages = toolbar.locator(
      "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
    );
    await pages.locator("summary").click();
    await expect(pages.locator("[aria-current='page']")).toHaveCount(1);
    await expect(pages.locator(
      `[data-kp-dev-toolbar-page="${descriptor.id}"]`
    )).toHaveAttribute("aria-current", "page");

    if (!reviewOwnerIds.has(descriptor.id)) return;
    await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
    await expect(page.locator("[data-kp-dev-review-shell] button.launcher"))
      .toBeHidden();
    await page.keyboard.press("Escape");
    await toolbar.getByRole("button", { name: "Review" }).click();
    await expect(page.getByRole("dialog", { name: "Review this moment" }))
      .toBeVisible();
  });
}
