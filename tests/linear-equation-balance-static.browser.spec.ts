import { expect, test } from "@playwright/test";

import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test.beforeEach(async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto(conceptPath);
  await expect(page.locator("[data-kp-concept-room-mounted=true]")).toHaveCount(1);
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const adapter = await import("/src/app-adapters/linear-equation-balance-svg.ts");
    const root = document.createElement("div");
    root.id = "balance-static-fixture";
    root.dataset["kpConceptViewport"] = "true";
    root.style.width = "640px";
    document.querySelector<HTMLElement>(
      '[data-kp-concept-id="mathematics.linear-equations.solve-with-balance"]'
    )!.append(root);
    const controller = adapter.createBalanceSceneController(root, inputTrace, {
      diagramSemanticId: "diagram.balance"
    });
    controller.render(0, ["term.two-x", "diagram.balance"]);
    window.__kpBalanceStatic = controller;
  }, trace);
});

test("static balance uses themed SVG objects, KaTeX labels, and an accessible group tree", async ({ page }) => {
  const scene = page.locator("#balance-static-fixture [data-kp-balance-scene]");
  const stageRoot = page.locator("#balance-static-fixture [data-kp-balance-stage-root]");
  await expect(scene).toHaveAttribute("data-kp-theme", "kp.concept-room.linear-equation-exemplar.v1");
  await expect(scene).toHaveAttribute("data-kp-balance-stage", "initial");
  await expect(scene).toHaveAttribute("aria-label", /2 times x plus 3 equals 8/);
  await expect(scene.getByRole("group", { name: /left side: 2 times x plus 3/ })).toHaveCount(1);
  await expect(scene.getByRole("group", { name: /right side: 8/ })).toHaveCount(1);
  await expect(scene.locator("title")).toHaveText(/Balanced equation/);
  await expect(scene.locator("desc")).toHaveText(/Two x blocks and three unit weights/);
  await expect(scene.locator('[data-kp-balance-unit-kind="variable-unit"]')).toHaveCount(2);
  await expect(scene.locator('[data-kp-balance-unit-kind="integer-unit"]')).toHaveCount(11);
  await expect(stageRoot.locator("[data-kp-balance-pivot]")).toBeVisible();
  await expect(stageRoot.locator('[data-kp-balance-support="fulcrum"]')).toBeVisible();
  await expect(stageRoot.locator("[data-kp-balance-support-overlay]")).toHaveAttribute("aria-hidden", "true");
  await expect(scene.locator("[data-kp-balance-unit] .katex")).toHaveCount(13);
  await expect(scene.locator("text, canvas, animate, animateTransform")).toHaveCount(0);
  expect(await scene.locator("[fill], [stroke]").evaluateAll((elements) => elements.every((element) => {
    const values = [element.getAttribute("fill"), element.getAttribute("stroke")].filter(Boolean);
    return values.every((value) => value === "none" || value!.startsWith("var(--kp-concept-"));
  }))).toBe(true);

  const focusedVariableStroke = await scene.locator(
    '[data-kp-semantic-id="term.two-x"] [data-kp-balance-object-shape]'
  ).first().evaluate((element) => getComputedStyle(element).stroke);
  expect(focusedVariableStroke).toBe("rgb(31, 99, 113)");
});

test("static endpoints expose matched subtraction and the exact unsplit-remainder partition", async ({ page }) => {
  const scene = page.locator("#balance-static-fixture [data-kp-balance-scene]");
  const stageRoot = page.locator("#balance-static-fixture [data-kp-balance-stage-root]");
  await page.evaluate(() => window.__kpBalanceStatic!.render(500, ["operation.subtract-three"]));
  await expect(scene).toHaveAttribute("data-kp-balance-stage", "after-subtraction");
  await expect(stageRoot.locator("[data-kp-balance-pivot]")).toBeVisible();
  await expect(stageRoot.locator('[data-kp-balance-support="fulcrum"]')).toBeVisible();
  await expect(scene.locator("[data-kp-balance-unit]")).toHaveCount(7);
  await expect(scene.locator('[data-kp-balance-math-label="operation"] .katex')).toHaveCount(2);
  await expect(scene.locator('[data-kp-operation-semantic-id="operation.subtract-three"]')).toHaveCount(2);

  await page.evaluate(() => window.__kpBalanceStatic!.render(1000, ["operation.divide-two"]));
  await expect(scene).toHaveAttribute("data-kp-balance-stage", "solved-partition");
  await expect(stageRoot.locator("[data-kp-balance-pivot]")).toBeVisible();
  await expect(stageRoot.locator('[data-kp-balance-support="fulcrum"]')).toBeVisible();
  await expect(scene.locator("[data-kp-balance-unit]")).toHaveCount(7);
  await expect(scene.locator("[data-kp-balance-partition-group]")).toHaveCount(2);
  await expect(scene.locator("[data-kp-balance-group-guide]")).toHaveCount(4);
  await expect(scene.locator("[data-kp-balance-shared-remainder]")).toHaveCount(1);
  await expect(scene.locator('[data-kp-balance-unit="balance.right.unit.4"]')).toHaveCount(1);
  await expect(scene.locator('[data-kp-balance-math-label="share"] .katex')).toHaveCount(2);
  await expect(scene.locator('[data-kp-balance-math-label="result"] .katex')).toHaveCount(1);
  await expect(scene).toHaveAttribute("aria-label", /x equals 5 over 2/);
  await expect(scene.locator("canvas, text, animate, animateTransform")).toHaveCount(0);
});

test("the polished balance remains bounded at desktop and phone widths", async ({ page }) => {
  const root = page.locator("#balance-static-fixture");
  await page.evaluate(() => window.__kpBalanceStatic!.render(1000));
  for (const width of [640, 360]) {
    await root.evaluate((element, nextWidth) => {
      (element as HTMLElement).style.width = `${nextWidth}px`;
    }, width);
    const bounds = await root.evaluate((element) => {
      const rootBox = element.getBoundingClientRect();
      const sceneBox = element.querySelector("svg")!.getBoundingClientRect();
      return {
        rootWidth: rootBox.width,
        sceneLeft: sceneBox.left,
        sceneRight: sceneBox.right,
        rootLeft: rootBox.left,
        rootRight: rootBox.right,
        canvasCount: element.querySelectorAll("canvas").length
      };
    });
    expect(bounds.canvasCount).toBe(0);
    expect(bounds.sceneLeft).toBeGreaterThanOrEqual(bounds.rootLeft - 1);
    expect(bounds.sceneRight).toBeLessThanOrEqual(bounds.rootRight + 1);
    expect(bounds.rootWidth).toBe(width);
  }
});

declare global {
  interface Window {
    __kpBalanceStatic?: {
      render(progressPermille: number, focus?: readonly string[]): unknown;
    };
  }
}
