import { expect, test } from "@playwright/test";

const routeCases = [
  {
    title: "default catalogue",
    href: "/",
    selector: "[data-kp-svelte-catalogue-shell]"
  },
  {
    title: "explicit editor fallback",
    href: "/?view=editor",
    selector: ".editor-shell"
  },
  {
    title: "concept compatibility room",
    href: "/concepts/mathematics/linear-equations/solve-with-balance",
    selector: "[data-kp-concept-room-shell]"
  },
  {
    title: "Scheme factorial tutorial",
    href: "/tutorials/programming/scheme-factorial/",
    selector: "[data-kp-scheme-factorial-focus-publication]"
  },
  {
    title: "Lisp function-application tutorial",
    href: "/tutorials/programming/lisp-function-application/",
    selector: "[data-kp-lisp-function-application-tutorial]"
  },
  {
    title: "economics demand-shift tutorial",
    href: "/tutorials/economics/demand-shift/",
    selector: "[data-kp-economics-demand-shift-tutorial]"
  }
] as const;

for (const route of routeCases) {
  test(`${route.title} mounts through one selected legacy root`, async ({
    page
  }) => {
    await page.goto(route.href);
    await expect(page.locator(route.selector)).toHaveCount(1);
  });
}
