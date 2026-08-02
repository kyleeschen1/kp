import { expect, test } from "@playwright/test";

const animationId =
  "animation.generated.linear-algebra.matrix-vector.two-by-two";

test("rank-6 matrix-vector exemplar preserves exact row-dot playback", async ({
  page
}) => {
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });

  await page.goto(`/?artifact=${animationId}`);
  const catalogue = page.locator("[data-kp-animation-catalogue]");
  const player = catalogue.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const transition = player.locator(
    "[data-kp-editor-equation-transition-id]"
  );
  const scrubber = player.locator('[data-action="seek-editor-animation"]');

  await expect(catalogue).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  )).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.equation.katex"
  );
  await expect(player.locator("[data-kp-editor-animation-stage]"))
    .toHaveAttribute("data-kp-editor-animation-surface", "composite");
  const graphSlot = player.locator(
    '[data-kp-editor-animation-surface-slot="graph"]'
  );
  await expect(graphSlot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.graph.svg"
  );
  await expect(graphSlot).toHaveAttribute(
    "data-kp-editor-animation-adapter-status",
    "ready"
  );
  await expect(graphSlot.locator("[data-kp-editor-graph-svg]"))
    .toHaveAttribute(
      "data-kp-graph-language-profile",
      "kp.graph.dimensional-continuity.v1"
    );

  await scrubber.fill("0.18");
  const operationBank = transition.locator(
    "[data-kp-editor-matrix-operation-bank]"
  );
  await expect(operationBank).toBeVisible();
  await expect(operationBank).toHaveAttribute(
    "data-kp-editor-matrix-operation-input-policy",
    "persistent-reference"
  );
  await expect(operationBank).toHaveAttribute(
    "data-kp-editor-matrix-operation-depletion",
    "false"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-matrix-vector-active-row",
    "0"
  );
  await expect(transition.locator(
    '[data-kp-editor-matrix-vector-row="0"]'
  )).toContainText("2×4+1×5=13");

  await scrubber.fill("0.52");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-matrix-vector-resolved-through",
    "0"
  );
  await expect(operationBank.locator(
    '[data-kp-editor-matrix-operation-product="0.0"]'
  )).toContainText("=8");
  await expect(operationBank.locator(
    '[data-kp-editor-matrix-operation-fold="0"]'
  )).toHaveAttribute(
    "data-kp-editor-matrix-operation-fold-phase",
    "coordinate"
  );
  await expect(operationBank.locator(
    '[data-kp-editor-matrix-operation-fold="0"]'
  )).toContainText("8+5");
  await expect(graphSlot.locator("[data-kp-matrix-linear-map-view]"))
    .toHaveAttribute("data-kp-matrix-linear-map-grid-progress", "0");

  await scrubber.fill("0.8");
  await expect(operationBank.locator(
    '[data-kp-editor-matrix-operation-fold="1"]'
  )).toHaveAttribute(
    "data-kp-editor-matrix-operation-fold-phase",
    "gather"
  );
  await expect(operationBank.locator(
    '[data-kp-editor-matrix-operation-fold="1"]'
  )).toContainText("0+15");
  expect(Number(await graphSlot.locator(
    "[data-kp-matrix-linear-map-view]"
  ).getAttribute("data-kp-matrix-linear-map-vector-progress")))
    .toBeGreaterThan(0);

  await scrubber.fill("1");
  await expect(operationBank.locator(
    '[data-kp-editor-matrix-operation-input="matrix"]'
  )).toHaveCSS("opacity", "1");
  await expect(graphSlot.locator(
    "[data-kp-matrix-linear-map-output-vector]"
  )).toHaveAttribute(
    "data-kp-matrix-linear-map-output-coordinates",
    "13,15"
  );
  await expect(graphSlot.locator(
    "[data-kp-matrix-linear-map-output-vector]"
  )).toHaveCSS("opacity", "1");
  await expect(operationBank.locator(
    '[data-kp-editor-matrix-operation-input="vector"]'
  )).toHaveCSS("opacity", "1");
  await expect(player.locator(
    "[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"
  )).toHaveAttribute(
    "data-kp-editor-equation-object-id",
    "expression.generated.linear-algebra.matrix-vector.two-by-two.result"
  );
  await expect(player.locator("[data-kp-editor-equation-target]"))
    .toContainText("1315");
  expect(documentRequests).toHaveLength(1);
});
