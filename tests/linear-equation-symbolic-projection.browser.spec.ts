import { expect, test } from "@playwright/test";

import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

test("KaTeX adapter renders, seeks, rewinds, and preserves semantic token identity", async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto("/concepts/mathematics/linear-equations/solve-with-balance");
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const adapter = await import("/src/app-adapters/symbolic-equation-dom.ts");
    const root = document.createElement("div");
    root.id = "symbolic-projection-browser-fixture";
    document.body.append(root);
    const controller = adapter.createSymbolicEquationController(root, inputTrace);
    controller.render(0);
    (window as typeof window & { __kpSymbolicFixture?: typeof controller }).__kpSymbolicFixture = controller;
  }, trace);
  const equation = page.locator("#symbolic-projection-browser-fixture [data-kp-symbolic-equation]");
  await expect(equation).toHaveAttribute("data-kp-frame-id", "frame.initial");
  await expect(equation.locator(".katex")).toHaveCount(5);
  await expect(equation.locator('[data-kp-semantic-id="term.two-x"]')).toHaveCount(1);

  await page.evaluate(() => window.__kpSymbolicFixture?.render(1000));
  await expect(equation).toHaveAttribute("data-kp-frame-id", "frame.step.2");
  await expect(equation.locator('[data-kp-semantic-id="term.two-x"]')).toHaveCount(1);
  await expect(equation).toHaveAttribute("aria-label", /x equals 5 over 2/);

  await page.evaluate(() => window.__kpSymbolicFixture?.render(0));
  await expect(equation).toHaveAttribute("data-kp-frame-id", "frame.initial");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.__kpSymbolicFixture?.render(500));
  await expect(equation).toHaveAttribute("data-kp-frame-id", "frame.step.1");
});

declare global {
  interface Window {
    __kpSymbolicFixture?: {
      render(progressPermille: number): unknown;
      dispose(): void;
    };
  }
}
