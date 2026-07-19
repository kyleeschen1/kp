import { expect, test } from "@playwright/test";

import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

test("symbolic and SVG balance views share frames, roles, focus, and KaTeX", async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto("/concepts/mathematics/linear-equations/solve-with-balance");
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error These absolute specifiers are resolved by the browser's Vite server.
    const symbolicAdapter = await import("/src/app-adapters/symbolic-equation-dom.ts");
    // @ts-expect-error These absolute specifiers are resolved by the browser's Vite server.
    const balanceAdapter = await import("/src/app-adapters/linear-equation-balance-svg.ts");
    const symbolicRoot = document.createElement("div");
    const balanceRoot = document.createElement("div");
    symbolicRoot.id = "symbolic-theme-fixture";
    balanceRoot.id = "balance-theme-fixture";
    document.body.append(symbolicRoot, balanceRoot);
    const symbolic = symbolicAdapter.createSymbolicEquationController(symbolicRoot, inputTrace);
    const balance = balanceAdapter.createBalanceSceneController(balanceRoot, inputTrace, {
      diagramSemanticId: "diagram.balance"
    });
    symbolic.render(0, ["term.two-x"]);
    balance.render(0, ["term.two-x", "diagram.balance"]);
    window.__kpProjectionParityFixture = { symbolic, balance };
  }, trace);

  // Scope to this projection fixture because the canonical route now mounts its own symbolic stage too.
  const symbolic = page.locator("#symbolic-theme-fixture [data-kp-symbolic-equation]");
  const balance = page.locator("svg[data-kp-balance-scene]");
  await expect(symbolic).toHaveAttribute("data-kp-frame-id", "frame.initial");
  await expect(balance).toHaveAttribute("data-kp-frame-id", "frame.initial");
  await expect(balance).toHaveAttribute("role", "img");
  await expect(balance).toHaveAttribute("aria-label", /2 times x plus 3 equals 8/);
  await expect(balance.locator("foreignObject .katex")).toHaveCount(3);
  await expect(balance.locator("animate, animateTransform")).toHaveCount(0);
  await expect(balance.locator('[data-kp-balance-side="left"]')).toHaveCount(1);
  await expect(balance.locator('[data-kp-balance-side="right"]')).toHaveCount(1);

  const symbolicTerm = symbolic.locator('[data-kp-semantic-id="term.two-x"]');
  const balanceTerm = balance.locator('[data-kp-semantic-id="term.two-x"]');
  await expect(symbolicTerm).toHaveClass(/kp-role-equation-expression/);
  await expect(balanceTerm).toHaveClass(/kp-role-equation-expression/);
  await expect(symbolicTerm).toHaveClass(/kp-role-focus-primary/);
  await expect(balanceTerm).toHaveClass(/kp-role-focus-primary/);
  await expect(balance).toHaveClass(/kp-role-diagram-balance/);
  await expect(balance).toHaveClass(/kp-role-focus-primary/);

  await page.evaluate(() => {
    window.__kpProjectionParityFixture?.symbolic.render(500, ["operation.subtract-three"]);
    window.__kpProjectionParityFixture?.balance.render(500, ["operation.subtract-three"]);
  });
  await expect(symbolic).toHaveAttribute("data-kp-frame-id", "frame.step.1");
  await expect(balance).toHaveAttribute("data-kp-frame-id", "frame.step.1");
  await expect(balance.locator('[data-kp-operation-semantic-id="operation.subtract-three"]')).toHaveCount(2);
  await expect(balance.locator("[data-kp-balance-operation-application]").first()).toHaveClass(
    /kp-role-focus-primary/
  );

  await page.evaluate(() => {
    window.__kpProjectionParityFixture?.symbolic.render(1000);
    window.__kpProjectionParityFixture?.balance.render(1000);
  });
  await expect(symbolic).toHaveAttribute("data-kp-frame-id", "frame.step.2");
  await expect(balance).toHaveAttribute("data-kp-frame-id", "frame.step.2");
  await expect(balance.locator("foreignObject .katex")).toHaveCount(2);
  await expect(balance).toHaveAttribute("aria-label", /x equals 5 over 2/);
});

declare global {
  interface Window {
    __kpProjectionParityFixture?: {
      symbolic: { render(progressPermille: number, focus?: readonly string[]): unknown };
      balance: { render(progressPermille: number, focus?: readonly string[]): unknown };
    };
  }
}
